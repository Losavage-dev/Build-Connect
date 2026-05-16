import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
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
  buildContractDocument,
  CONTRACT_TEMPLATE_LABELS,
  downloadTextFile,
  type ContractTemplateId,
} from "@/lib/contractTemplates";

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

  const handleDownload = () => {
    const text = buildContractDocument(templateId, { city, docDate });
    const slug =
      templateId === "services" ? "dogovor-uslug" : templateId === "supply" ? "dogovor-postavki" : "akt-priemki";
    const safeCity = city.replace(/[^\w\u0400-\u04FF-]+/g, "_").slice(0, 40) || "gorod";
    downloadTextFile(`buildconnect-${slug}-${safeCity}.txt`, text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl px-4 py-10 pb-24">
        <Button variant="ghost" asChild className="mb-6 -ml-2 gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </Button>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Шаблоны договоров</CardTitle>
            <CardDescription>
              Заполните реквизиты в текстовом редакторе после скачивания. Откройте файл в Word / Google Docs /
              сохраните как PDF, подпишите и отправьте контрагенту — в том числе через вложение в чате заявки
              BuildConnect.
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
              Файл скачивается в кодировке UTF-8 с BOM — корректно открывается в Microsoft Word. Формулировки носят
              ознакомительный характер; перед подписанием документ нужно проверить с юристом.
            </p>

            <Button type="button" size="lg" className="w-full sm:w-auto rounded-xl gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Скачать шаблон (.txt)
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
