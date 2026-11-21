"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { CHUNK_BYTES, MAX_AUDIO_BYTES, extensionOf } from "@/lib/uploads/limits";

export function UploadRecording({
  projectId,
  chapterId,
  chapterKey,
}: {
  projectId: string;
  chapterId: string;
  chapterKey: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (!extensionOf(file.name)) throw new Error("Use an m4a, mp3, or wav file.");
      if (file.size > MAX_AUDIO_BYTES) throw new Error("That recording is larger than 150 MB.");
      if (file.size <= CHUNK_BYTES) {
        setProgress("Uploading the recording");
        const body = new FormData();
        body.set("file", file);
        body.set("chapterId", chapterId);
        const response = await fetch("/api/recordings", { method: "POST", body });
        if (!response.ok) throw new Error(await response.text());
      } else {
        const uploadId = crypto.randomUUID();
        const total = Math.ceil(file.size / CHUNK_BYTES);
        for (let index = 0; index < total; index += 1) {
          setProgress(`Uploading part ${index + 1} of ${total}`);
          const body = new FormData();
          body.set("chunk", file.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES), file.name);
          body.set("uploadId", uploadId);
          body.set("index", String(index));
          body.set("total", String(total));
          body.set("chapterId", chapterId);
          body.set("filename", file.name);
          const response = await fetch("/api/recordings/chunk", { method: "POST", body });
          if (!response.ok) throw new Error(await response.text());
        }
        setProgress("Saving the recording");
        const done = await fetch("/api/recordings/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            total,
            chapterId,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        if (!done.ok) throw new Error(await done.text());
      }
      router.push(`/projects/${projectId}/chapters/${chapterKey}?saved=uploaded`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" data-testid="upload-form">
      <label className="block text-sm font-semibold">
        Audio file
        <span className="mt-1 block font-normal text-ink-soft">m4a, mp3, or wav. A long call is uploaded in pieces.</span>
        <input className="mt-2 block w-full text-sm" type="file" name="file" accept=".m4a,.mp3,.wav,audio/*" required />
      </label>
      {error ? (
        <p className="text-sm text-clay-deep" role="alert">
          {error}
        </p>
      ) : null}
      {progress ? <p className="text-sm text-ink-soft">{progress}</p> : null}
      <button className={buttonClass()} disabled={busy}>
        {busy ? "Uploading..." : "Upload recording"}
      </button>
    </form>
  );
}
