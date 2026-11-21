import { describe, expect, it } from "vitest";
import { chapterProgress } from "@/lib/chapters/progress";
import { mergeQuestions } from "@/lib/questions/merge";
import { reorderQuestions } from "@/lib/questions/order";
import {
  avoidTerms,
  blockedByAvoid,
  buildInterviewGuide,
  emptyBackground,
} from "@/lib/questions/personalize";
import { nextStep } from "@/lib/projects/nextStep";
import { SAMPLE_BACKGROUND } from "@/lib/sample/arthur";
import type { Question } from "@/lib/types";

describe("interview questions", () => {
  it("gives every chapter a usable default set with no background", () => {
    const guide = buildInterviewGuide(emptyBackground());
    expect(guide).toHaveLength(10);
    for (const chapter of guide) {
      expect(chapter.questions.length).toBeGreaterThanOrEqual(6);
      expect(chapter.questions.every((question) => question.source === "default")).toBe(true);
    }
  });

  it("asks about an Army band from the background", () => {
    const guide = buildInterviewGuide(
      emptyBackground({
        military: "U.S. Army band, clarinet. Stationed at Fort Ellison, Alaska, from 1968 to 1970.",
        career: "Machinist at Harrow Valve Works for 34 years",
      }),
    );
    const work = guide.find((chapter) => chapter.key === "work");
    const text = work?.questions.map((question) => question.text).join("\n") || "";
    expect(text).toMatch(/audition/i);
    expect(text).toMatch(/bandmates/i);
    expect(text).toMatch(/stationed/i);
    expect(text).toMatch(/Fort Ellison/);
    expect(text).toMatch(/Harrow Valve Works/);
  });

  it("skips topics the family asked to avoid", () => {
    const guide = buildInterviewGuide(
      emptyBackground({
        avoidTopics: "faith, money",
        faith: "First Methodist every Sunday",
        lifeEvents: "Money troubles in the 1980s",
      }),
    );
    const faith = guide.find((chapter) => chapter.key === "faith-and-values");
    const all = guide.flatMap((chapter) => chapter.questions.map((question) => question.text)).join("\n");
    expect(faith?.questions.length).toBeGreaterThan(0);
    expect(all).not.toMatch(/\bfaith\b/i);
    expect(all).not.toMatch(/\bchurch\b/i);
    expect(all).not.toMatch(/\bmoney\b/i);
  });

  it("does not turn private notes into questions", () => {
    const guide = buildInterviewGuide(
      emptyBackground({
        notes: "Private: he was a lighthouse keeper in Maine. Do not ask.",
      }),
    );
    const all = guide.flatMap((chapter) => chapter.questions.map((question) => question.text)).join("\n");
    expect(all.toLowerCase()).not.toContain("lighthouse");
    expect(all.toLowerCase()).not.toContain("maine");
  });

  it("keeps edited questions when suggestions are regenerated", () => {
    const existing = [
      question({
        id: "q1",
        text: "What is your first clear memory?",
        source: "custom",
        originText: "What is the earliest thing you can remember?",
        sortOrder: 0,
      }),
    ];
    const merged = mergeQuestions(existing, [
      { text: "What is the earliest thing you can remember?", source: "default" },
      { text: "Who took care of you during the day?", source: "default" },
    ]);
    expect(merged.map((item) => item.text)).toEqual([
      "Who took care of you during the day?",
      "What is your first clear memory?",
    ]);
    expect(merged[1]?.id).toBe("q1");
  });

  it("reorders questions without dropping any", () => {
    const items = [
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
      { id: "c", sortOrder: 2 },
    ];
    expect(reorderQuestions(items, "b", "up").map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(reorderQuestions(items, "a", "up").map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("blocks a question when an avoid term appears as a whole word", () => {
    const terms = avoidTerms("money troubles, Ruth's illness");
    expect(blockedByAvoid("How did money worries show up at home?", terms)).toBe(true);
    expect(blockedByAvoid("What was the wedding like?", terms)).toBe(false);
  });
});

describe("project progress", () => {
  it("names the next useful step", () => {
    expect(
      nextStep({
        projectId: "p1",
        richness: 0,
        chapters: [],
      }).href,
    ).toBe("/projects/p1/background");
    expect(
      nextStep({
        projectId: "p1",
        richness: 4,
        chapters: [{ key: "work", title: "Work", transcripts: 1, drafts: 0 }],
      }).title,
    ).toMatch(/Draft the work chapter/);
  });

  it("reports chapter status from what is actually saved", () => {
    expect(chapterProgress({ questionCount: 3, recordingCount: 0, transcriptCount: 0, draftCount: 0 }).label).toBe(
      "Questions ready",
    );
    expect(chapterProgress({ questionCount: 3, recordingCount: 1, transcriptCount: 1, draftCount: 1 }).key).toBe(
      "draft",
    );
  });

  it("builds the fictional sample without asking about the avoided money troubles", () => {
    const text = buildInterviewGuide(SAMPLE_BACKGROUND)
      .flatMap((chapter) => chapter.questions.map((question) => question.text))
      .join("\n");
    expect(text).toMatch(/audition/i);
    expect(text).toMatch(/Harrow Valve Works/);
    expect(text.toLowerCase()).not.toContain("money");
  });
});

function question(partial: Pick<Question, "id" | "text" | "source" | "originText" | "sortOrder">): Question {
  return {
    chapterId: "c",
    projectId: "p",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}
