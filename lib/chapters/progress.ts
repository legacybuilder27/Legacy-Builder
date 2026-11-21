export type ChapterProgress = {
  key: "empty" | "questions" | "recording" | "transcript" | "draft";
  label: string;
};

export function chapterProgress(input: {
  questionCount: number;
  recordingCount: number;
  transcriptCount: number;
  draftCount: number;
}): ChapterProgress {
  if (input.draftCount > 0) return { key: "draft", label: "Draft ready" };
  if (input.transcriptCount > 0) return { key: "transcript", label: "Transcript ready" };
  if (input.recordingCount > 0) return { key: "recording", label: "Recording saved" };
  if (input.questionCount > 0) return { key: "questions", label: "Questions ready" };
  return { key: "empty", label: "Not started" };
}
