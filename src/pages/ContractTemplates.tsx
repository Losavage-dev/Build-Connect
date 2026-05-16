import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileDown, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
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
      <main className="container max-w-2xl px-4 py-10 pb-24">
        <Button variant="ghost" asChild className="mb-6 -ml-2 gap-2">
          <Link to="/profile">
            <ArrowLeft className="h-4 w-4" />
            В профиль
          </Link>
        </Button>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Шаблоны договоров</CardTitle>
            <CardDescription>
              Скачайте документ в формате Word (.docx) или PDF. Дополните реквизиты в редакторе при необходимости,
              подпишите и передайте контрагенту — в том числе через скрепку в чате заявки.
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
      </main>
    </div>
  );
}
