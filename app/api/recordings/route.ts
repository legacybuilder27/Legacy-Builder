import { apiUser, assertSameOrigin, plain } from "@/lib/api";
import { nid, now } from "@/lib/ids";
import { extensionOf, MAX_AUDIO_BYTES, mimeForFilename } from "@/lib/uploads/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiUser(request);
    if (!auth) return plain("Please sign in again.", 401);
    const form = await request.formData();
    const file = form.get("file");
    const chapterId = String(form.get("chapterId") || "");
    if (!(file instanceof File)) return plain("Choose an audio file.");
    const chapter = await auth.db.getChapterById(chapterId);
    if (!chapter) return plain("That chapter could not be found.", 404);
    const project = await auth.db.getProject(chapter.projectId);
    if (!project || project.userId !== auth.user.id) return plain("That chapter could not be found.", 404);
    if (!extensionOf(file.name)) return plain("Use an m4a, mp3, or wav file.");
    if (file.size <= 0) return plain("That file is empty.");
    if (file.size > MAX_AUDIO_BYTES) return plain("That recording is larger than 150 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const id = nid();
    const storageKey = `${project.id}/${id}`;
    await auth.db.saveFile(storageKey, bytes);
    await auth.db.createRecording({
      id,
      chapterId: chapter.id,
      projectId: project.id,
      userId: auth.user.id,
      filename: file.name,
      mimeType: mimeForFilename(file.name) || "application/octet-stream",
      byteSize: bytes.length,
      storageKey,
      createdAt: now(),
    });
    return Response.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The upload failed.";
    return plain(message, 400);
  }
}
