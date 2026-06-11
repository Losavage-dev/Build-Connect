import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileDown, Loader2, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PageHero, PageContent } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ContractDocumentFields,
  type ContractTemplateId,
} from "@/lib/contractTemplates";
import {
  buildOwnPartyFromDb,
  defaultContractCity,
  resolveOwnPartySide,
  resolveOwnPartySideFromDeal,
} from "@/lib/contractFields";
import { downloadContractDocx, downloadContractPdf } from "@/lib/contractDocumentExport";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useContractCounterparties } from "@/hooks/useContractCounterparties";
import { useAppFormat } from "@/hooks/useAppFormat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NONE_COUNTERPARTY = "__none__";

const CONTRACT_TEMPLATE_IDS: ContractTemplateId[] = ["services", "supply", "act"];

type PartyRoleKey = "customer" | "buyer" | "supplier" | "contractor";

function roleKeyFromOwnSide(side: string): PartyRoleKey {
  if (side === "customer") return "customer";
  if (side === "buyer") return "buyer";
  if (side === "supplier") return "supplier";
  return "contractor";
}

function counterpartyRoleKey(ownSide: string): PartyRoleKey {
  if (ownSide === "customer") return "contractor";
  if (ownSide === "buyer") return "supplier";
  if (ownSide === "supplier") return "buyer";
  return "customer";
}

export default function ContractTemplates() {
  const { t } = useTranslation(["profile", "common"]);
  const { formatDate, formatCurrency } = useAppFormat();
  const { profile, user } = useAuth();
  const caps = useCapabilities();
  const [city, setCity] = useState("Астана");
  const [docDate, setDocDate] = useState(() =>
    formatDate(new Date(), { day: "2-digit", month: "long", year: "numeric" }),
  );
  const [templateId, setTemplateId] = useState<ContractTemplateId>("services");
  const [companyId, setCompanyId] = useState("");
  const [counterpartyRequestId, setCounterpartyRequestId] = useState(NONE_COUNTERPARTY);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["my-companies-contract", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, city, address, phone, email, bin")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: counterparties = [], isLoading: counterpartiesLoading } = useContractCounterparties(profile?.id);

  const selectedCounterparty = useMemo(
    () => counterparties.find((c) => c.requestId === counterpartyRequestId) ?? null,
    [counterparties, counterpartyRequestId],
  );

  useEffect(() => {
    if (counterpartyRequestId === NONE_COUNTERPARTY) return;
    if (!counterparties.some((c) => c.requestId === counterpartyRequestId)) {
      setCounterpartyRequestId(NONE_COUNTERPARTY);
    }
  }, [counterparties, counterpartyRequestId]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId) ?? companies[0] ?? null,
    [companies, companyId],
  );

  useEffect(() => {
    if (!companies.length) return;
    if (!companyId || !companies.some((c) => c.id === companyId)) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  useEffect(() => {
    if (cityTouched) return;
    if (selectedCounterparty?.dealCity) {
      setCity(selectedCounterparty.dealCity);
      return;
    }
    setCity(
      defaultContractCity({
        profileCity: profile?.city,
        companyCity: selectedCompany?.city,
      }),
    );
  }, [profile?.city, selectedCompany?.city, selectedCounterparty?.dealCity, cityTouched]);

  useEffect(() => {
    if (!selectedCounterparty?.actingCompanyId) return;
    if (companies.some((c) => c.id === selectedCounterparty.actingCompanyId)) {
      setCompanyId(selectedCounterparty.actingCompanyId);
    }
  }, [selectedCounterparty?.actingCompanyId, companies]);

  const ownPartySide = selectedCounterparty
    ? resolveOwnPartySideFromDeal(templateId, profile?.id ?? "", selectedCounterparty.deal, caps.myCompanyIds)
    : resolveOwnPartySide(templateId, profile?.role);

  const ownParty = useMemo(
    () =>
      buildOwnPartyFromDb({
        profile,
        userEmail: user?.email,
        company: selectedCompany,
      }),
    [profile, user?.email, selectedCompany],
  );

  const documentFields: ContractDocumentFields = {
    city,
    docDate,
    ownParty,
    ownPartySide,
    counterpartyParty: selectedCounterparty?.party ?? null,
    servicePrice: selectedCounterparty?.servicePrice ?? null,
  };

  const ownPartyLabel = t(`contracts.roles.${roleKeyFromOwnSide(ownPartySide)}`);
  const counterpartyLabel = t(`contracts.roles.${counterpartyRoleKey(ownPartySide)}`);

  const runExport = async (kind: "docx" | "pdf") => {
    if (kind === "docx") setExportingDocx(true);
    else setExportingPdf(true);
    try {
      if (kind === "docx") {
        await downloadContractDocx(templateId, documentFields);
        toast.success(t("contracts.docxSaved"));
      } else {
        await downloadContractPdf(templateId, documentFields);
        toast.success(t("contracts.pdfSaved"));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("contracts.exportError");
      toast.error(msg);
    } finally {
      if (kind === "docx") setExportingDocx(false);
      else setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow={t("contracts.eyebrow")}
        eyebrowIcon={FileText}
        title={t("contracts.title")}
        description={t("contracts.subtitle")}
        compact
        actions={
          <Button variant="ghost" asChild className="rounded-xl">
            <Link to="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("contracts.backToProfile")}
            </Link>
          </Button>
        }
      />

      <PageContent className="border-b-0">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">{t("contracts.paramsTitle")}</CardTitle>
              <CardDescription>{t("contracts.paramsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="template-type">{t("contracts.docType")}</Label>
                <Select value={templateId} onValueChange={(v) => setTemplateId(v as ContractTemplateId)}>
                  <SelectTrigger id="template-type" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TEMPLATE_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {t(`contracts.templateLabels.${id}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {companies.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="contract-company">{t("contracts.yourCompany")}</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger id="contract-company" className="rounded-xl">
                      <SelectValue placeholder={t("contracts.selectCompany")} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="contract-counterparty">{t("contracts.counterparty")}</Label>
                <Select value={counterpartyRequestId} onValueChange={setCounterpartyRequestId}>
                  <SelectTrigger id="contract-counterparty" className="rounded-xl">
                    <SelectValue placeholder={t("contracts.selectRequest")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_COUNTERPARTY}>{t("contracts.counterpartyNone")}</SelectItem>
                    {counterparties.map((option) => (
                      <SelectItem key={option.requestId} value={option.requestId}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {counterpartiesLoading ? (
                  <p className="text-xs text-muted-foreground">{t("contracts.loadingDeals")}</p>
                ) : counterparties.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("contracts.noActiveDeals")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("contracts.activeDealsHint")}</p>
                )}
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-foreground">{t("contracts.yourDetails", { role: ownPartyLabel })}</p>
                {companiesLoading ? (
                  <p className="text-muted-foreground">{t("contracts.loadingData")}</p>
                ) : (
                  <>
                    <p>
                      <span className="text-muted-foreground">{t("contracts.nameLabel")} </span>
                      {ownParty.name || t("contracts.nameEmpty")}
                    </p>
                    {ownParty.bin ? (
                      <p>
                        <span className="text-muted-foreground">{t("contracts.binLabel")} </span>
                        {ownParty.bin}
                      </p>
                    ) : null}
                    {ownParty.address ? (
                      <p>
                        <span className="text-muted-foreground">{t("contracts.addressLabel")} </span>
                        {ownParty.address}
                      </p>
                    ) : null}
                    {ownParty.phoneEmail ? (
                      <p>
                        <span className="text-muted-foreground">{t("contracts.contactsLabel")} </span>
                        {ownParty.phoneEmail}
                      </p>
                    ) : null}
                    {!ownParty.name && !companies.length ? (
                      <p className="text-muted-foreground">{t("contracts.fillProfileHint")}</p>
                    ) : null}
                  </>
                )}
              </div>

              {selectedCounterparty ? (
                <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">
                    {t("contracts.counterpartyDetails", {
                      role: counterpartyLabel,
                      name: selectedCounterparty.party.name,
                    })}
                  </p>
                  {selectedCounterparty.party.bin ? (
                    <p>
                      <span className="text-muted-foreground">{t("contracts.binLabel")} </span>
                      {selectedCounterparty.party.bin}
                    </p>
                  ) : null}
                  {selectedCounterparty.party.address ? (
                    <p>
                      <span className="text-muted-foreground">{t("contracts.addressLabel")} </span>
                      {selectedCounterparty.party.address}
                    </p>
                  ) : null}
                  {selectedCounterparty.party.phoneEmail ? (
                    <p>
                      <span className="text-muted-foreground">{t("contracts.contactsLabel")} </span>
                      {selectedCounterparty.party.phoneEmail}
                    </p>
                  ) : null}
                  {selectedCounterparty.servicePrice ? (
                    <p>
                      <span className="text-muted-foreground">{t("contracts.priceFromBid")} </span>
                      {formatCurrency(selectedCounterparty.servicePrice)}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground pt-1">
                    {t("contracts.byRequest", { title: selectedCounterparty.requestTitle })}
                  </p>
                  {!selectedCounterparty.party.bin && !selectedCounterparty.party.address ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                      {t("contracts.fillManuallyHint")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("contracts.headerCity")}</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCityTouched(true);
                      setCity(e.target.value);
                    }}
                    placeholder={
                      selectedCounterparty?.dealCity
                        ? t("contracts.headerCityFromTender", { city: selectedCounterparty.dealCity })
                        : t("contracts.headerCityPlaceholder")
                    }
                    className="rounded-xl"
                  />
                  {selectedCounterparty?.dealCity ? (
                    <p className="text-xs text-muted-foreground">{t("contracts.headerCityHint")}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-date">{t("contracts.headerDate")}</Label>
                  <Input
                    id="doc-date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{t("contracts.disclaimer")}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-xl gap-2"
                  disabled={exportingDocx || exportingPdf}
                  onClick={() => void runExport("docx")}
                >
                  {exportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t("contracts.downloadDocx")}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="rounded-xl gap-2"
                  disabled={exportingDocx || exportingPdf}
                  onClick={() => void runExport("pdf")}
                >
                  {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  {t("contracts.downloadPdf")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </div>
  );
}
