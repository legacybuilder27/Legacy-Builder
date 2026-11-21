"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { chapterContext, materializeQuestions, projectContext } from "@/lib/actions/context";
import { nid, now } from "@/lib/ids";
import { prepareGuide } from "@/lib/ai/provider";
import { questionsForChapter } from "@/lib/questions/personalize";
import { reorderQuestions } from "@/lib/questions/order";
import { toBackground } from "@/lib/types";
import { withQuery } from "@/lib/text";

function back(projectId: string, chapterKey: string, query: Record<string, string | undefined> = {}) {
  return withQuery(`/projects/${projectId}/questions#${chapterKey}`, query);
}

export async function regenerateChapter(projectId: string, chapterKey: string) {
  const { db, project, chapter } = await chapterContext(projectId, chapterKey);
  try {
    const prepared = await prepareGuide(toBackground(project));
    const generated =
      prepared.guide.find((item) => item.key === chapter.key)?.questions ||
      questionsForChapter(chapter.key, toBackground(project));
    const existing = await db.listQuestions(chapter.id);
    await db.setChapterQuestions(chapter.id, materializeQuestions(chapter, existing, generated));
    redirect(back(projectId, chapterKey, { saved: "questions", warning: prepared.warning }));
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "The questions could not be refreshed.";
    redirect(back(projectId, chapterKey, { error: message.slice(0, 220) }));
  }
}

export async function saveQuestion(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const id = String(formData.get("questionId") || "");
  const text = String(formData.get("text") || "").replace(/\s+/g, " ").trim();
  if (text.length < 8) {
    redirect(back(projectId, chapterKey, { error: "A question needs a few more words." }));
  }
  const questions = await db.listQuestions(chapter.id);
  const question = questions.find((item) => item.id === id);
  if (!question) redirect(back(projectId, chapterKey, { error: "That question is no longer in this chapter." }));
  const changed = text !== question.text;
  await db.updateQuestion({
    ...question,
    text,
    source: changed ? "custom" : question.source,
    originText: changed && question.source !== "custom" && !question.originText ? question.text : question.originText,
    updatedAt: now(),
  });
  redirect(back(projectId, chapterKey, { saved: "questions" }));
}

export async function addQuestion(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const text = String(formData.get("text") || "").replace(/\s+/g, " ").trim();
  if (text.length < 8) {
    redirect(back(projectId, chapterKey, { error: "Write the question you want to ask." }));
  }
  const questions = await db.listQuestions(chapter.id);
  const sortOrder = questions.reduce((max, question) => Math.max(max, question.sortOrder), -1) + 1;
  const timestamp = now();
  const question = {
    id: nid(),
    chapterId: chapter.id,
    projectId: chapter.projectId,
    text,
    source: "custom" as const,
    originText: null,
    sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const next = [...questions, question].sort((a, b) => a.sortOrder - b.sortOrder);
  await db.setChapterQuestions(chapter.id, next);
  redirect(back(projectId, chapterKey, { saved: "questions" }));
}

export async function deleteQuestion(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const id = String(formData.get("questionId") || "");
  const questions = await db.listQuestions(chapter.id);
  if (!questions.some((question) => question.id === id)) {
    redirect(back(projectId, chapterKey));
  }
  await db.deleteQuestion(id);
  redirect(back(projectId, chapterKey, { saved: "questions" }));
}

export async function moveQuestion(projectId: string, chapterKey: string, formData: FormData) {
  const { db, chapter } = await chapterContext(projectId, chapterKey);
  const id = String(formData.get("questionId") || "");
  const direction = formData.get("direction") === "down" ? "down" : "up";
  const questions = await db.listQuestions(chapter.id);
  const next = reorderQuestions(questions, id, direction);
  await db.reorderQuestions(
    chapter.id,
    next.map((question) => question.id),
  );
  redirect(back(projectId, chapterKey));
}
