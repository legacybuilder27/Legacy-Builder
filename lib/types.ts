export type QuestionSource = "default" | "personalized" | "custom";
export type TranscriptSource = "whisper" | "paste" | "upload" | "demo" | "sample";
export type TranscriptKind = "interview" | "followup";
export type DraftSource = "generate" | "regenerate" | "edit" | "restore";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type Project = {
  id: string;
  userId: string;
  parentName: string;
  relationship: string;
  birthYear: string;
  birthPlace: string;
  grewUp: string;
  familyMembers: string;
  schooling: string;
  career: string;
  military: string;
  faith: string;
  hobbies: string;
  lifeEvents: string;
  wantCovered: string;
  avoidTopics: string;
  notes: string;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Question = {
  id: string;
  chapterId: string;
  projectId: string;
  text: string;
  source: QuestionSource;
  originText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Recording = {
  id: string;
  chapterId: string;
  projectId: string;
  userId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  storageKey: string;
  createdAt: string;
};

export type Transcript = {
  id: string;
  chapterId: string;
  projectId: string;
  recordingId: string | null;
  title: string;
  content: string;
  source: TranscriptSource;
  kind: TranscriptKind;
  createdAt: string;
  updatedAt: string;
};

export type Draft = {
  id: string;
  chapterId: string;
  projectId: string;
  version: number;
  content: string;
  followUps: string[];
  revisionNotes: string;
  source: DraftSource;
  restoredFromVersion: number | null;
  createdAt: string;
};

export type ChapterCount = {
  chapterId: string;
  key: string;
  questions: number;
  recordings: number;
  transcripts: number;
  drafts: number;
};

export type Background = {
  parentName: string;
  relationship: string;
  birthYear: string;
  birthPlace: string;
  grewUp: string;
  familyMembers: string;
  schooling: string;
  career: string;
  military: string;
  faith: string;
  hobbies: string;
  lifeEvents: string;
  wantCovered: string;
  avoidTopics: string;
  notes: string;
};

export function toBackground(project: Pick<Project, keyof Background>): Background {
  return {
    parentName: project.parentName,
    relationship: project.relationship,
    birthYear: project.birthYear,
    birthPlace: project.birthPlace,
    grewUp: project.grewUp,
    familyMembers: project.familyMembers,
    schooling: project.schooling,
    career: project.career,
    military: project.military,
    faith: project.faith,
    hobbies: project.hobbies,
    lifeEvents: project.lifeEvents,
    wantCovered: project.wantCovered,
    avoidTopics: project.avoidTopics,
    notes: project.notes,
  };
}
