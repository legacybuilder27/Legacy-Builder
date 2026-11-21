export type ExportBlock = {
  heading?: string;
  paragraphs: string[];
};

export type ExportDocument = {
  filename: string;
  title: string;
  subtitle?: string;
  blocks: ExportBlock[];
};

export function paragraphsOf(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
