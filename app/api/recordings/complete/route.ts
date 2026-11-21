import { apiUser, assertSameOrigin, plain } from "@/lib/api";
import { nid, now } from "@/lib/ids";
import { extensionOf, mimeForFilename } from "@/lib/uploads/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiUser(request);
    if (!auth) return plain("Please sign in again.", 401);
    const body = (await request.json()) as {
      uploadId?: string;
      total?: number;
      chapterId?: string;
      filename?: string;
    };
    const uploadId = String(body.uploadId || "");
    const total = Number(body.total);
    const chapterId = String(body.chapterId || "");
    const filename = String(body.filename || "recording.m4a");
    if (!extensionOf(filename)) return plain("Use an m4a, mp3, or wav file.");
    const chapter = await auth.db.getChapterById(chapterId);
    const project = chapter ? await auth.db.getProject(chapter.projectId) : null;
    if (!chapter || !project || project.userId !== auth.user.id) return plain("That chapter could not be found.", 404);
    const id = nid();
    const storageKey = `${project.id}/${id}`;
    const byteSize = await auth.db.assembleChunks(auth.user.id, uploadId, total, storageKey);
    await auth.db.createRecording({
      id,
      chapterId: chapter.id,
      projectId: project.id,
      userId: auth.user.id,
      filename,
      mimeType: mimeForFilename(filename) || "application/octet-stream",
      byteSize,
      storageKey,
      createdAt: now(),
    });
    return Response.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The upload could not be saved.";
    return plain(message, 400);
  }
}
