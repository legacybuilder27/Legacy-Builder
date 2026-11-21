"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { chapterContext } from "@/lib/actions/context";
import { prepareDraft, prepareTranscript } from "@/lib/ai/provider";
import { buildRestore, buildVersion, type VersionDraft } from "@/lib/draft/versions";
import { nid, now } from "@/lib/ids";
import { fictionalSampleTranscript } from "@/lib/sample/transcripts";
import { toBackground, type Draft, type TranscriptKind } from "@/lib/types";
import { withQuery } from "@/lib/text";

function back(projectId: string, chapterKey: string, query: Record<string, string | undefined> = {}) {
  return withQuery(`/projects/${projectId}/chapters/${chapterKey}`, query);
}

function toVersion(draft: Draft): VersionDraft {
  return {
    version: draft.version,
    content: draft.content,
    followUps: draft.followUps,
    revisionNotes: draft.revisionNotes,
    source: draft.source,
    restoredFromVersion: draft.restoredFromVersion,
  };
}

export async function saveTranscript(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const content = String(formData.get("content") || "").replace(/\r\n/g, "\n").trim();
  const id = String(formData.get("transcriptId") || "");
  const kind: TranscriptKind = formData.get("kind") === "followup" ? "followup" : "interview";
  const title = String(formData.get("title") || "").trim() || (kind === "followup" ? "Follow-up answers" : "Pasted transcript");
  if (content.length < 20) {
    redirect(back(projectId, chapterKey, { error: "Paste a little more of what they said before saving." }));
  }
  const timestamp = now();
  if (id) {
    const existing = await db.getTranscript(id);
    if (!existing || existing.chapterId !== chapter.id) {
      redirect(back(projectId, chapterKey, { error: "That transcript is not in this chapter." }));
    }
    await db.updateTranscript({ ...existing, title, content, kind, updatedAt: timestamp });
  } else {
    await db.createTranscript({
      id: nid(),
      chapterId: chapter.id,
      projectId: chapter.projectId,
      recordingId: null,
      title,
      content,
      source: "paste",
      kind,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  redirect(back(projectId, chapterKey, { saved: "transcript" }));
}

export async function uploadTranscriptFile(projectId: string, chapterKey: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(back(projectId, chapterKey, { error: "Choose a text file to upload." }));
  }
  if (file.size > 2 * 1024 * 1024) {
    redirect(back(projectId, chapterKey, { error: "That text file is larger than 2 MB." }));
  }
  const content = (await file.text()).replace(/\u0000/g, "").trim();
  const next = new FormData();
  next.set("content", content);
  next.set("title", file.name || "Uploaded transcript");
  next.set("kind", "interview");
  await saveTranscript(projectId, chapterKey, next);
}

export async function insertSampleTranscript(projectId: string, chapterKey: string) {
  const { project } = await chapterContext(projectId, chapterKey);
  if (project.isSample) {
    redirect(back(projectId, chapterKey, { error: "The sample project already uses Arthur's fictional interview." }));
  }
  const form = new FormData();
  form.set("content", fictionalSampleTranscript(chapterKey));
  form.set("title", "Fictional sample transcript");
  form.set("kind", "interview");
  await saveTranscript(projectId, chapterKey, form);
}

export async function deleteTranscript(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const id = String(formData.get("transcriptId") || "");
  const transcript = await db.getTranscript(id);
  if (transcript && transcript.chapterId === chapter.id) await db.deleteTranscript(id);
  redirect(back(projectId, chapterKey, { saved: "transcript" }));
}

export async function transcribeRecording(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const recordingId = String(formData.get("recordingId") || "");
  const recording = await db.getRecording(recordingId);
  if (!recording || recording.chapterId !== chapter.id) {
    redirect(back(projectId, chapterKey, { error: "That recording is not in this chapter." }));
  }
  try {
    const bytes = await db.readFile(recording.storageKey);
    if (!bytes) redirect(back(projectId, chapterKey, { error: "The audio file is missing. Try the upload again." }));
    const result = await prepareTranscript({
      filename: recording.filename,
      bytes,
      mimeType: recording.mimeType,
      chapterTitle: chapter.title,
    });
    const timestamp = now();
    await db.createTranscript({
      id: nid(),
      chapterId: chapter.id,
      projectId: chapter.projectId,
      recordingId: recording.id,
      title: result.title,
      content: result.text,
      source: result.source,
      kind: "interview",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    redirect(back(projectId, chapterKey, { saved: result.source === "demo" ? "demo-transcript" : "transcript" }));
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "The recording could not be transcribed.";
    redirect(back(projectId, chapterKey, { error: message.slice(0, 240) }));
  }
}

export async function deleteRecording(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const id = String(formData.get("recordingId") || "");
  const recording = await db.getRecording(id);
  if (recording && recording.chapterId === chapter.id) await db.deleteRecording(id);
  redirect(back(projectId, chapterKey, { saved: "recording" }));
}

export async function generateDraft(projectId: string, chapterKey: string, formData: FormData) {
  const { db, project, chapter } = await chapterContext(projectId, chapterKey);
  const notes = String(formData.get("notes") || "").trim();
  const includeFollowUps = formData.get("includeFollowUps") === "yes";
  const transcripts = await db.listTranscripts(chapter.id);
  const existing = await db.listDrafts(chapter.id);
  const latest = existing[existing.length - 1];
  try {
    const result = await prepareDraft({
      parentName: project.parentName,
      chapterKey: chapter.key,
      chapterTitle: chapter.title,
      background: toBackground(project),
      transcripts: transcripts.map((transcript) => ({ content: transcript.content, kind: transcript.kind })),
      revisionNotes: notes,
      includeFollowUps,
      previousDraft: latest?.content,
    });
    if (!result.ok) redirect(back(projectId, chapterKey, { error: result.error }));
    const version = buildVersion(
      existing.map(toVersion),
      {
        content: result.content,
        followUps: result.followUps,
        revisionNotes: notes,
        source: existing.length ? "regenerate" : "generate",
        restoredFromVersion: null,
      },
    );
    await db.createDraft({
      id: nid(),
      chapterId: chapter.id,
      projectId: project.id,
      ...version,
      createdAt: now(),
    });
    await db.updateProject({ ...project, updatedAt: now() });
    redirect(back(projectId, chapterKey, { saved: "draft", warning: result.warning }));
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "The chapter could not be drafted.";
    redirect(back(projectId, chapterKey, { error: message.slice(0, 240) }));
  }
}

export async function saveDraftEdits(projectId: string, chapterKey: string, formData: FormData) {
  const { db, project, chapter } = await chapterContext(projectId, chapterKey);
  const content = String(formData.get("content") || "").replace(/\r\n/g, "\n").trim();
  const followUps = String(formData.get("followUps") || "")
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  if (content.length < 20) {
    redirect(back(projectId, chapterKey, { error: "The chapter needs a little more text before it can be saved." }));
  }
  const existing = await db.listDrafts(chapter.id);
  const version = buildVersion(existing.map(toVersion), {
    content,
    followUps,
    revisionNotes: "Edited by hand.",
    source: "edit",
    restoredFromVersion: null,
  });
  await db.createDraft({
    id: nid(),
    chapterId: chapter.id,
    projectId: project.id,
    ...version,
    createdAt: now(),
  });
  await db.updateProject({ ...project, updatedAt: now() });
  redirect(back(projectId, chapterKey, { saved: "draft" }));
}

export async function restoreDraft(projectId: string, chapterKey: string, formData: FormData) {
  const { db, project, chapter } = await chapterContext(projectId, chapterKey);
  const versionNumber = Number(formData.get("version"));
  const existing = (await db.listDrafts(chapter.id)).map(toVersion);
  let restored;
  try {
    restored = buildRestore(existing, versionNumber);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That version could not be restored.";
    redirect(back(projectId, chapterKey, { error: message }));
  }
  await db.createDraft({
    id: nid(),
    chapterId: chapter.id,
    projectId: project.id,
    ...restored,
    createdAt: now(),
  });
  await db.updateProject({ ...project, updatedAt: now() });
  redirect(back(projectId, chapterKey, { saved: "restored" }));
}
