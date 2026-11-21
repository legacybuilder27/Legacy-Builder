import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ExportDocument } from "@/lib/export/model";

function runs(line: string): TextRun[] {
  return line
    .split(/(\[check\])/g)
    .filter(Boolean)
    .map(
      (part) =>
        new TextRun({
          text: part,
          italics: part === "[check]",
          bold: part === "[check]",
        }),
    );
}

export async function renderDocx(doc: ExportDocument): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(doc.title)],
    }),
  ];
  if (doc.subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.subtitle, italics: true })],
      }),
    );
  }
  for (const block of doc.blocks) {
    if (block.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(block.heading)],
        }),
      );
    }
    for (const paragraph of block.paragraphs) {
      children.push(new Paragraph({ children: runs(paragraph) }));
    }
  }
  const file = new Document({ sections: [{ children }] });
  return Packer.toBuffer(file);
}
