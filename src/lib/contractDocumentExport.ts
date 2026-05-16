import {
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  Document,
  Footer,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  buildContractBody,
  CONTRACT_BRAND_LINE,
  CONTRACT_LEGAL_DISCLAIMER,
  type ContractTemplateId,
} from "./contractTemplates";

const FONT_MAIN = "Times New Roman";
const FONT_MONO = "Courier New";
const BRAND_ORANGE = "EA580C";

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

function noCellBorders() {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
}

function paragraphBody(text: string, opts?: { indent?: number; italic?: boolean; after?: number }): Paragraph {
  const after = opts?.after ?? 100;
  return new Paragraph({
    spacing: { after, line: 276 },
    indent: opts?.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
    children: [
      new TextRun({
        text: text.length ? text : "\u00A0",
        size: 22,
        font: FONT_MAIN,
        italics: opts?.italic ?? false,
      }),
    ],
  });
}

function isSectionHeader(s: string): boolean {
  return /^\d+\.\s+[А-ЯЁа-яA-Za-z]/.test(s.trim());
}

function isSubclause(raw: string): boolean {
  return /^\s+\d+\.\d+\.\s*\S/.test(raw);
}

function splitCityDate(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!/^г\.\s/.test(trimmed)) return null;
  const chunks = trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length < 2) return null;
  return [chunks[0], chunks.slice(1).join(" · ")];
}

function boxDrawingLine(line: string): boolean {
  const t = line.trim();
  return /[┌┐└┘├┤│─┬┴┼]/.test(t);
}

function contractBodyToDocxParts(body: string): (Paragraph | Table)[] {
  const lines = body.split("\n");
  const out: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      out.push(new Paragraph({ spacing: { after: 40 } }));
      i++;
      continue;
    }

    if (trimmed === "АКТ" && lines[i + 1]?.trim().startsWith("сдачи")) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "АКТ", bold: true, size: 36, font: FONT_MAIN })],
        }),
      );
      i++;
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: lines[i].trim(), bold: true, size: 26, font: FONT_MAIN })],
        }),
      );
      i++;
      if (lines[i]?.trim().startsWith("к Договору")) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: lines[i].trim(),
                italics: true,
                size: 22,
                font: FONT_MAIN,
                color: "57534E",
              }),
            ],
          }),
        );
        i++;
      }
      continue;
    }

    if (/^ДОГОВОР\s/.test(trimmed)) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: trimmed.toUpperCase(),
              bold: true,
              size: 30,
              font: FONT_MAIN,
              color: "1c1917",
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    const cityDate = splitCityDate(line);
    if (cityDate) {
      const [left, right] = cityDate;
      out.push(
        new Table({
          columnWidths: [4680, 4680],
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 220 },
          borders: noCellBorders(),
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: noCellBorders(),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: left, size: 22, font: FONT_MAIN, color: "44403c" })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: noCellBorders(),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: right,
                          size: 22,
                          bold: true,
                          font: FONT_MAIN,
                          color: "1c1917",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    if (
      (/^(ЗАКАЗЧИК|ИСПОЛНИТЕЛЬ|ПОСТАВЩИК|ПОКУПАТЕЛЬ):/.test(trimmed) && trimmed.includes("___")) ||
      /^\s*М\.П\./i.test(trimmed)
    ) {
      out.push(
        new Paragraph({
          shading: {
            type: ShadingType.CLEAR,
            fill: "fafaf9",
            color: "auto",
          },
          spacing: { before: 260, after: 120 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "e7e5e4", space: 8 },
          },
          children: [new TextRun({ text: trimmed, size: 22, font: FONT_MAIN })],
        }),
      );
      i++;
      continue;
    }

    if (
      trimmed.startsWith("ЗАКАЗЧИК:") ||
      trimmed.startsWith("ИСПОЛНИТЕЛЬ") ||
      trimmed.startsWith("ПОКУПАТЕЛЬ") ||
      trimmed.startsWith("ПОСТАВЩИК")
    ) {
      out.push(
        new Paragraph({
          spacing: { before: 140, after: 80 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 22,
              font: FONT_MAIN,
              color: BRAND_ORANGE,
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    if (isSectionHeader(line)) {
      out.push(
        new Paragraph({
          shading: {
            type: ShadingType.CLEAR,
            color: "auto",
            fill: "FFF7ED",
          },
          border: {
            left: {
              color: BRAND_ORANGE,
              space: 1,
              style: BorderStyle.SINGLE,
              size: 16,
            },
          },
          spacing: { before: 240, after: 120 },
          indent: { left: convertInchesToTwip(0.08) },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 24,
              font: FONT_MAIN,
              color: "1c1917",
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    if (isSubclause(line)) {
      out.push(paragraphBody(line.trimEnd(), { indent: 0.28 }));
      i++;
      continue;
    }

    if (boxDrawingLine(trimmed)) {
      out.push(
        new Paragraph({
          spacing: { after: 40, line: 240 },
          children: [
            new TextRun({
              text: trimmed,
              size: 18,
              font: FONT_MONO,
              color: "57534e",
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    out.push(paragraphBody(line));
    i++;
  }

  return out;
}

function buildDocxFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "E7E5E4", space: 10 },
        },
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: CONTRACT_LEGAL_DISCLAIMER,
            size: 18,
            color: "78716c",
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [
          new TextRun({
            text: CONTRACT_BRAND_LINE,
            bold: true,
            size: 20,
            color: BRAND_ORANGE,
          }),
        ],
      }),
    ],
  });
}

export async function downloadContractDocx(
  templateId: ContractTemplateId,
  fields: { city: string; docDate: string },
): Promise<void> {
  const body = buildContractBody(templateId, fields);
  const parts = contractBodyToDocxParts(body);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.85),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        footers: { default: buildDocxFooter() },
        children: parts as (Paragraph | Table)[],
      },
    ],
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

function pdfBlockForLine(line: string, i: number, lines: string[]): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed) return { text: "\n", fontSize: 4, margin: [0, 0, 0, 4] };

  if (trimmed === "АКТ" && lines[i + 1]?.trim().startsWith("сдачи")) return null;

  if (trimmed.startsWith("сдачи-приёмки") || trimmed.startsWith("сдачи-приемки"))
    return { text: trimmed, bold: true, fontSize: 13, alignment: "center", margin: [0, 0, 0, 6] };

  if (trimmed.startsWith("к Договору"))
    return {
      text: trimmed,
      italics: true,
      fontSize: 10,
      alignment: "center",
      color: "#57534e",
      margin: [0, 0, 0, 14],
    };

  if (/^ДОГОВОР\s/.test(trimmed))
    return { text: trimmed.toUpperCase(), bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 10] };

  const cd = splitCityDate(line);
  if (cd) {
    return {
      columns: [
        { width: "*", text: cd[0], fontSize: 10, color: "#44403c" },
        { width: "auto", text: cd[1], bold: true, fontSize: 10, alignment: "right" },
      ],
      columnGap: 12,
      margin: [0, 0, 0, 12],
    };
  }

  if (
    (/^(ЗАКАЗЧИК|ИСПОЛНИТЕЛЬ|ПОСТАВЩИК|ПОКУПАТЕЛЬ):/.test(trimmed) && trimmed.includes("___")) ||
    /^\s*М\.П\./i.test(trimmed)
  )
    return {
      text: trimmed,
      fontSize: 10,
      fillColor: "#fafaf9",
      margin: [0, 14, 0, 8],
    };

  if (
    trimmed.startsWith("ЗАКАЗЧИК:") ||
    trimmed.startsWith("ИСПОЛНИТЕЛЬ") ||
    trimmed.startsWith("ПОКУПАТЕЛЬ") ||
    trimmed.startsWith("ПОСТАВЩИК")
  )
    return {
      text: trimmed,
      bold: true,
      fontSize: 10,
      color: `#${BRAND_ORANGE}`,
      margin: [0, 10, 0, 4],
    };

  if (isSectionHeader(line))
    return {
      text: trimmed,
      bold: true,
      fontSize: 11,
      fillColor: "#FFF7ED",
      margin: [0, 12, 0, 8],
      decoration: "underline",
      decorationStyle: "solid",
    };

  if (isSubclause(line))
    return { text: trimmed, fontSize: 10, alignment: "justify", margin: [14, 0, 0, 4] };

  if (boxDrawingLine(trimmed))
    return { text: trimmed, font: "Courier", fontSize: 8.5, color: "#57534e", margin: [0, 0, 0, 2] };

  return { text: trimmed, fontSize: 10, alignment: "justify", margin: [0, 0, 0, 4] };
}

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

  const body = buildContractBody(templateId, fields);
  const rawLines = body.split("\n");
  const pdfContent: Record<string, unknown>[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const ln = rawLines[i];
    const t = ln.trim();

    if (t === "АКТ" && rawLines[i + 1]?.trim().startsWith("сдачи")) {
      pdfContent.push({ text: "АКТ", bold: true, fontSize: 16, alignment: "center" as const });
      pdfContent.push({
        text: rawLines[i + 1].trim(),
        bold: true,
        fontSize: 13,
        alignment: "center" as const,
        margin: [0, 4, 0, 8],
      });
      i += 2;
      if (rawLines[i]?.trim().startsWith("к Договору")) {
        const b = pdfBlockForLine(rawLines[i], i, rawLines);
        if (b) pdfContent.push(b);
        i++;
      }
      continue;
    }

    const block = pdfBlockForLine(ln, i, rawLines);
    if (block) pdfContent.push(block);
    i++;
  }

  const docDefinition = {
    pageSize: "A4" as const,
    pageMargins: [48, 52, 48, 72] as [number, number, number, number],
    info: { title: "BuildConnect — шаблон документа" },
    content: pdfContent,
    defaultStyle: { font: "Roboto" },
    footer: () => ({
      margin: [48, 0, 48, 16],
      stack: [
        {
          canvas: [{ type: "line" as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#e7e5e4" }],
        },
        {
          text: CONTRACT_LEGAL_DISCLAIMER,
          fontSize: 8,
          color: "#78716c",
          italics: true,
          margin: [0, 8, 0, 4],
        },
        {
          text: CONTRACT_BRAND_LINE,
          fontSize: 9,
          bold: true,
          color: `#${BRAND_ORANGE}`,
          alignment: "center" as const,
        },
      ],
    }),
  };

  const pdf = pdfMake.createPdf(docDefinition);
  await pdf.download(`${contractDownloadBaseName(templateId, fields.city)}.pdf`);
}
