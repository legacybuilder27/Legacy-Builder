import { apiUser, plain } from "@/lib/api";
import { chapterDocument } from "@/lib/export/documents";
import { renderDocx } from "@/lib/export/docx";
import { renderPdf } from "@/lib/export/pdf";
import { safeFilename } from "@/lib/text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string; chapterKey: string }> },
) {
  const auth = await apiUser(request);
  if (!auth) return plain("Please sign in again.", 401);
  const { projectId, chapterKey } = await context.params;
  const project = await auth.db.getProject(projectId);
  if (!project || project.userId !== auth.user.id) return plain("That project could not be found.", 404);
  const chapter = await auth.db.getChapter(project.id, chapterKey);
  if (!chapter) return plain("That chapter could not be found.", 404);
  const drafts = await auth.db.listDrafts(chapter.id);
  const requested = Number(new URL(request.url).searchParams.get("version"));
  const draft = Number.isInteger(requested)
    ? drafts.find((item) => item.version === requested) || drafts[drafts.length - 1]
    : drafts[drafts.length - 1];
  if (!draft) return plain("Draft a chapter before exporting it.", 404);
  const doc = chapterDocument(project, chapter, draft);
  const format = new URL(request.url).searchParams.get("format");
  const pdf = format === "pdf";
  const body = pdf ? await renderPdf(doc) : await renderDocx(doc);
  const ext = pdf ? "pdf" : "docx";
  const type = pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${safeFilename(doc.filename)}.${ext}"`,
    },
  });
}
