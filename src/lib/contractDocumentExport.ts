import { Document, Packer, Paragraph, TextRun } from "docx";
import { buildContractDocument, type ContractTemplateId } from "./contractTemplates";

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function contractDownloadBaseName(templateId: ContractTemplateId, city: string): string {
  const slug =
    templateId === "services" ? "dogovor-uslug" : templateId === "supply" ? "dogovor-postavki" : "akt-priemki";
  const safeCity = city.replace(/[^\w\u0400-\u04FF-]+/g, "_").slice(0, 40) || "gorod";
  return `buildconnect-${slug}-${safeCity}`;
}

/** Word (.docx), шрифт Times New Roman — стандартное оформление договоров */
export async function downloadContractDocx(
  templateId: ContractTemplateId,
  fields: { city: string; docDate: string },
): Promise<void> {
  const text = buildContractDocument(templateId, fields);
  const lines = text.split(/\n/);
  const children = lines.map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line.length > 0 ? line : "\u00A0",
            font: "Times New Roman",
            size: 24,
          }),
        ],
        spacing: { after: 80 },
      }),
  );

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, `${contractDownloadBaseName(templateId, fields.city)}.docx`);
}

type PdfMakerInstance = {
  vfs: Record<string, string>;
  createPdf: (docDefinition: Record<string, unknown>) => {
    download: (filename?: string) => Promise<void>;
  };
};

/** PDF (Roboto из vfs pdfmake — кириллица) */
export async function downloadContractPdf(
  templateId: ContractTemplateId,
  fields: { city: string; docDate: string },
): Promise<void> {
  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const vfsMod = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeMod.default as PdfMakerInstance;
  const vfsUnknown = vfsMod as { default?: Record<string, string> } | Record<string, string>;
  const vfs =
    vfsUnknown &&
    typeof vfsUnknown === "object" &&
    "default" in vfsUnknown &&
    vfsUnknown.default &&
    typeof vfsUnknown.default === "object"
      ? vfsUnknown.default
      : (vfsUnknown as Record<string, string>);

  if (!vfs || typeof vfs !== "object" || Object.keys(vfs).length === 0) {
    throw new Error("Не удалось загрузить шрифты для PDF.");
  }

  pdfMake.vfs = vfs;

  const text = buildContractDocument(templateId, fields);
  const content = text.split(/\n/).map((line) => ({
    text: line.length ? line : " ",
    fontSize: 10,
    lineHeight: 1.25,
    margin: [0, 0, 0, 2],
  }));

  const docDefinition = {
    pageSize: "A4" as const,
    pageMargins: [42, 52, 42, 52] as [number, number, number, number],
    info: { title: "BuildConnect — шаблон документа" },
    content,
    defaultStyle: { font: "Roboto" },
  };

  const pdf = pdfMake.createPdf(docDefinition);
  await pdf.download(`${contractDownloadBaseName(templateId, fields.city)}.pdf`);
}
