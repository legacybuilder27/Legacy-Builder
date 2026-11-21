import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { ExportDocument } from "@/lib/export/model";

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const pushWord = (word: string) => {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    if (font.widthOfTextAtSize(word, size) <= width) {
      line = word;
      return;
    }
    let chunk = "";
    for (const char of word) {
      const trial = chunk + char;
      if (font.widthOfTextAtSize(trial, size) > width && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = trial;
      }
    }
    line = chunk;
  };
  for (const word of words) pushWord(word);
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function renderPdf(doc: ExportDocument): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 68;
  const maxWidth = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensure = (height: number) => {
    if (y - height < margin) newPage();
  };

  const safe = (text: string) =>
    text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^\n\x20-\xFF]/g, "");

  const drawLines = (lines: string[], font: PDFFont, size: number, color = rgb(0.14, 0.12, 0.1)) => {
    for (const line of lines) {
      ensure(size + 6);
      page.drawText(safe(line), { x: margin, y: y - size, size, font, color });
      y -= size + 5;
    }
  };

  drawLines(wrap(safe(doc.title), bold, 20, maxWidth), bold, 20);
  y -= 6;
  if (doc.subtitle) {
    drawLines(wrap(safe(doc.subtitle), italic, 11, maxWidth), italic, 11, rgb(0.32, 0.28, 0.24));
    y -= 8;
  }

  for (const block of doc.blocks) {
    if (block.heading) {
      y -= 8;
      drawLines(wrap(safe(block.heading), bold, 14, maxWidth), bold, 14);
      y -= 4;
    }
    for (const paragraph of block.paragraphs) {
      drawLines(wrap(safe(paragraph), body, 12, maxWidth), body, 12);
      y -= 8;
    }
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
