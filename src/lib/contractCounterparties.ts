import type { Request } from "@/hooks/useRequests";
import type { ContractDealMeta, ContractPartyData } from "./contractFields";
import {
  parseQuotedPriceFromDescription,
  resolveContractDealCity,
} from "./contractFields";
import { getRequestCustomerProfileId } from "./requestCompletion";
import { formatPersonName } from "./requestDisplay";
import { isActiveDealStatus } from "./requestWorkflow";

export type CounterpartyRef =
  | { kind: "company"; id: string }
  | { kind: "profile"; id: string };

export type ContractCounterpartyOption = {
  requestId: string;
  requestTitle: string;
  requestStatus: Request["status"];
  label: string;
  ref: CounterpartyRef;
  party: ContractPartyData;
  deal: ContractDealMeta;
  dealCity: string;
  servicePrice: string | null;
  /** company_id заявки, если относится к вашей компании */
  actingCompanyId: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  bin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  owner_id?: string;
  owner?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
};

type ProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
};

export function isActiveDealStatusForContract(status: Request["status"]): boolean {
  return isActiveDealStatus(status);
}

/** Кого подставить как вторую сторону договора для данной заявки. */
export function resolveCounterpartyRef(
  request: Pick<Request, "client_id" | "company_id" | "recipient_profile_id">,
  profileId: string,
): CounterpartyRef | null {
  const incoming = request.client_id !== profileId;

  if (incoming) {
    if (request.recipient_profile_id === profileId) {
      if (request.company_id) return { kind: "company", id: request.company_id };
      return { kind: "profile", id: request.client_id };
    }
    return { kind: "profile", id: request.client_id };
  }

  if (request.recipient_profile_id && request.client_id === profileId) {
    return { kind: "profile", id: request.recipient_profile_id };
  }

  if (request.company_id) {
    return { kind: "company", id: request.company_id };
  }

  return null;
}

export function buildPartyFromCompany(company: CompanyRow): ContractPartyData {
  const representative = formatPersonName(company.owner ?? null, "");
  const phoneEmail =
    [company.phone?.trim(), company.email?.trim(), company.owner?.phone?.trim()].filter(Boolean).join(", ") || null;
  const address =
    company.address?.trim() || (company.city?.trim() ? `г. ${company.city.trim()}` : null);

  return {
    name: company.name?.trim() || null,
    bin: company.bin?.trim() || null,
    address,
    phoneEmail,
    representative: representative || null,
    basis: "Устав / доверенность",
  };
}

export function buildPartyFromProfile(
  profile: ProfileRow,
  ownedCompany?: CompanyRow | null,
): ContractPartyData {
  if (ownedCompany?.name?.trim()) {
    const fromCompany = buildPartyFromCompany(ownedCompany);
    return {
      ...fromCompany,
      phoneEmail: fromCompany.phoneEmail || profile.phone?.trim() || null,
    };
  }

  const name = formatPersonName(profile, "");
  return {
    name: name || null,
    phoneEmail: profile.phone?.trim() || null,
    address: profile.city?.trim() ? `г. ${profile.city.trim()}` : null,
    representative: name || null,
    basis: "лично",
  };
}

const STATUS_SHORT: Record<Request["status"], string> = {
  pending: "на рассмотрении",
  accepted: "в работе",
  rejected: "отклонена",
  completed: "завершена",
};

export function formatCounterpartyOptionLabel(
  request: Pick<Request, "title" | "status">,
  partyName: string,
): string {
  const status = STATUS_SHORT[request.status] || request.status;
  const title = request.title.trim() || "Заявка";
  return `${partyName} · ${title} (${status})`;
}

export function buildCounterpartyOption(
  request: Request & {
    description?: string | null;
    source_tender?: { city?: string | null } | null;
    company?: CompanyRow | null;
    client?: ProfileRow | null;
    recipient?: ProfileRow | null;
  },
  profileId: string,
  companyById: Map<string, CompanyRow>,
  profileById: Map<string, ProfileRow>,
  ownerCompanyByProfileId: Map<string, CompanyRow>,
): ContractCounterpartyOption | null {
  const ref = resolveCounterpartyRef(request, profileId);
  if (!ref) return null;

  let party: ContractPartyData;
  if (ref.kind === "company") {
    const company = request.company?.id === ref.id ? request.company : companyById.get(ref.id);
    if (!company) return null;
    party = buildPartyFromCompany(company);
  } else {
    const profile =
      (request.client_id === ref.id ? request.client : null) ??
      (request.recipient_profile_id === ref.id ? request.recipient : null) ??
      profileById.get(ref.id);
    if (!profile) return null;
    party = buildPartyFromProfile(profile, ownerCompanyByProfileId.get(ref.id));
  }

  const partyName = party.name?.trim() || "Контрагент";
  const customerId = getRequestCustomerProfileId(request);
  const customerProfile =
    request.client_id === customerId
      ? request.client
      : request.recipient_profile_id === customerId
        ? request.recipient
        : profileById.get(customerId);
  const customerCompany = ownerCompanyByProfileId.get(customerId);

  const dealCity = resolveContractDealCity({
    tenderCity: request.source_tender?.city,
    customerProfileCity: customerProfile?.city,
    customerCompanyCity: customerCompany?.city,
  });

  const deal: ContractDealMeta = {
    client_id: request.client_id,
    company_id: request.company_id,
    recipient_profile_id: request.recipient_profile_id,
    source_tender_id: request.source_tender_id,
  };

  const actingCompanyId =
    request.company_id && companyById.has(request.company_id) ? request.company_id : null;

  return {
    requestId: request.id,
    requestTitle: request.title,
    requestStatus: request.status,
    label: formatCounterpartyOptionLabel(request, partyName),
    ref,
    party,
    deal,
    dealCity,
    servicePrice: parseQuotedPriceFromDescription(request.description),
    actingCompanyId,
  };
}
