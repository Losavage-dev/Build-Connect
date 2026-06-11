import type { ContractTemplateId } from "./contractTemplates";
import { getRequestCustomerProfileId } from "./requestCompletion";

export type ContractDealMeta = {
  client_id: string;
  company_id: string | null;
  recipient_profile_id: string | null;
  source_tender_id?: string | null;
};

export type ContractPartyData = {
  name?: string | null;
  bin?: string | null;
  address?: string | null;
  phoneEmail?: string | null;
  representative?: string | null;
  basis?: string | null;
};

export type ContractPartySide = "customer" | "executor" | "buyer" | "supplier";

export type ContractDocumentFields = {
  city: string;
  docDate: string;
  ownParty?: ContractPartyData | null;
  ownPartySide?: ContractPartySide;
  counterpartyParty?: ContractPartyData | null;
  /** Из отклика / заявки */
  servicePrice?: string | null;
};

type ProfileLike = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  role?: string | null;
};

type CompanyLike = {
  name?: string;
  bin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
};

function fillField(value: string | null | undefined): string {
  const v = value?.trim();
  return v || "_________________________";
}

function partyBlock(title: string, party?: ContractPartyData | null): string {
  const hasData = party && Object.values(party).some((v) => typeof v === "string" && v.trim());
  const p = hasData ? party : null;
  const basisLabel =
    title === "ЗАКАЗЧИК:" || title === "ПОКУПАТЕЛЬ:"
      ? "Основание (доверенность / устав)"
      : "Основание";

  return `${title}
  Наименование / ФИО: ${fillField(p?.name)}
  БИН/ИИН (при наличии): ${fillField(p?.bin)}
  Адрес: ${fillField(p?.address)}
  Телефон, email: ${fillField(p?.phoneEmail)}
  Представитель: ${fillField(p?.representative)}
  ${basisLabel}: ${fillField(p?.basis)}`;
}

export function buildPartiesBlock(templateId: ContractTemplateId, fields: ContractDocumentFields): string {
  const { ownParty, ownPartySide, counterpartyParty } = fields;

  if (templateId === "supply") {
    const buyer = ownPartySide === "buyer" ? ownParty : counterpartyParty;
    const supplier = ownPartySide === "supplier" ? ownParty : counterpartyParty;
    return `${partyBlock("ПОКУПАТЕЛЬ:", buyer)}

${partyBlock("ПОСТАВЩИК:", supplier)}`;
  }

  const customer = ownPartySide === "customer" ? ownParty : counterpartyParty;
  const executor = ownPartySide === "executor" ? ownParty : counterpartyParty;
  return `${partyBlock("ЗАКАЗЧИК:", customer)}

${partyBlock("ИСПОЛНИТЕЛЬ:", executor)}`;
}

/** Строка подписи: место для подписи пустое, расшифровка — из реквизитов. */
function buildSignatureLine(party?: ContractPartyData | null): string {
  const printed = party?.representative?.trim() || party?.name?.trim();
  return printed ? `_______________ / ${printed}` : "_______________ / _________________";
}

export function buildSignatureFooter(templateId: ContractTemplateId, fields: ContractDocumentFields): string {
  const { ownParty, ownPartySide, counterpartyParty } = fields;

  if (templateId === "supply") {
    const buyer = ownPartySide === "buyer" ? ownParty : counterpartyParty;
    const supplier = ownPartySide === "supplier" ? ownParty : counterpartyParty;
    return `ПОКУПАТЕЛЬ: ${buildSignatureLine(buyer)}     ПОСТАВЩИК: ${buildSignatureLine(supplier)}
            М.П.                                         М.П.`;
  }

  const customer = ownPartySide === "customer" ? ownParty : counterpartyParty;
  const executor = ownPartySide === "executor" ? ownParty : counterpartyParty;
  return `ЗАКАЗЧИК: ${buildSignatureLine(customer)}     ИСПОЛНИТЕЛЬ: ${buildSignatureLine(executor)}
          М.П.                                       М.П.`;
}

export function resolveOwnPartySide(
  templateId: ContractTemplateId,
  role: string | null | undefined,
): ContractPartySide {
  if (templateId === "supply") {
    if (role === "supplier") return "supplier";
    return "buyer";
  }
  if (role === "client") return "customer";
  return "executor";
}

/** Сторона договора текущего пользователя по конкретной заявке (важнее роли в профиле). */
export function resolveOwnPartySideFromDeal(
  templateId: ContractTemplateId,
  profileId: string,
  deal: ContractDealMeta,
  myCompanyIds: string[],
): ContractPartySide {
  const isCustomer = getRequestCustomerProfileId(deal) === profileId;
  const isProviderCompany = Boolean(deal.company_id && myCompanyIds.includes(deal.company_id));
  const isBidAuthor = Boolean(deal.source_tender_id && deal.client_id === profileId);

  if (templateId === "supply") {
    if (isCustomer) return "buyer";
    if (isProviderCompany || isBidAuthor) return "supplier";
    if (deal.client_id === profileId) return "buyer";
    return "supplier";
  }

  if (isCustomer) return "customer";
  if (isProviderCompany || isBidAuthor) return "executor";
  if (deal.client_id === profileId && !deal.source_tender_id) return "customer";
  return "executor";
}

/** Город в шапке — место выполнения заказа (город тендера / заказчика). */
export function resolveContractDealCity(input: {
  tenderCity?: string | null;
  customerProfileCity?: string | null;
  customerCompanyCity?: string | null;
  fallbackProfileCity?: string | null;
}): string {
  return (
    input.tenderCity?.trim() ||
    input.customerProfileCity?.trim() ||
    input.customerCompanyCity?.trim() ||
    input.fallbackProfileCity?.trim() ||
    "Астана"
  );
}

export function parseQuotedPriceFromDescription(description: string | null | undefined): string | null {
  if (!description?.trim()) return null;
  const match = description.match(/Предлагаемая цена:\s*([\d\s]+)\s*₸/i);
  if (!match?.[1]) return null;
  return match[1].replace(/\s+/g, " ").trim();
}

export function buildOwnPartyFromDb(input: {
  profile: ProfileLike | null;
  userEmail?: string | null;
  company?: CompanyLike | null;
}): ContractPartyData {
  const representative =
    [input.profile?.first_name, input.profile?.last_name].filter(Boolean).join(" ").trim() || null;

  const phoneEmail =
    [input.company?.phone?.trim() || input.profile?.phone?.trim(), input.company?.email?.trim() || input.userEmail?.trim()]
      .filter(Boolean)
      .join(", ") || null;

  const name = input.company?.name?.trim() || representative;
  const address =
    input.company?.address?.trim() ||
    (input.company?.city?.trim() ? `г. ${input.company.city.trim()}` : null) ||
    (input.profile?.city?.trim() ? `г. ${input.profile.city.trim()}` : null);

  return {
    name,
    bin: input.company?.bin?.trim() || null,
    address,
    phoneEmail,
    representative: input.company?.name?.trim() ? representative : representative,
    basis: input.company?.name?.trim() ? "Устав / доверенность" : representative ? "лично" : null,
  };
}

export function defaultContractCity(input: {
  profileCity?: string | null;
  companyCity?: string | null;
}): string {
  return input.companyCity?.trim() || input.profileCity?.trim() || "Астана";
}
