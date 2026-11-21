export const MAX_AUDIO_BYTES = 150 * 1024 * 1024;
export const CHUNK_BYTES = 4 * 1024 * 1024;
export const WHISPER_BYTES = 24 * 1024 * 1024;

const MIME: Record<string, string> = {
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

export function extensionOf(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop() || "";
  return MIME[ext] ? ext : null;
}

export function mimeForFilename(filename: string): string | null {
  const ext = extensionOf(filename);
  return ext ? MIME[ext] : null;
}

export function assertSafeKey(key: string) {
  if (!/^[a-zA-Z0-9/_-]{1,200}$/.test(key) || key.includes("..")) {
    throw new Error("Invalid storage key.");
  }
}

export function assertUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("That upload id is not valid.");
  }
}
