import { draftChapter, type DraftInput, type DraftResult } from "@/lib/draft/draftChapter";
import { usedUnspoken, unspokenPhrases } from "@/lib/ai/guard";
import type { Background } from "@/lib/types";
import type { GuideChapter } from "@/lib/questions/personalize";
import { avoidTerms, blockedByAvoid } from "@/lib/questions/personalize";
import { normalizeQuestion, uniqueStrings } from "@/lib/text";
import { DEMO_TRANSCRIPT_MARKER } from "@/lib/draft/draftChapter";
import { WHISPER_BYTES } from "@/lib/uploads/limits";

type ChatJson = Record<string, unknown>;

async function chatJson(system: string, user: string): Promise<ChatJson> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No OpenAI API key is set.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180).replace(key, "[key]");
    throw new Error(`The writing service returned ${response.status}. ${detail}`);
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content || "";
  return JSON.parse(content) as ChatJson;
}

export async function enrichGuideWithModel(
  background: Background,
  guide: GuideChapter[],
): Promise<{ guide: GuideChapter[]; warning?: string }> {
  try {
    const outline = guide.map((chapter) => ({
      key: chapter.key,
      title: chapter.title,
      questions: chapter.questions.map((question) => question.text),
    }));
    const result = await chatJson(
      [
        "You write interview questions for an adult child talking with an aging parent.",
        "Return JSON: { \"chapters\": { \"chapter-key\": [\"question\", \"question\"] } }.",
        "Add at most 3 new questions per chapter, and only when the background gives you something specific.",
        "Do not repeat questions already in the guide.",
        "Do not ask about topics the parent asked to avoid.",
        "Private notes are for the interviewer. Do not turn them into questions.",
        "Plain language. No em dashes. One question per string.",
      ].join(" "),
      JSON.stringify({
        background: {
          parentName: background.parentName,
          relationship: background.relationship,
          birthYear: background.birthYear,
          birthPlace: background.birthPlace,
          grewUp: background.grewUp,
          familyMembers: background.familyMembers,
          schooling: background.schooling,
          career: background.career,
          military: background.military,
          faith: background.faith,
          hobbies: background.hobbies,
          lifeEvents: background.lifeEvents,
          wantCovered: background.wantCovered,
          avoidTopics: background.avoidTopics,
        },
        privateNotes: background.notes,
        guide: outline,
      }),
    );
    const chapters = result.chapters;
    if (!chapters || typeof chapters !== "object") return { guide };
    const terms = avoidTerms(background.avoidTopics);
    const next = guide.map((chapter) => {
      const raw = (chapters as Record<string, unknown>)[chapter.key];
      const extras = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
      const seen = new Set(chapter.questions.map((question) => normalizeQuestion(question.text)));
      const added = [];
      for (const text of extras) {
        const clean = text.replace(/\s+/g, " ").trim();
        const key = normalizeQuestion(clean);
        if (!key || seen.has(key) || blockedByAvoid(clean, terms)) continue;
        seen.add(key);
        added.push({ text: clean, source: "personalized" as const });
        if (added.length >= 3) break;
      }
      return { ...chapter, questions: [...chapter.questions, ...added] };
    });
    return { guide: next };
  } catch {
    return {
      guide,
      warning: "ai",
    };
  }
}

export async function draftWithModel(input: DraftInput): Promise<DraftResult & { warning?: string }> {
  const fallback = draftChapter(input);
  const interviews = input.transcripts.filter(
    (item) => item.kind !== "followup" && !item.content.includes(DEMO_TRANSCRIPT_MARKER),
  );
  const followups = input.transcripts.filter(
    (item) => item.kind === "followup" && !item.content.includes(DEMO_TRANSCRIPT_MARKER),
  );
  const transcript = interviews.map((item) => item.content).join("\n\n").slice(0, 80000);
  if (!transcript.trim()) return fallback;
  try {
    const result = await chatJson(
      [
        "You edit a memoir chapter from a parent's recorded conversation.",
        "Write in the parent's first person, using only facts that appear in the transcripts.",
        "You may use the background to recognize a spelling, but do not add any person, place, date, job, or event the parent did not say.",
        "If a name, spelling, or date is uncertain, keep their wording and add an inline [check] immediately after it.",
        "Remove interviewer questions and filler such as um and uh. Do not invent connective stories.",
        "If revision notes ask to make it shorter, keep their words and cut repetition.",
        "Fold follow-up answers into the chapter only when asked. Put them in the same voice, after the earlier account.",
        "Do not use em dashes.",
        "Return JSON: { \"chapter\": \"prose\", \"followUps\": [\"question\"] }.",
        "followUps are 3 to 6 questions for the next call, aimed at [check] spots and gaps.",
      ].join(" "),
      JSON.stringify({
        parentName: input.parentName,
        chapterTitle: input.chapterTitle,
        avoidTopics: input.background?.avoidTopics || "",
        backgroundForSpellingOnly: input.background || null,
        revisionNotes: input.revisionNotes || "",
        includeFollowUps: Boolean(input.includeFollowUps),
        previousDraft: input.previousDraft || "",
        transcript,
        followUpAnswers: followups.map((item) => item.content).join("\n\n").slice(0, 20000),
      }),
    );
    const chapter = typeof result.chapter === "string" ? result.chapter.trim() : "";
    const followUps = Array.isArray(result.followUps)
      ? result.followUps.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    if (chapter.length < 40) return { ...fallback, warning: "ai" };
    const unspoken = unspokenPhrases(input.background || emptyish(input.parentName), `${transcript}\n${followups.map((item) => item.content).join("\n")}`);
    const invented = usedUnspoken(chapter, unspoken);
    if (invented.length > 0) {
      return { ...fallback, warning: "faithful" };
    }
    const checks = chapter.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.includes("[check]"));
    return {
      ok: true,
      content: chapter,
      followUps: uniqueStrings(followUps).slice(0, 6),
      checks,
    };
  } catch {
    return { ...fallback, warning: "ai" };
  }
}

function emptyish(parentName: string): Background {
  return {
    parentName,
    relationship: "",
    birthYear: "",
    birthPlace: "",
    grewUp: "",
    familyMembers: "",
    schooling: "",
    career: "",
    military: "",
    faith: "",
    hobbies: "",
    lifeEvents: "",
    wantCovered: "",
    avoidTopics: "",
    notes: "",
  };
}

export async function transcribeWithModel(input: {
  filename: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<{ text: string; source: "whisper" }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No OpenAI API key is set.");
  if (input.bytes.length > WHISPER_BYTES) {
    throw new Error(
      "This recording is over the 25 MB transcription limit. Paste a transcript, or split the audio into smaller files.",
    );
  }
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(input.bytes)], { type: input.mimeType }), input.filename);
  body.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  body.append("response_format", "text");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180).replace(key, "[key]");
    throw new Error(`Transcription returned ${response.status}. ${detail}`);
  }
  const text = (await response.text()).trim();
  if (!text) throw new Error("The transcription came back empty.");
  return { text, source: "whisper" };
}
