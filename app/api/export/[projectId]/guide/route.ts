import { apiUser, plain } from "@/lib/api";
import { guideDocument } from "@/lib/export/documents";
import { renderDocx } from "@/lib/export/docx";
import { renderPdf } from "@/lib/export/pdf";
import { safeFilename } from "@/lib/text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const auth = await apiUser(request);
  if (!auth) return plain("Please sign in again.", 401);
  const { projectId } = await context.params;
  const project = await auth.db.getProject(projectId);
  if (!project || project.userId !== auth.user.id) return plain("That project could not be found.", 404);
  const chapters = await auth.db.listChapters(project.id);
  const questions = await auth.db.listQuestionsForProject(project.id);
  const doc = guideDocument(project, chapters, questions);
  return send(request, doc.filename, doc, await choose(request, doc));
}

async function choose(request: Request, doc: Parameters<typeof renderDocx>[0]) {
  const format = new URL(request.url).searchParams.get("format");
  if (format === "pdf") return { body: await renderPdf(doc), type: "application/pdf", ext: "pdf" };
  return {
    body: await renderDocx(doc),
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  };
}

function send(request: Request, filename: string, _doc: unknown, file: { body: Buffer; type: string; ext: string }) {
  void request;
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${safeFilename(filename)}.${file.ext}"`,
    },
  });
}
