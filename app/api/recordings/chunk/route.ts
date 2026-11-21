import { apiUser, assertSameOrigin, plain } from "@/lib/api";
import { extensionOf, MAX_AUDIO_BYTES } from "@/lib/uploads/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiUser(request);
    if (!auth) return plain("Please sign in again.", 401);
    const form = await request.formData();
    const chunk = form.get("chunk");
    const uploadId = String(form.get("uploadId") || "");
    const index = Number(form.get("index"));
    const chapterId = String(form.get("chapterId") || "");
    const filename = String(form.get("filename") || "");
    if (!(chunk instanceof File)) return plain("A piece of the upload was missing.");
    if (!extensionOf(filename)) return plain("Use an m4a, mp3, or wav file.");
    const chapter = await auth.db.getChapterById(chapterId);
    const project = chapter ? await auth.db.getProject(chapter.projectId) : null;
    if (!chapter || !project || project.userId !== auth.user.id) return plain("That chapter could not be found.", 404);
    if (chunk.size > 5 * 1024 * 1024) return plain("That piece of the upload is too large.");
    if (!Number.isInteger(index) || index < 0) return plain("That upload is out of order.");
    const roughMax = Math.ceil(MAX_AUDIO_BYTES / (4 * 1024 * 1024)) + 2;
    if (index > roughMax) return plain("That recording is larger than 150 MB.");
    await auth.db.saveChunk(auth.user.id, uploadId, index, Buffer.from(await chunk.arrayBuffer()));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The upload failed.";
    return plain(message, 400);
  }
}
