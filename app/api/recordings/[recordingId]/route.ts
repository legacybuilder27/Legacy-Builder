import { apiUser, plain } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ recordingId: string }> }) {
  const auth = await apiUser(request);
  if (!auth) return plain("Please sign in again.", 401);
  const { recordingId } = await context.params;
  const recording = await auth.db.getRecording(recordingId);
  if (!recording || recording.userId !== auth.user.id) return plain("That recording could not be found.", 404);
  const bytes = await auth.db.readFile(recording.storageKey);
  if (!bytes) return plain("That audio file is missing.", 404);
  const size = bytes.length;
  const range = request.headers.get("range");
  const headers = {
    "Content-Type": recording.mimeType,
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename="${recording.filename.replace(/"/g, "")}"`,
  };
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return plain("That range could not be read.", 416);
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (start > end || end >= size) return plain("That range could not be read.", 416);
    const slice = bytes.subarray(start, end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(slice.length),
      },
    });
  }
  return new Response(new Uint8Array(bytes), {
    headers: { ...headers, "Content-Length": String(size) },
  });
}
