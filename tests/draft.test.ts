import { describe, expect, it } from "vitest";
import { draftChapter } from "@/lib/draft/draftChapter";
import { emptyBackground } from "@/lib/questions/personalize";
import { SAMPLE_FOLLOW_UP, SAMPLE_WORK_TRANSCRIPT } from "@/lib/sample/arthur";

const background = emptyBackground({
  parentName: "Zebediah Quill",
  career: "Lighthouse keeper in Maine",
  military: "Army band at Fort Greely",
  notes: "He loved the lighthouse.",
});

describe("chapter drafting", () => {
  it("uses the parent's words and does not import facts from the background", () => {
    const result = draftChapter({
      parentName: "Zebediah Quill",
      chapterKey: "early-childhood",
      chapterTitle: "Early childhood",
      background,
      transcripts: [
        {
          kind: "interview",
          content: "We had a small garden behind the house. I watered it after school.",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content.toLowerCase()).toContain("garden");
    expect(result.content.toLowerCase()).toContain("watered it after school");
    expect(result.content.toLowerCase()).not.toContain("lighthouse");
    expect(result.content.toLowerCase()).not.toContain("maine");
    expect(result.content.toLowerCase()).not.toContain("greely");
    expect(result.content.toLowerCase()).not.toContain("zebediah");
    expect(result.content.toLowerCase()).not.toContain("army");
  });

  it("marks uncertain names and leaves the sure sentence alone", () => {
    const result = draftChapter({
      parentName: "Arthur",
      chapterKey: "family-and-home",
      chapterTitle: "Family and home",
      transcripts: [
        {
          kind: "interview",
          content: "I think her name was Lillian. She lived next door.",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toMatch(/Lillian \[check\]/);
    expect(result.content).toContain("next door");
    expect(result.content).not.toMatch(/next door[\s\S]{0,12}\[check\]/);
    expect(result.followUps.some((question) => /Lillian/i.test(question))).toBe(true);
  });

  it("refuses to invent a chapter when there is no transcript", () => {
    const result = draftChapter({
      parentName: "Arthur",
      chapterKey: "work",
      chapterTitle: "Work",
      background,
      transcripts: [],
    });
    expect(result.ok).toBe(false);
  });

  it("shortens a draft without dropping the opening", () => {
    const transcript =
      "I started at the shop in the fall. The coffee was terrible and the floor was slick with oil. We made small parts for water valves all night. My partner on the lathe hummed while he worked. I walked home in the dark. Ruth left a plate in the oven. I was proud of that work and I stayed.";
    const full = draftChapter({
      parentName: "Arthur",
      chapterKey: "work",
      chapterTitle: "Work",
      transcripts: [{ kind: "interview", content: transcript }],
    });
    const short = draftChapter({
      parentName: "Arthur",
      chapterKey: "work",
      chapterTitle: "Work",
      transcripts: [{ kind: "interview", content: transcript }],
      revisionNotes: "make it shorter",
      previousDraft: full.ok ? full.content : "",
    });
    expect(full.ok && short.ok).toBe(true);
    if (!full.ok || !short.ok) return;
    expect(short.content.length).toBeLessThan(full.content.length);
    expect(short.content).toContain("I started at the shop");
  });

  it("folds follow-up answers only when asked", () => {
    const input = {
      parentName: "Arthur",
      chapterKey: "work",
      chapterTitle: "Work",
      transcripts: [
        { kind: "interview" as const, content: SAMPLE_WORK_TRANSCRIPT },
        { kind: "followup" as const, content: SAMPLE_FOLLOW_UP },
      ],
    };
    const without = draftChapter(input);
    const withFollowUp = draftChapter({
      ...input,
      includeFollowUps: true,
      revisionNotes: "add the answers from the follow-up call",
    });
    expect(without.ok && withFollowUp.ok).toBe(true);
    if (!without.ok || !withFollowUp.ok) return;
    expect(without.content).not.toContain("Ellis Ward");
    expect(withFollowUp.content).toContain("Ellis Ward");
    expect(withFollowUp.content).toContain("From the follow-up conversation");
    expect(withFollowUp.content).toContain("Harrow Valve Works");
    expect(withFollowUp.content).toMatch(/\[check\]/);
  });
});
