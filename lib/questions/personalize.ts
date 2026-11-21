import { CHAPTERS } from "@/lib/chapters/catalog";
import type { Background, QuestionSource } from "@/lib/types";
import { clauses, clip, normalizeQuestion } from "@/lib/text";
import { DEFAULT_QUESTIONS } from "@/lib/questions/bank";

export type GeneratedQuestion = {
  text: string;
  source: QuestionSource;
};

export type GuideChapter = {
  key: string;
  title: string;
  description: string;
  questions: GeneratedQuestion[];
};

const STOP = new Set([
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
  "year",
  "after",
  "before",
  "during",
  "while",
  "which",
  "where",
  "these",
  "those",
  "with",
  "from",
  "that",
  "this",
  "have",
  "your",
  "into",
  "them",
  "they",
  "were",
  "what",
  "when",
  "family",
  "story",
  "stories",
  "parent",
  "people",
  "other",
  "thing",
  "things",
  "details",
  "detail",
]);

const RELATED: Record<string, string[]> = {
  faith: ["faith", "church", "god", "religion", "religious", "prayer", "pray", "congregation"],
  church: ["church", "faith", "congregation", "pastor"],
  religion: ["religion", "religious", "faith", "church"],
  god: ["god", "faith", "church", "prayer"],
  money: ["money", "debt", "finances", "financial", "bills"],
  illness: ["illness", "sick", "disease", "diagnosis", "hospital"],
  cancer: ["cancer", "illness", "hospital"],
  death: ["death", "died", "dying", "funeral"],
  died: ["died", "death", "funeral"],
};

const HINTS: { key: string; words: string[] }[] = [
  { key: "education", words: ["school", "college", "teacher", "class", "university", "degree"] },
  { key: "work", words: ["job", "work", "retire", "retired", "factory", "office", "boss", "army", "navy", "military", "stationed", "band"] },
  { key: "marriage", words: ["marry", "married", "wedding", "wife", "husband", "spouse"] },
  { key: "raising-kids", words: ["kid", "kids", "child", "children", "son", "daughter", "baby", "grandchild", "grandkids", "grandson", "granddaughter"] },
  { key: "faith-and-values", words: ["church", "faith", "god", "pray", "congregation", "methodist", "catholic", "baptist"] },
  { key: "early-childhood", words: ["born", "farm", "childhood"] },
  { key: "family-and-home", words: ["mother", "father", "sibling", "brother", "sister", "house"] },
  { key: "teenage-years", words: ["teenage", "high school", "adolescent"] },
  { key: "later-life", words: ["death", "died", "funeral", "older", "widow", "loss", "lost"] },
];

export function emptyBackground(partial: Partial<Background> = {}): Background {
  return {
    parentName: "",
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
    ...partial,
  };
}

export function backgroundRichness(background: Background): number {
  return [
    background.birthYear,
    background.birthPlace,
    background.grewUp,
    background.familyMembers,
    background.schooling,
    background.career,
    background.military,
    background.faith,
    background.hobbies,
    background.lifeEvents,
    background.wantCovered,
  ].filter((value) => value.trim()).length;
}

export function avoidTerms(avoidText: string): string[] {
  const terms = new Set<string>();
  for (const phrase of clauses(avoidText.toLowerCase())) {
    const cleaned = phrase.replace(/'s\b/g, "").replace(/'/g, "").trim();
    if (cleaned.length >= 4) terms.add(cleaned);
    for (const word of cleaned.split(/[^a-z0-9]+/)) {
      if (word.length < 4 || STOP.has(word)) continue;
      terms.add(word);
      for (const extra of RELATED[word] || []) terms.add(extra);
    }
  }
  return [...terms].slice(0, 50);
}

export function blockedByAvoid(question: string, terms: string[]): boolean {
  return terms.some((term) => {
    if (term.includes(" ")) return question.toLowerCase().includes(term);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}`, "i").test(question);
  });
}

const FAITH_TERMS = new Set(["faith", "church", "god", "religion", "religious", "prayer", "pray", "congregation"]);

function faithIsAvoided(terms: string[]) {
  return terms.some((term) => FAITH_TERMS.has(term));
}

function properPhrases(text: string): string[] {
  const matches = text.match(
    /\b[A-Z][A-Za-z]*(?:'[A-Za-z]+)?(?:\s+[A-Z][A-Za-z]*(?:'[A-Za-z]+)?){1,4}\b/g,
  );
  return [...new Set(matches || [])].filter((phrase) => phrase.length > 3);
}

function chapterFor(text: string, fallback: string): string {
  const hay = text.toLowerCase();
  for (const hint of HINTS) {
    if (hint.words.some((word) => hay.includes(word))) return hint.key;
  }
  return fallback;
}

function addUnique(out: string[], question: string) {
  const trimmed = question.replace(/\s+/g, " ").trim();
  if (!trimmed) return;
  const key = normalizeQuestion(trimmed);
  if (out.some((item) => normalizeQuestion(item) === key)) return;
  out.push(trimmed);
}

function personalizedFor(chapterKey: string, background: Background, terms: string[]): string[] {
  const out: string[] = [];
  const military = background.military.trim();
  const militaryLower = military.toLowerCase();

  if (chapterKey === "early-childhood") {
    if (background.birthYear.trim()) {
      addUnique(
        out,
        `You were born in ${background.birthYear.trim()}. What was the family like around then, as you later heard it?`,
      );
    }
    if (background.birthPlace.trim()) {
      addUnique(
        out,
        `What do you know about being born in ${clip(background.birthPlace, 80)}, even if it comes from stories you were told?`,
      );
    }
    if (background.grewUp.trim()) {
      addUnique(
        out,
        `What do you remember about this place from when you were small: ${clip(background.grewUp)}?`,
      );
    }
  }

  if (chapterKey === "family-and-home") {
    for (const person of clauses(background.familyMembers).slice(0, 6)) {
      addUnique(out, `What should we know about ${clip(person, 80)}?`);
    }
    if (background.grewUp.trim()) {
      addUnique(out, `Who was around you in those years: ${clip(background.grewUp)}?`);
    }
  }

  if (chapterKey === "education") {
    for (const school of clauses(background.schooling).slice(0, 4)) {
      addUnique(out, `What do you remember about ${clip(school, 100)}?`);
    }
    for (const place of properPhrases(background.schooling)) {
      addUnique(out, `Who do you still picture when you think of ${place}?`);
    }
  }

  if (chapterKey === "work") {
    if (military && /band/.test(militaryLower)) {
      addUnique(out, "What was it like to audition for the band?");
      addUnique(out, "Who were the bandmates you still remember, and what were they like?");
      addUnique(out, "What did you play, and where did the band perform?");
    }
    if (military && /army|navy|air force|marine|coast guard|station|fort |base |deploy/.test(militaryLower)) {
      addUnique(out, "Where were you stationed, and what did an ordinary day there look like?");
    }
    const station = military.match(/\b(?:Fort|Camp|Base)\s+[A-Z][A-Za-z]+/);
    if (station) {
      addUnique(out, `What was ${station[0]} like while you were there?`);
    }
    if (military && !/band/.test(militaryLower)) {
      addUnique(
        out,
        `You mentioned service: ${clip(military, 120)}. What do you want the family to understand about that time?`,
      );
    }
    for (const place of properPhrases(background.career)) {
      addUnique(out, `What was an ordinary day like at ${place}?`);
    }
    if (background.career.trim()) {
      addUnique(out, `How did the work begin, and what was it: ${clip(background.career)}?`);
    }
  }

  if (chapterKey === "faith-and-values" && background.faith.trim() && !faithIsAvoided(terms)) {
    if (/not religious|no faith|atheist|agnostic|did not attend|didn't attend|wasn't religious|was not religious/i.test(background.faith)) {
      addUnique(
        out,
        "You noted that faith was not a big part of life. What did you believe instead, and how did that sit with the family?",
      );
    } else {
      addUnique(out, `What part did this play in a week of your life: ${clip(background.faith)}?`);
      for (const place of properPhrases(background.faith)) {
        addUnique(out, `What do you remember about ${place}?`);
      }
    }
  }

  if (chapterKey === "later-life") {
    for (const hobby of clauses(background.hobbies).slice(0, 4)) {
      addUnique(out, `How did ${clip(hobby, 80)} start for you, and who did you share it with?`);
    }
  }

  for (const event of clauses(background.lifeEvents)) {
    if (chapterFor(event, "later-life") !== chapterKey) continue;
    addUnique(out, `Tell the story of this, starting wherever you want: "${clip(event, 120)}."`);
  }

  for (const item of clauses(background.wantCovered)) {
    if (chapterFor(item, "advice-and-legacy") !== chapterKey) continue;
    addUnique(out, `You wanted to be sure we covered this: "${clip(item, 120)}." Where should we start?`);
  }

  return out.slice(0, 6);
}

export function questionsForChapter(chapterKey: string, background: Background): GeneratedQuestion[] {
  const terms = avoidTerms(background.avoidTopics);
  const defaults = (DEFAULT_QUESTIONS[chapterKey] || [])
    .filter((question) => !blockedByAvoid(question, terms))
    .map((text) => ({ text, source: "default" as const }));
  const seen = new Set(defaults.map((question) => normalizeQuestion(question.text)));
  const extra: GeneratedQuestion[] = [];
  for (const text of personalizedFor(chapterKey, background, terms)) {
    if (blockedByAvoid(text, terms)) continue;
    const key = normalizeQuestion(text);
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push({ text, source: "personalized" });
  }
  return [...defaults, ...extra];
}

export function buildInterviewGuide(background: Background): GuideChapter[] {
  return CHAPTERS.map((chapter) => ({
    key: chapter.key,
    title: chapter.title,
    description: chapter.description,
    questions: questionsForChapter(chapter.key, background),
  }));
}
