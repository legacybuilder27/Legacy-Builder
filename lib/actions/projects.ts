"use server";

import { redirect } from "next/navigation";
import { context, materializeQuestions, projectContext } from "@/lib/actions/context";
import { CHAPTERS } from "@/lib/chapters/catalog";
import { draftChapter } from "@/lib/draft/draftChapter";
import { buildVersion } from "@/lib/draft/versions";
import { nid, now } from "@/lib/ids";
import { prepareGuide } from "@/lib/ai/provider";
import { buildInterviewGuide, questionsForChapter } from "@/lib/questions/personalize";
import { SAMPLE_BACKGROUND, SAMPLE_FOLLOW_UP, SAMPLE_PARENT, SAMPLE_WORK_TRANSCRIPT } from "@/lib/sample/arthur";
import { toBackground, type Chapter, type Project, type Question } from "@/lib/types";
import { withQuery } from "@/lib/text";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").replace(/\r\n/g, "\n").trim();
}

export async function createProject(formData: FormData) {
  const { db, user } = await context();
  const parentName = field(formData, "parentName");
  if (parentName.length < 2) {
    redirect(withQuery("/projects/new", { error: "Add the parent's name to start a project." }));
  }
  const timestamp = now();
  const project: Project = {
    id: nid(),
    userId: user.id,
    parentName,
    relationship: field(formData, "relationship"),
    birthYear: field(formData, "birthYear"),
    birthPlace: field(formData, "birthPlace"),
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
    isSample: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const built = seed(project);
  await db.createProject(built);
  redirect(`/projects/${project.id}/background`);
}

export async function createSampleProject() {
  const { db, user } = await context();
  const existing = (await db.listProjects(user.id)).find((project) => project.isSample);
  if (existing) redirect(`/projects/${existing.id}`);
  const timestamp = now();
  const project: Project = {
    id: nid(),
    userId: user.id,
    ...SAMPLE_BACKGROUND,
    isSample: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const built = seed(project);
  const work = built.chapters.find((chapter) => chapter.key === "work");
  if (!work) redirect("/projects");
  await db.createProject(built);
  const transcript = {
    id: nid(),
    chapterId: work.id,
    projectId: project.id,
    recordingId: null,
    title: "Fictional work interview",
    content: SAMPLE_WORK_TRANSCRIPT,
    source: "sample" as const,
    kind: "interview" as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.createTranscript(transcript);
  await db.createTranscript({
    ...transcript,
    id: nid(),
    title: "Follow-up on the foreman",
    content: SAMPLE_FOLLOW_UP,
    kind: "followup",
  });
  const drafted = draftChapter({
    parentName: project.parentName,
    chapterKey: work.key,
    chapterTitle: work.title,
    background: SAMPLE_BACKGROUND,
    transcripts: [{ content: SAMPLE_WORK_TRANSCRIPT, kind: "interview" }],
  });
  if (drafted.ok) {
    const version = buildVersion([], {
      content: drafted.content,
      followUps: drafted.followUps,
      revisionNotes: "",
      source: "generate",
      restoredFromVersion: null,
    });
    await db.createDraft({
      id: nid(),
      chapterId: work.id,
      projectId: project.id,
      ...version,
      createdAt: timestamp,
    });
  }
  redirect(`/projects/${project.id}?saved=sample`);
}

function seed(project: Project) {
  const timestamp = project.createdAt;
  const guide = buildInterviewGuide(toBackground(project));
  const chapters: Chapter[] = CHAPTERS.map((chapter, index) => ({
    id: nid(),
    projectId: project.id,
    key: chapter.key,
    title: chapter.title,
    description: chapter.description,
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const questions: Question[] = [];
  for (const chapter of chapters) {
    const generated = guide.find((item) => item.key === chapter.key)?.questions || questionsForChapter(chapter.key, toBackground(project));
    generated.forEach((question, index) => {
      questions.push({
        id: nid(),
        chapterId: chapter.id,
        projectId: project.id,
        text: question.text,
        source: question.source,
        originText: null,
        sortOrder: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  }
  return { project, chapters, questions };
}

export async function saveBackground(projectId: string, formData: FormData) {
  const { db, project } = await projectContext(projectId);
  const parentName = field(formData, "parentName");
  if (parentName.length < 2) {
    redirect(withQuery(`/projects/${projectId}/background`, { error: "The project needs a name." }));
  }
  await db.updateProject({
    ...project,
    parentName,
    relationship: field(formData, "relationship"),
    birthYear: field(formData, "birthYear"),
    birthPlace: field(formData, "birthPlace"),
    grewUp: field(formData, "grewUp"),
    familyMembers: field(formData, "familyMembers"),
    schooling: field(formData, "schooling"),
    career: field(formData, "career"),
    military: field(formData, "military"),
    faith: field(formData, "faith"),
    hobbies: field(formData, "hobbies"),
    lifeEvents: field(formData, "lifeEvents"),
    wantCovered: field(formData, "wantCovered"),
    avoidTopics: field(formData, "avoidTopics"),
    notes: field(formData, "notes"),
    updatedAt: now(),
  });
  redirect(withQuery(`/projects/${projectId}/background`, { saved: "background" }));
}

export async function refreshGuide(projectId: string) {
  const { db, project } = await projectContext(projectId);
  const chapters = await db.listChapters(project.id);
  const prepared = await prepareGuide(toBackground(project));
  for (const chapter of chapters) {
    const generated = prepared.guide.find((item) => item.key === chapter.key)?.questions || [];
    const existing = await db.listQuestions(chapter.id);
    await db.setChapterQuestions(chapter.id, materializeQuestions(chapter, existing, generated));
  }
  await db.updateProject({ ...project, updatedAt: now() });
  redirect(withQuery(`/projects/${projectId}/questions`, { saved: "questions", warning: prepared.warning }));
}

export async function deleteProject(projectId: string, formData: FormData) {
  const { db, project } = await projectContext(projectId);
  if (formData.get("confirm") !== "yes") {
    redirect(withQuery(`/projects/${projectId}`, { error: "Check the box to confirm you want to delete this project." }));
  }
  await db.deleteProject(project.id);
  redirect(withQuery("/projects", { saved: "deleted" }));
}
