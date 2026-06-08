import { useState } from "react";
import { Link } from "react-router-dom";
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
  type ContractTemplateId,
} from "@/lib/contractTemplates";
import { downloadContractDocx, downloadContractPdf } from "@/lib/contractDocumentExport";
import { toast } from "sonner";

const dateToday = (): string =>
  new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function ContractTemplates() {
  const [city, setCity] = useState("Астана");
  const [docDate, setDocDate] = useState(dateToday());
  const [templateId, setTemplateId] = useState<ContractTemplateId>("services");
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const runExport = async (kind: "docx" | "pdf") => {
    if (kind === "docx") setExportingDocx(true);
    else setExportingPdf(true);
    try {
      if (kind === "docx") {
        await downloadContractDocx(templateId, { city, docDate });
        toast.success("Файл .docx сохранён");
      } else {
        await downloadContractPdf(templateId, { city, docDate });
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
        description="Скачайте документ в Word или PDF, дополните реквизиты и передайте контрагенту — в том числе через чат заявки."
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
              В подвале файла добавлены краткая оговорка и строка «Сгенерировано в BuildConnect» — при необходимости
              их можно убрать в редакторе.
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Город в шапке</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Например, Алматы"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-date">Дата в шапке</Label>
                <Input id="doc-date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className="rounded-xl" />
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
