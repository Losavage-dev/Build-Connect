import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  CONTRACT_TEMPLATE_LABELS,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NONE_COUNTERPARTY = "__none__";

const dateToday = (): string =>
  new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function ContractTemplates() {
  const { profile, user } = useAuth();
  const caps = useCapabilities();
  const [city, setCity] = useState("Астана");
  const [docDate, setDocDate] = useState(dateToday());
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

  const ownPartyLabel =
    ownPartySide === "customer"
      ? "Заказчик"
      : ownPartySide === "buyer"
        ? "Покупатель"
        : ownPartySide === "supplier"
          ? "Поставщик"
          : "Исполнитель";

  const counterpartyLabel =
    ownPartySide === "customer"
      ? "Исполнитель"
      : ownPartySide === "buyer"
        ? "Поставщик"
        : ownPartySide === "supplier"
          ? "Покупатель"
          : "Заказчик";

  const runExport = async (kind: "docx" | "pdf") => {
    if (kind === "docx") setExportingDocx(true);
    else setExportingPdf(true);
    try {
      if (kind === "docx") {
        await downloadContractDocx(templateId, documentFields);
        toast.success("Файл .docx сохранён");
      } else {
        await downloadContractPdf(templateId, documentFields);
        toast.success("Файл .pdf сохранён");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сформировать файл";
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
        eyebrow="Документы"
        eyebrowIcon={FileText}
        title="Шаблоны договоров"
        description="Скачайте документ в Word или PDF — реквизиты обеих сторон подставятся из профиля и активных сделок."
        compact
        actions={
          <Button variant="ghost" asChild className="rounded-xl">
            <Link to="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              В профиль
            </Link>
          </Button>
        }
      />

      <PageContent className="border-b-0">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Параметры документа</CardTitle>
              <CardDescription>
                Реквизиты вашей стороны и контрагента подставятся из профиля и активной заявки.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="template-type">Тип документа</Label>
                <Select value={templateId} onValueChange={(v) => setTemplateId(v as ContractTemplateId)}>
                  <SelectTrigger id="template-type" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONTRACT_TEMPLATE_LABELS) as ContractTemplateId[]).map((id) => (
                      <SelectItem key={id} value={id}>
                        {CONTRACT_TEMPLATE_LABELS[id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {companies.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="contract-company">Ваша компания</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger id="contract-company" className="rounded-xl">
                      <SelectValue placeholder="Выберите компанию..." />
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
                <Label htmlFor="contract-counterparty">Контрагент по сделке</Label>
                <Select value={counterpartyRequestId} onValueChange={setCounterpartyRequestId}>
                  <SelectTrigger id="contract-counterparty" className="rounded-xl">
                    <SelectValue placeholder="Выберите активную заявку..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_COUNTERPARTY}>Не выбран — заполню вручную</SelectItem>
                    {counterparties.map((option) => (
                      <SelectItem key={option.requestId} value={option.requestId}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {counterpartiesLoading ? (
                  <p className="text-xs text-muted-foreground">Загрузка активных сделок...</p>
                ) : counterparties.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Нет активных заявок. Контрагента можно указать вручную после скачивания или начать переговоры в
                    чате.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Список — только активные заявки. Реквизиты берутся из профиля на платформе.
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-foreground">Ваши реквизиты ({ownPartyLabel})</p>
                {companiesLoading ? (
                  <p className="text-muted-foreground">Загрузка данных...</p>
                ) : (
                  <>
                    <p>
                      <span className="text-muted-foreground">Наименование: </span>
                      {ownParty.name || "— укажите в профиле или компании"}
                    </p>
                    {ownParty.bin ? (
                      <p>
                        <span className="text-muted-foreground">БИН: </span>
                        {ownParty.bin}
                      </p>
                    ) : null}
                    {ownParty.address ? (
                      <p>
                        <span className="text-muted-foreground">Адрес: </span>
                        {ownParty.address}
                      </p>
                    ) : null}
                    {ownParty.phoneEmail ? (
                      <p>
                        <span className="text-muted-foreground">Контакты: </span>
                        {ownParty.phoneEmail}
                      </p>
                    ) : null}
                    {!ownParty.name && !companies.length ? (
                      <p className="text-muted-foreground">
                        Создайте компанию или заполните профиль — тогда реквизиты попадут в документ автоматически.
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {selectedCounterparty ? (
                <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">
                    Контрагент ({counterpartyLabel}): {selectedCounterparty.party.name}
                  </p>
                  {selectedCounterparty.party.bin ? (
                    <p>
                      <span className="text-muted-foreground">БИН: </span>
                      {selectedCounterparty.party.bin}
                    </p>
                  ) : null}
                  {selectedCounterparty.party.address ? (
                    <p>
                      <span className="text-muted-foreground">Адрес: </span>
                      {selectedCounterparty.party.address}
                    </p>
                  ) : null}
                  {selectedCounterparty.party.phoneEmail ? (
                    <p>
                      <span className="text-muted-foreground">Контакты: </span>
                      {selectedCounterparty.party.phoneEmail}
                    </p>
                  ) : null}
                  {selectedCounterparty.servicePrice ? (
                    <p>
                      <span className="text-muted-foreground">Цена из отклика: </span>
                      {selectedCounterparty.servicePrice} ₸
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground pt-1">
                    По заявке: {selectedCounterparty.requestTitle}
                  </p>
                  {!selectedCounterparty.party.bin && !selectedCounterparty.party.address ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                      БИН и адрес не заполнены в карточке контрагента на платформе — допишите вручную после
                      скачивания.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Город в шапке</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCityTouched(true);
                      setCity(e.target.value);
                    }}
                    placeholder={
                      selectedCounterparty?.dealCity
                        ? `${selectedCounterparty.dealCity} — из тендера`
                        : "Город выполнения заказа"
                    }
                    className="rounded-xl"
                  />
                  {selectedCounterparty?.dealCity ? (
                    <p className="text-xs text-muted-foreground">
                      Город выполнения заказа (из тендера). Можно изменить.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-date">Дата в шапке</Label>
                  <Input
                    id="doc-date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Тексты носят ознакомительный характер; перед подписанием документ нужно согласовать с юристом.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-xl gap-2"
                  disabled={exportingDocx || exportingPdf}
                  onClick={() => void runExport("docx")}
                >
                  {exportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Скачать .docx
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
                  Скачать .pdf
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </div>
  );
}
