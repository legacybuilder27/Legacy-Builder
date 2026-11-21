import type { Background } from "@/lib/types";

const PROPER =
  /\b[A-Z][A-Za-z]*(?:'[A-Za-z]+)?(?:\s+[A-Z][A-Za-z]*(?:'[A-Za-z]+)?){1,4}\b/g;

export function unspokenPhrases(background: Background, transcript: string): string[] {
  const source = [
    background.parentName,
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
    background.notes,
  ].join("\n");
  const phrases = source.match(PROPER) || [];
  const hay = transcript.toLowerCase();
  const unique = [...new Set(phrases)];
  return unique.filter((phrase) => {
    if (phrase.length < 6) return false;
    if (hay.includes(phrase.toLowerCase())) return false;
    const words = phrase
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length >= 5);
    if (words.length === 0) return false;
    return words.every((word) => !hay.includes(word));
  });
}

export function usedUnspoken(chapter: string, phrases: string[]): string[] {
  const hay = chapter.toLowerCase();
  return phrases.filter((phrase) => hay.includes(phrase.toLowerCase()));
}
