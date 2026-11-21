export type NextStep = {
  href: string;
  title: string;
  detail: string;
};

export function nextStep(input: {
  projectId: string;
  richness: number;
  chapters: { key: string; title: string; transcripts: number; drafts: number }[];
}): NextStep {
  const base = `/projects/${input.projectId}`;
  if (input.richness < 2) {
    return {
      href: `${base}/background`,
      title: "Add a little background",
      detail:
        "A few notes about where they lived, who was there, and the work they did will make the questions more specific.",
    };
  }
  const readyToDraft = input.chapters.find((chapter) => chapter.transcripts > 0 && chapter.drafts === 0);
  if (readyToDraft) {
    return {
      href: `${base}/chapters/${readyToDraft.key}`,
      title: `Draft the ${readyToDraft.title.toLowerCase()} chapter`,
      detail: "There is a transcript waiting. The draft will stay with what they actually said.",
    };
  }
  const drafted = input.chapters.find((chapter) => chapter.drafts > 0);
  const needsConversation = input.chapters.find((chapter) => chapter.transcripts === 0);
  if (!drafted && needsConversation) {
    return {
      href: `${base}/how-to`,
      title: "Record the first conversation",
      detail: "One chapter, about 30 to 60 minutes. Ask if you can record, then let them wander.",
    };
  }
  if (drafted) {
    return {
      href: `${base}/chapters/${drafted.key}`,
      title: "Read the draft, then plan the next call",
      detail: "Follow-up questions are saved with the chapter. Take a few of them into the next conversation.",
    };
  }
  return {
    href: `${base}/guide`,
    title: "Review the interview guide",
    detail: "You can edit any question, add your own, and print a copy to keep nearby.",
  };
}
