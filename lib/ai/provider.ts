import { draftChapter, DEMO_TRANSCRIPT_MARKER, type DraftInput, type DraftResult } from "@/lib/draft/draftChapter";
import { enrichGuideWithModel, draftWithModel, transcribeWithModel } from "@/lib/ai/openai";
import { providerMode } from "@/lib/ai/mode";
import type { Background } from "@/lib/types";
import { buildInterviewGuide, type GuideChapter } from "@/lib/questions/personalize";

export function currentProvider() {
  return providerMode();
}

export async function prepareGuide(background: Background): Promise<{ guide: GuideChapter[]; warning?: string }> {
  const guide = buildInterviewGuide(background);
  if (providerMode() !== "openai") return { guide };
  return enrichGuideWithModel(background, guide);
}

export async function prepareDraft(input: DraftInput): Promise<DraftResult & { warning?: string }> {
  if (providerMode() !== "openai") return draftChapter(input);
  return draftWithModel(input);
}

export async function prepareTranscript(input: {
  filename: string;
  bytes: Buffer;
  mimeType: string;
  chapterTitle: string;
}): Promise<{ text: string; source: "whisper" | "demo"; title: string }> {
  if (providerMode() === "openai") {
    const result = await transcribeWithModel(input);
    return { text: result.text, source: "whisper", title: input.filename };
  }
  return {
    source: "demo",
    title: input.filename,
    text: [
      DEMO_TRANSCRIPT_MARKER,
      "",
      `The recording "${input.filename}" is saved.`,
      "Demo mode cannot hear the audio, so this is not a transcript.",
      "Paste their words below, upload a text transcript, or insert the fictional sample to try a chapter draft.",
      "Nothing here is sent to an AI provider.",
    ].join("\n"),
  };
}
