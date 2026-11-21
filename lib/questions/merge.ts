import type { Question, QuestionSource } from "@/lib/types";
import { normalizeQuestion } from "@/lib/text";

export type MergeQuestion = {
  id?: string;
  text: string;
  source: QuestionSource;
  originText: string | null;
  sortOrder: number;
};

export function mergeQuestions(
  existing: Question[],
  generated: { text: string; source: QuestionSource }[],
): MergeQuestion[] {
  const custom = existing
    .filter((question) => question.source === "custom")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const replaced = new Set(
    custom
      .map((question) => normalizeQuestion(question.originText || ""))
      .filter(Boolean),
  );
  const seen = new Set<string>();
  const fresh: MergeQuestion[] = [];
  for (const question of generated) {
    const key = normalizeQuestion(question.text);
    if (!key || seen.has(key) || replaced.has(key)) continue;
    seen.add(key);
    fresh.push({
      text: question.text,
      source: question.source,
      originText: null,
      sortOrder: fresh.length,
    });
  }
  const kept = custom
    .filter((question) => {
      const key = normalizeQuestion(question.text);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((question, index) => ({
      id: question.id,
      text: question.text,
      source: "custom" as const,
      originText: question.originText,
      sortOrder: fresh.length + index,
    }));
  return [...fresh, ...kept];
}
