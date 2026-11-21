import type {
  Chapter,
  ChapterCount,
  Draft,
  Project,
  Question,
  Recording,
  Transcript,
  User,
} from "@/lib/types";

export interface Repository {
  createUser(user: User): Promise<void>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  createProject(input: { project: Project; chapters: Chapter[]; questions: Question[] }): Promise<void>;
  updateProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project | null>;
  listProjects(userId: string): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;

  listChapters(projectId: string): Promise<Chapter[]>;
  getChapter(projectId: string, key: string): Promise<Chapter | null>;
  getChapterById(id: string): Promise<Chapter | null>;
  chapterCounts(projectId: string): Promise<ChapterCount[]>;

  listQuestions(chapterId: string): Promise<Question[]>;
  listQuestionsForProject(projectId: string): Promise<Question[]>;
  setChapterQuestions(chapterId: string, questions: Question[]): Promise<void>;
  updateQuestion(question: Question): Promise<void>;
  deleteQuestion(id: string): Promise<void>;
  reorderQuestions(chapterId: string, orderedIds: string[]): Promise<void>;

  createRecording(recording: Recording): Promise<void>;
  listRecordings(chapterId: string): Promise<Recording[]>;
  getRecording(id: string): Promise<Recording | null>;
  deleteRecording(id: string): Promise<void>;

  createTranscript(transcript: Transcript): Promise<void>;
  updateTranscript(transcript: Transcript): Promise<void>;
  listTranscripts(chapterId: string): Promise<Transcript[]>;
  getTranscript(id: string): Promise<Transcript | null>;
  deleteTranscript(id: string): Promise<void>;

  createDraft(draft: Draft): Promise<void>;
  listDrafts(chapterId: string): Promise<Draft[]>;
  getDraft(chapterId: string, version: number): Promise<Draft | null>;

  saveFile(key: string, data: Buffer): Promise<void>;
  readFile(key: string): Promise<Buffer | null>;
  deleteFile(key: string): Promise<void>;
  saveChunk(userId: string, uploadId: string, index: number, data: Buffer): Promise<void>;
  assembleChunks(userId: string, uploadId: string, total: number, destKey: string): Promise<number>;
}
