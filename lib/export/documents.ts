import type { ExportDocument } from "@/lib/export/model";
import { paragraphsOf } from "@/lib/export/model";
import type { Chapter, Draft, Project, Question } from "@/lib/types";
import { possessive } from "@/lib/text";

export function guideDocument(project: Project, chapters: Chapter[], questions: Question[]): ExportDocument {
  return {
    filename: `${project.parentName} interview guide`,
    title: `Interview guide for ${project.parentName}`,
    subtitle: "One chapter a conversation is plenty. Ask before you record, then let them wander.",
    blocks: chapters.map((chapter) => ({
      heading: chapter.title,
      paragraphs: questions
        .filter((question) => question.chapterId === chapter.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((question, index) => `${index + 1}. ${question.text}`),
    })),
  };
}

export function chapterDocument(project: Project, chapter: Chapter, draft: Draft): ExportDocument {
  const blocks = [
    {
      heading: chapter.title,
      paragraphs: paragraphsOf(draft.content),
    },
  ];
  if (draft.followUps.length) {
    blocks.push({
      heading: "Questions for the next conversation",
      paragraphs: draft.followUps.map((question, index) => `${index + 1}. ${question}`),
    });
  }
  return {
    filename: `${project.parentName} ${chapter.title}`,
    title: chapter.title,
    subtitle: `${possessive(project.parentName)} words, kept as a chapter.`,
    blocks,
  };
}
