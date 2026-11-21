import { getStore, type Store } from "@netlify/blobs";
import type { Repository } from "@/lib/db/repository";
import type {
  Chapter,
  Draft,
  Project,
  Question,
  Recording,
  Transcript,
  User,
} from "@/lib/types";
import { assertSafeKey, assertUuid, MAX_AUDIO_BYTES } from "@/lib/uploads/limits";

const STORE = "legacy-builder";

function store(): Store {
  return getStore({ name: STORE, consistency: "strong" });
}

async function readJson<T>(key: string): Promise<T | null> {
  const value = await store().get(key, { type: "json", consistency: "strong" });
  return (value ?? null) as T | null;
}

async function writeJson(key: string, value: unknown) {
  await store().setJSON(key, value);
}

async function readIds(key: string): Promise<string[]> {
  const value = await readJson<unknown>(key);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function pushId(key: string, id: string) {
  const ids = await readIds(key);
  if (!ids.includes(id)) ids.push(id);
  await writeJson(key, ids);
}

async function removeId(key: string, id: string) {
  const ids = (await readIds(key)).filter((item) => item !== id);
  await writeJson(key, ids);
}

function bytesKey(key: string) {
  assertSafeKey(key);
  return `file/${key}`;
}

function chunkKey(userId: string, uploadId: string, index: number) {
  assertUuid(userId);
  assertUuid(uploadId);
  if (!Number.isInteger(index) || index < 0 || index > 1000) throw new Error("Invalid chunk.");
  return `chunk/${userId}/${uploadId}/${index}`;
}

async function readBytes(key: string): Promise<Buffer | null> {
  const data = await store().get(key, { type: "arrayBuffer", consistency: "strong" });
  if (!data) return null;
  return Buffer.from(data);
}

async function writeBytes(key: string, data: Buffer) {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  await store().set(key, copy.buffer);
}

export function createBlobsDb(): Repository {
  const repo: Repository = {
    async createUser(user) {
      await writeJson(`user/${user.id}`, user);
      await writeJson(`email/${user.email}`, user.id);
    },
    async getUserById(id) {
      return readJson<User>(`user/${id}`);
    },
    async getUserByEmail(email) {
      const id = await readJson<string>(`email/${email}`);
      if (!id) return null;
      return readJson<User>(`user/${id}`);
    },
    async createProject({ project, chapters, questions }) {
      await writeJson(`project/${project.id}`, project);
      await pushId(`user/${project.userId}/projects`, project.id);
      await writeJson(
        `project/${project.id}/chapters`,
        chapters.map((chapter) => chapter.id),
      );
      for (const chapter of chapters) {
        await writeJson(`chapter/${chapter.id}`, chapter);
        await writeJson(`chapter-key/${project.id}/${chapter.key}`, chapter.id);
      }
      const byChapter = new Map<string, string[]>();
      for (const question of questions) {
        await writeJson(`question/${question.id}`, question);
        const list = byChapter.get(question.chapterId) || [];
        list.push(question.id);
        byChapter.set(question.chapterId, list);
      }
      for (const chapter of chapters) {
        await writeJson(`chapter/${chapter.id}/questions`, byChapter.get(chapter.id) || []);
      }
    },
    async updateProject(project) {
      await writeJson(`project/${project.id}`, project);
    },
    async getProject(id) {
      return readJson<Project>(`project/${id}`);
    },
    async listProjects(userId) {
      const ids = await readIds(`user/${userId}/projects`);
      const projects: Project[] = [];
      for (const id of ids) {
        const project = await readJson<Project>(`project/${id}`);
        if (project) projects.push(project);
      }
      return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async deleteProject(id) {
      const project = await readJson<Project>(`project/${id}`);
      const chapterIds = await readIds(`project/${id}/chapters`);
      for (const chapterId of chapterIds) {
        const chapter = await readJson<Chapter>(`chapter/${chapterId}`);
        for (const questionId of await readIds(`chapter/${chapterId}/questions`)) {
          await store().delete(`question/${questionId}`);
        }
        for (const recordingId of await readIds(`chapter/${chapterId}/recordings`)) {
          const recording = await readJson<Recording>(`recording/${recordingId}`);
          if (recording) await repo.deleteFile(recording.storageKey).catch(() => undefined);
          await store().delete(`recording/${recordingId}`);
        }
        for (const transcriptId of await readIds(`chapter/${chapterId}/transcripts`)) {
          await store().delete(`transcript/${transcriptId}`);
        }
        for (const version of await readIds(`chapter/${chapterId}/drafts`)) {
          await store().delete(`draft/${chapterId}/${version}`);
        }
        if (chapter) await store().delete(`chapter-key/${id}/${chapter.key}`);
        await store().delete(`chapter/${chapterId}`);
        await store().delete(`chapter/${chapterId}/questions`);
        await store().delete(`chapter/${chapterId}/recordings`);
        await store().delete(`chapter/${chapterId}/transcripts`);
        await store().delete(`chapter/${chapterId}/drafts`);
      }
      await store().delete(`project/${id}`);
      await store().delete(`project/${id}/chapters`);
      if (project) await removeId(`user/${project.userId}/projects`, id);
    },
    async listChapters(projectId) {
      const ids = await readIds(`project/${projectId}/chapters`);
      const chapters: Chapter[] = [];
      for (const id of ids) {
        const chapter = await readJson<Chapter>(`chapter/${id}`);
        if (chapter) chapters.push(chapter);
      }
      return chapters.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async getChapter(projectId, key) {
      const id = await readJson<string>(`chapter-key/${projectId}/${key}`);
      if (!id) return null;
      return readJson<Chapter>(`chapter/${id}`);
    },
    async getChapterById(id) {
      return readJson<Chapter>(`chapter/${id}`);
    },
    async chapterCounts(projectId) {
      const chapters = await repo.listChapters(projectId);
      const counts = [];
      for (const chapter of chapters) {
        counts.push({
          chapterId: chapter.id,
          key: chapter.key,
          questions: (await readIds(`chapter/${chapter.id}/questions`)).length,
          recordings: (await readIds(`chapter/${chapter.id}/recordings`)).length,
          transcripts: (await readIds(`chapter/${chapter.id}/transcripts`)).length,
          drafts: (await readIds(`chapter/${chapter.id}/drafts`)).length,
        });
      }
      return counts;
    },
    async listQuestions(chapterId) {
      const ids = await readIds(`chapter/${chapterId}/questions`);
      const questions: Question[] = [];
      for (const id of ids) {
        const question = await readJson<Question>(`question/${id}`);
        if (question) questions.push(question);
      }
      return questions.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async listQuestionsForProject(projectId) {
      const chapters = await repo.listChapters(projectId);
      const questions: Question[] = [];
      for (const chapter of chapters) questions.push(...(await repo.listQuestions(chapter.id)));
      return questions;
    },
    async setChapterQuestions(chapterId, questions) {
      const previous = await readIds(`chapter/${chapterId}/questions`);
      for (const id of previous) await store().delete(`question/${id}`);
      for (const question of questions) await writeJson(`question/${question.id}`, question);
      await writeJson(
        `chapter/${chapterId}/questions`,
        questions.map((question) => question.id),
      );
    },
    async updateQuestion(question) {
      await writeJson(`question/${question.id}`, question);
    },
    async deleteQuestion(id) {
      const question = await readJson<Question>(`question/${id}`);
      await store().delete(`question/${id}`);
      if (question) await removeId(`chapter/${question.chapterId}/questions`, id);
    },
    async reorderQuestions(chapterId, orderedIds) {
      const questions = await repo.listQuestions(chapterId);
      const byId = new Map(questions.map((question) => [question.id, question]));
      const next: Question[] = [];
      orderedIds.forEach((id, sortOrder) => {
        const question = byId.get(id);
        if (question) next.push({ ...question, sortOrder });
      });
      for (const question of next) await writeJson(`question/${question.id}`, question);
      await writeJson(
        `chapter/${chapterId}/questions`,
        next.map((question) => question.id),
      );
    },
    async createRecording(recording) {
      await writeJson(`recording/${recording.id}`, recording);
      await pushId(`chapter/${recording.chapterId}/recordings`, recording.id);
    },
    async listRecordings(chapterId) {
      const ids = await readIds(`chapter/${chapterId}/recordings`);
      const recordings: Recording[] = [];
      for (const id of ids) {
        const recording = await readJson<Recording>(`recording/${id}`);
        if (recording) recordings.push(recording);
      }
      return recordings.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async getRecording(id) {
      return readJson<Recording>(`recording/${id}`);
    },
    async deleteRecording(id) {
      const recording = await readJson<Recording>(`recording/${id}`);
      await store().delete(`recording/${id}`);
      if (!recording) return;
      await removeId(`chapter/${recording.chapterId}/recordings`, id);
      await repo.deleteFile(recording.storageKey).catch(() => undefined);
    },
    async createTranscript(transcript) {
      await writeJson(`transcript/${transcript.id}`, transcript);
      await pushId(`chapter/${transcript.chapterId}/transcripts`, transcript.id);
    },
    async updateTranscript(transcript) {
      await writeJson(`transcript/${transcript.id}`, transcript);
    },
    async listTranscripts(chapterId) {
      const ids = await readIds(`chapter/${chapterId}/transcripts`);
      const transcripts: Transcript[] = [];
      for (const id of ids) {
        const transcript = await readJson<Transcript>(`transcript/${id}`);
        if (transcript) transcripts.push(transcript);
      }
      return transcripts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async getTranscript(id) {
      return readJson<Transcript>(`transcript/${id}`);
    },
    async deleteTranscript(id) {
      const transcript = await readJson<Transcript>(`transcript/${id}`);
      await store().delete(`transcript/${id}`);
      if (transcript) await removeId(`chapter/${transcript.chapterId}/transcripts`, id);
    },
    async createDraft(draft) {
      await writeJson(`draft/${draft.chapterId}/${draft.version}`, draft);
      await pushId(`chapter/${draft.chapterId}/drafts`, String(draft.version));
    },
    async listDrafts(chapterId) {
      const versions = (await readIds(`chapter/${chapterId}/drafts`))
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value))
        .sort((a, b) => a - b);
      const drafts: Draft[] = [];
      for (const version of versions) {
        const draft = await readJson<Draft>(`draft/${chapterId}/${version}`);
        if (draft) drafts.push(draft);
      }
      return drafts;
    },
    async getDraft(chapterId, version) {
      return readJson<Draft>(`draft/${chapterId}/${version}`);
    },
    async saveFile(key, data) {
      await writeBytes(bytesKey(key), data);
    },
    async readFile(key) {
      return readBytes(bytesKey(key));
    },
    async deleteFile(key) {
      await store().delete(bytesKey(key));
    },
    async saveChunk(userId, uploadId, index, data) {
      await writeBytes(chunkKey(userId, uploadId, index), data);
    },
    async assembleChunks(userId, uploadId, total, destKey) {
      if (!Number.isInteger(total) || total < 1 || total > 1000) throw new Error("That upload is incomplete.");
      const parts: Buffer[] = [];
      let size = 0;
      for (let index = 0; index < total; index += 1) {
        const chunk = await readBytes(chunkKey(userId, uploadId, index));
        if (!chunk) throw new Error("The upload was missing a piece. Please try it again.");
        size += chunk.length;
        if (size > MAX_AUDIO_BYTES) throw new Error("That recording is larger than 150 MB.");
        parts.push(chunk);
      }
      await writeBytes(bytesKey(destKey), Buffer.concat(parts));
      for (let index = 0; index < total; index += 1) {
        await store().delete(chunkKey(userId, uploadId, index));
      }
      return size;
    },
  };
  return repo;
}
