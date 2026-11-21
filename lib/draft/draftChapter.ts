import { DEFAULT_QUESTIONS } from "@/lib/questions/bank";
import type { Background } from "@/lib/types";
import { uniqueStrings } from "@/lib/text";

export const DEMO_TRANSCRIPT_MARKER = "DEMO MODE: this is not a transcription.";

export type DraftTranscript = {
  content: string;
  kind: "interview" | "followup";
};

export type DraftInput = {
  parentName: string;
  chapterKey: string;
  chapterTitle: string;
  // Available to a model for spelling context. The demo drafter does not read it.
  background?: Background;
  transcripts: DraftTranscript[];
  revisionNotes?: string;
  includeFollowUps?: boolean;
  previousDraft?: string;
};

export type DraftResult =
  | { ok: true; content: string; followUps: string[]; checks: string[] }
  | { ok: false; error: string };

const QUESTION_LINE = /^(q|question|interviewer|me|child)\s*[:\-]\s*/i;
const ANSWER_LINE = /^(a|answer|parent|dad|mom|mother|father|grandma|grandpa)\s*[:\-]\s*/i;

function extractParentSpeech(raw: string): string[] {
  const speech: string[] = [];
  let mode: "speech" | "prompt" = "speech";
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (QUESTION_LINE.test(trimmed)) {
      mode = "prompt";
      continue;
    }
    if (ANSWER_LINE.test(trimmed)) {
      mode = "speech";
      speech.push(trimmed.replace(ANSWER_LINE, "").trim());
      continue;
    }
    if (mode === "speech") speech.push(trimmed);
  }
  return speech;
}

function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  return clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function stripFiller(sentence: string): string {
  return sentence
    .replace(/\b(um+|uh+)\b[, ]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function ensurePunct(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed) return "";
  if (/[.!?]["']?$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function isUncertain(sentence: string): boolean {
  const patterns = [
    /\bi (think|believe)\b[^.?!]{0,90}\b(name|called|spelled|spelling)\b/i,
    /\bi (think|believe)\b[^.?!]{0,90}\b(19|20)\d{2}\b/i,
    /\b(i forget|i forgot)\b/i,
    /\b(not sure|don't remember|do not remember|can't remember|cannot remember|can't recall|cannot recall)\b/i,
    /\bor maybe\b/i,
    /\bit may have been\b/i,
    /\b(somewhere|or something)\b/i,
    /\b(around|about|sometime in)\s+(19|20)\d{2}\b/i,
    /\b[A-Z][a-z]+\s+or\s+[A-Z][a-z]+\b/,
    /\?\s*$/,
  ];
  return patterns.some((pattern) => pattern.test(sentence));
}

function markUncertainty(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed || trimmed.includes("[check]")) return trimmed;
  if (!isUncertain(trimmed)) return trimmed;
  const match = trimmed.match(/^(.*?)([.!?])$/);
  if (match) return `${match[1].trim()} [check]${match[2]}`;
  return `${trimmed} [check].`;
}

export function proseFromTranscript(raw: string): string {
  const paragraphs: string[] = [];
  for (const line of extractParentSpeech(raw)) {
    const sentences = splitSentences(line)
      .map(stripFiller)
      .map(ensurePunct)
      .map(markUncertainty)
      .filter((sentence) => sentence && !/^[.!?]+$/.test(sentence));
    if (sentences.length === 0) continue;
    if (sentences.length > 6) {
      for (let index = 0; index < sentences.length; index += 3) {
        paragraphs.push(sentences.slice(index, index + 3).join(" "));
      }
    } else {
      paragraphs.push(sentences.join(" "));
    }
  }
  return paragraphs.join("\n\n");
}

function withTitle(title: string, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return title;
  if (trimmed.toLowerCase().startsWith(title.toLowerCase())) return trimmed;
  return `${title}\n\n${trimmed}`;
}

function shorten(content: string): string {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks
    .map((block) => {
      if (block.split(/\s+/).length < 12 && !/[.!?]/.test(block)) return block;
      const sentences = splitSentences(block);
      if (sentences.length <= 1) return block;
      const kept = [sentences[0]];
      if (sentences.length > 3) kept.push(sentences[1]);
      for (const sentence of sentences.slice(kept.length)) {
        if (sentence.includes("[check]")) kept.push(sentence);
      }
      return kept.join(" ");
    })
    .join("\n\n");
}

function checksToQuestions(content: string): string[] {
  const out: string[] = [];
  for (const sentence of content.split(/(?<=[.!?])\s+/)) {
    if (!sentence.includes("[check]")) continue;
    const clean = sentence.replace(/\s*\[check\]/g, "").trim();
    if (clean.length < 8) continue;
    const quote = clean.length > 140 ? `${clean.slice(0, 139).trimEnd()}…` : clean;
    out.push(`Can you pin this down a little more: "${quote}"`);
  }
  return out.slice(0, 4);
}

function unansweredDefaults(chapterKey: string, transcript: string): string[] {
  const hay = transcript.toLowerCase();
  const stop = new Set([
    "about",
    "their",
    "there",
    "would",
    "should",
    "could",
    "because",
    "something",
    "someone",
    "years",
    "where",
    "which",
    "people",
    "family",
    "remember",
    "through",
    "another",
    "before",
    "after",
    "while",
    "first",
    "still",
  ]);
  const out: string[] = [];
  for (const question of DEFAULT_QUESTIONS[chapterKey] || []) {
    const words = question
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length >= 6 && !stop.has(word));
    if (words.length === 0) continue;
    const hits = words.filter((word) => hay.includes(word)).length;
    if (hits / words.length < 0.34) out.push(question);
    if (out.length >= 3) break;
  }
  return out;
}

function letterCount(text: string): number {
  return text.replace(/[^a-z]/gi, "").length;
}

export function draftChapter(input: DraftInput): DraftResult {
  const notes = input.revisionNotes?.trim() ?? "";
  const shorter = /\b(shorter|shorten)\b|\bcut (it|this) down\b/i.test(notes);
  const foldFollowUps = Boolean(input.includeFollowUps) || /\bfollow-?up\b|\badd the answers\b/i.test(notes);

  const usable = input.transcripts.filter((item) => !item.content.includes(DEMO_TRANSCRIPT_MARKER));
  const interviews = usable.filter((item) => item.kind !== "followup");
  const followups = usable.filter((item) => item.kind === "followup");

  let body = "";
  if (shorter && input.previousDraft?.trim()) {
    body = shorten(input.previousDraft.trim());
  } else {
    const prose = proseFromTranscript(interviews.map((item) => item.content).join("\n"));
    if (letterCount(prose) < 40) {
      return {
        ok: false,
        error: "Add a transcript of their own words before drafting this chapter.",
      };
    }
    body = withTitle(input.chapterTitle, prose);
    if (shorter) body = shorten(body);
  }

  if (foldFollowUps) {
    const extra = proseFromTranscript(followups.map((item) => item.content).join("\n"));
    if (extra.trim() && !body.includes("From the follow-up conversation")) {
      body = `${body.trim()}\n\nFrom the follow-up conversation\n\n${extra.trim()}`;
    }
  }

  const heard = [
    ...interviews.map((item) => item.content),
    ...(foldFollowUps ? followups.map((item) => item.content) : []),
  ].join("\n");
  const followUps = uniqueStrings([
    ...checksToQuestions(body),
    ...unansweredDefaults(input.chapterKey, heard),
    `Is there anything about ${input.chapterTitle.toLowerCase()} that we skipped and you want kept?`,
  ]).slice(0, 6);
  const checks = splitSentences(body).filter((sentence) => sentence.includes("[check]"));

  return { ok: true, content: body.trim(), followUps, checks };
}
