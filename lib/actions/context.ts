import { notFound, redirect } from "next/navigation";
import { clearSession, getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { Repository } from "@/lib/db/repository";
import { nid, now } from "@/lib/ids";
import { mergeQuestions } from "@/lib/questions/merge";
import type { Chapter, Question, User } from "@/lib/types";

export type PublicUser = { id: string; name: string; email: string };

export function publicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export async function context(): Promise<{ db: Repository; user: User }> {
  const session = await getSession();
  if (!session) redirect("/login");
  const db = await getDb();
  const user = await db.getUserById(session.uid);
  if (!user) {
    await clearSession();
    redirect("/login");
  }
  return { db, user };
}

export async function projectContext(projectId: string) {
  const { db, user } = await context();
  const project = await db.getProject(projectId);
  if (!project || project.userId !== user.id) notFound();
  return { db, user, project };
}

export async function chapterContext(projectId: string, chapterKey: string) {
  const base = await projectContext(projectId);
  const chapter = await base.db.getChapter(projectId, chapterKey);
  if (!chapter) notFound();
  return { ...base, chapter };
}

export function materializeQuestions(
  chapter: Chapter,
  existing: Question[],
  generated: { text: string; source: Question["source"] }[],
): Question[] {
  const merged = mergeQuestions(existing, generated);
  const byId = new Map(existing.map((question) => [question.id, question]));
  const timestamp = now();
  return merged.map((question) => {
    const prior = question.id ? byId.get(question.id) : undefined;
    return {
      id: question.id || nid(),
      chapterId: chapter.id,
      projectId: chapter.projectId,
      text: question.text,
      source: question.source,
      originText: question.originText,
      sortOrder: question.sortOrder,
      createdAt: prior?.createdAt || timestamp,
      updatedAt: timestamp,
    };
  });
}
