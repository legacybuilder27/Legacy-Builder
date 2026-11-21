import { mkdirSync } from "node:fs";
import { appendFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Repository } from "@/lib/db/repository";
import type {
  Chapter,
  ChapterCount,
  Draft,
  Project,
  Question,
  QuestionSource,
  Recording,
  Transcript,
  TranscriptKind,
  TranscriptSource,
  User,
} from "@/lib/types";
import { assertSafeKey, assertUuid, MAX_AUDIO_BYTES } from "@/lib/uploads/limits";

type Sql = DatabaseSync;

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value || 0);
}

function migrate(db: Sql) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      relationship TEXT NOT NULL DEFAULT '',
      birth_year TEXT NOT NULL DEFAULT '',
      birth_place TEXT NOT NULL DEFAULT '',
      grew_up TEXT NOT NULL DEFAULT '',
      family_members TEXT NOT NULL DEFAULT '',
      schooling TEXT NOT NULL DEFAULT '',
      career TEXT NOT NULL DEFAULT '',
      military TEXT NOT NULL DEFAULT '',
      faith TEXT NOT NULL DEFAULT '',
      hobbies TEXT NOT NULL DEFAULT '',
      life_events TEXT NOT NULL DEFAULT '',
      want_covered TEXT NOT NULL DEFAULT '',
      avoid_topics TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at);
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, key)
    );
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      text TEXT NOT NULL,
      source TEXT NOT NULL,
      origin_text TEXT,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id, sort_order);
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      storage_key TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      recording_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      follow_ups TEXT NOT NULL,
      revision_notes TEXT NOT NULL,
      source TEXT NOT NULL,
      restored_from_version INTEGER,
      created_at TEXT NOT NULL,
      UNIQUE(chapter_id, version)
    );
  `);
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: text(row.id),
    email: text(row.email),
    name: text(row.name),
    passwordHash: text(row.password_hash),
    createdAt: text(row.created_at),
  };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    parentName: text(row.parent_name),
    relationship: text(row.relationship),
    birthYear: text(row.birth_year),
    birthPlace: text(row.birth_place),
    grewUp: text(row.grew_up),
    familyMembers: text(row.family_members),
    schooling: text(row.schooling),
    career: text(row.career),
    military: text(row.military),
    faith: text(row.faith),
    hobbies: text(row.hobbies),
    lifeEvents: text(row.life_events),
    wantCovered: text(row.want_covered),
    avoidTopics: text(row.avoid_topics),
    notes: text(row.notes),
    isSample: num(row.is_sample) === 1,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function mapChapter(row: Record<string, unknown>): Chapter {
  return {
    id: text(row.id),
    projectId: text(row.project_id),
    key: text(row.key),
    title: text(row.title),
    description: text(row.description),
    sortOrder: num(row.sort_order),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function mapQuestion(row: Record<string, unknown>): Question {
  return {
    id: text(row.id),
    chapterId: text(row.chapter_id),
    projectId: text(row.project_id),
    text: text(row.text),
    source: text(row.source) as Question["source"],
    originText: row.origin_text == null ? null : text(row.origin_text),
    sortOrder: num(row.sort_order),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function mapRecording(row: Record<string, unknown>): Recording {
  return {
    id: text(row.id),
    chapterId: text(row.chapter_id),
    projectId: text(row.project_id),
    userId: text(row.user_id),
    filename: text(row.filename),
    mimeType: text(row.mime_type),
    byteSize: num(row.byte_size),
    storageKey: text(row.storage_key),
    createdAt: text(row.created_at),
  };
}

function mapTranscript(row: Record<string, unknown>): Transcript {
  return {
    id: text(row.id),
    chapterId: text(row.chapter_id),
    projectId: text(row.project_id),
    recordingId: row.recording_id == null ? null : text(row.recording_id),
    title: text(row.title),
    content: text(row.content),
    source: text(row.source) as TranscriptSource,
    kind: text(row.kind) as TranscriptKind,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function mapDraft(row: Record<string, unknown>): Draft {
  let followUps: string[] = [];
  try {
    const parsed = JSON.parse(text(row.follow_ups) || "[]");
    if (Array.isArray(parsed)) followUps = parsed.filter((item) => typeof item === "string");
  } catch {
    followUps = [];
  }
  return {
    id: text(row.id),
    chapterId: text(row.chapter_id),
    projectId: text(row.project_id),
    version: num(row.version),
    content: text(row.content),
    followUps,
    revisionNotes: text(row.revision_notes),
    source: text(row.source) as Draft["source"],
    restoredFromVersion: row.restored_from_version == null ? null : num(row.restored_from_version),
    createdAt: text(row.created_at),
  };
}

export function createSqliteDatabase(db: Sql, uploadRoot?: string): Repository {
  migrate(db);
  const root = uploadRoot || path.join(process.cwd(), "data", "uploads");

  const get = (sql: string, ...params: (string | number | null)[]) =>
    db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  const all = (sql: string, ...params: (string | number | null)[]) =>
    db.prepare(sql).all(...params) as Record<string, unknown>[];

  function filePath(key: string) {
    assertSafeKey(key);
    return path.join(root, "files", key);
  }

  function chunkPath(userId: string, uploadId: string, index: number) {
    assertUuid(userId);
    assertUuid(uploadId);
    if (!Number.isInteger(index) || index < 0 || index > 1000) throw new Error("Invalid chunk.");
    return path.join(root, "chunks", userId, uploadId, String(index));
  }

  const repo: Repository = {
    async createUser(user) {
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(user.id, user.email, user.name, user.passwordHash, user.createdAt);
    },
    async getUserById(id) {
      const row = get("SELECT * FROM users WHERE id = ?", id);
      return row ? mapUser(row) : null;
    },
    async getUserByEmail(email) {
      const row = get("SELECT * FROM users WHERE email = ?", email);
      return row ? mapUser(row) : null;
    },
    async createProject({ project, chapters, questions }) {
      db.exec("BEGIN");
      try {
        db.prepare(
          `INSERT INTO projects (
            id, user_id, parent_name, relationship, birth_year, birth_place, grew_up, family_members,
            schooling, career, military, faith, hobbies, life_events, want_covered, avoid_topics, notes,
            is_sample, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          project.id,
          project.userId,
          project.parentName,
          project.relationship,
          project.birthYear,
          project.birthPlace,
          project.grewUp,
          project.familyMembers,
          project.schooling,
          project.career,
          project.military,
          project.faith,
          project.hobbies,
          project.lifeEvents,
          project.wantCovered,
          project.avoidTopics,
          project.notes,
          project.isSample ? 1 : 0,
          project.createdAt,
          project.updatedAt,
        );
        const insertChapter = db.prepare(
          `INSERT INTO chapters (id, project_id, key, title, description, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const chapter of chapters) {
          insertChapter.run(
            chapter.id,
            chapter.projectId,
            chapter.key,
            chapter.title,
            chapter.description,
            chapter.sortOrder,
            chapter.createdAt,
            chapter.updatedAt,
          );
        }
        const insertQuestion = db.prepare(
          `INSERT INTO questions (id, chapter_id, project_id, text, source, origin_text, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const question of questions) {
          insertQuestion.run(
            question.id,
            question.chapterId,
            question.projectId,
            question.text,
            question.source,
            question.originText,
            question.sortOrder,
            question.createdAt,
            question.updatedAt,
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async updateProject(project) {
      db.prepare(
        `UPDATE projects SET parent_name = ?, relationship = ?, birth_year = ?, birth_place = ?, grew_up = ?,
         family_members = ?, schooling = ?, career = ?, military = ?, faith = ?, hobbies = ?, life_events = ?,
         want_covered = ?, avoid_topics = ?, notes = ?, updated_at = ? WHERE id = ?`,
      ).run(
        project.parentName,
        project.relationship,
        project.birthYear,
        project.birthPlace,
        project.grewUp,
        project.familyMembers,
        project.schooling,
        project.career,
        project.military,
        project.faith,
        project.hobbies,
        project.lifeEvents,
        project.wantCovered,
        project.avoidTopics,
        project.notes,
        project.updatedAt,
        project.id,
      );
    },
    async getProject(id) {
      const row = get("SELECT * FROM projects WHERE id = ?", id);
      return row ? mapProject(row) : null;
    },
    async listProjects(userId) {
      return all("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC", userId).map(mapProject);
    },
    async deleteProject(id) {
      const recordings = all("SELECT storage_key FROM recordings WHERE project_id = ?", id);
      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM drafts WHERE project_id = ?").run(id);
        db.prepare("DELETE FROM transcripts WHERE project_id = ?").run(id);
        db.prepare("DELETE FROM questions WHERE project_id = ?").run(id);
        db.prepare("DELETE FROM recordings WHERE project_id = ?").run(id);
        db.prepare("DELETE FROM chapters WHERE project_id = ?").run(id);
        db.prepare("DELETE FROM projects WHERE id = ?").run(id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      for (const row of recordings) {
        await repo.deleteFile(text(row.storage_key)).catch(() => undefined);
      }
    },
    async listChapters(projectId) {
      return all("SELECT * FROM chapters WHERE project_id = ? ORDER BY sort_order", projectId).map(mapChapter);
    },
    async getChapter(projectId, key) {
      const row = get("SELECT * FROM chapters WHERE project_id = ? AND key = ?", projectId, key);
      return row ? mapChapter(row) : null;
    },
    async getChapterById(id) {
      const row = get("SELECT * FROM chapters WHERE id = ?", id);
      return row ? mapChapter(row) : null;
    },
    async chapterCounts(projectId) {
      return all(
        `SELECT c.id as chapter_id, c.key as key,
          (SELECT COUNT(*) FROM questions q WHERE q.chapter_id = c.id) as questions,
          (SELECT COUNT(*) FROM recordings r WHERE r.chapter_id = c.id) as recordings,
          (SELECT COUNT(*) FROM transcripts t WHERE t.chapter_id = c.id) as transcripts,
          (SELECT COUNT(*) FROM drafts d WHERE d.chapter_id = c.id) as drafts
         FROM chapters c WHERE c.project_id = ? ORDER BY c.sort_order`,
        projectId,
      ).map((row) => ({
        chapterId: text(row.chapter_id),
        key: text(row.key),
        questions: num(row.questions),
        recordings: num(row.recordings),
        transcripts: num(row.transcripts),
        drafts: num(row.drafts),
      }));
    },
    async listQuestions(chapterId) {
      return all("SELECT * FROM questions WHERE chapter_id = ? ORDER BY sort_order, created_at", chapterId).map(mapQuestion);
    },
    async listQuestionsForProject(projectId) {
      return all(
        "SELECT * FROM questions WHERE project_id = ? ORDER BY sort_order, created_at",
        projectId,
      ).map(mapQuestion);
    },
    async setChapterQuestions(chapterId, questions) {
      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM questions WHERE chapter_id = ?").run(chapterId);
        const insert = db.prepare(
          `INSERT INTO questions (id, chapter_id, project_id, text, source, origin_text, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const question of questions) {
          insert.run(
            question.id,
            question.chapterId,
            question.projectId,
            question.text,
            question.source as QuestionSource,
            question.originText,
            question.sortOrder,
            question.createdAt,
            question.updatedAt,
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async updateQuestion(question) {
      db.prepare(
        `UPDATE questions SET text = ?, source = ?, origin_text = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      ).run(question.text, question.source, question.originText, question.sortOrder, question.updatedAt, question.id);
    },
    async deleteQuestion(id) {
      db.prepare("DELETE FROM questions WHERE id = ?").run(id);
    },
    async reorderQuestions(chapterId, orderedIds) {
      const update = db.prepare("UPDATE questions SET sort_order = ? WHERE id = ? AND chapter_id = ?");
      db.exec("BEGIN");
      try {
        orderedIds.forEach((id, index) => update.run(index, id, chapterId));
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async createRecording(recording) {
      db.prepare(
        `INSERT INTO recordings (id, chapter_id, project_id, user_id, filename, mime_type, byte_size, storage_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        recording.id,
        recording.chapterId,
        recording.projectId,
        recording.userId,
        recording.filename,
        recording.mimeType,
        recording.byteSize,
        recording.storageKey,
        recording.createdAt,
      );
    },
    async listRecordings(chapterId) {
      return all("SELECT * FROM recordings WHERE chapter_id = ? ORDER BY created_at", chapterId).map(mapRecording);
    },
    async getRecording(id) {
      const row = get("SELECT * FROM recordings WHERE id = ?", id);
      return row ? mapRecording(row) : null;
    },
    async deleteRecording(id) {
      const row = get("SELECT storage_key FROM recordings WHERE id = ?", id);
      db.prepare("DELETE FROM recordings WHERE id = ?").run(id);
      if (row) await repo.deleteFile(text(row.storage_key)).catch(() => undefined);
    },
    async createTranscript(transcript) {
      db.prepare(
        `INSERT INTO transcripts (id, chapter_id, project_id, recording_id, title, content, source, kind, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        transcript.id,
        transcript.chapterId,
        transcript.projectId,
        transcript.recordingId,
        transcript.title,
        transcript.content,
        transcript.source,
        transcript.kind,
        transcript.createdAt,
        transcript.updatedAt,
      );
    },
    async updateTranscript(transcript) {
      db.prepare("UPDATE transcripts SET title = ?, content = ?, kind = ?, updated_at = ? WHERE id = ?").run(
        transcript.title,
        transcript.content,
        transcript.kind,
        transcript.updatedAt,
        transcript.id,
      );
    },
    async listTranscripts(chapterId) {
      return all("SELECT * FROM transcripts WHERE chapter_id = ? ORDER BY created_at", chapterId).map(mapTranscript);
    },
    async getTranscript(id) {
      const row = get("SELECT * FROM transcripts WHERE id = ?", id);
      return row ? mapTranscript(row) : null;
    },
    async deleteTranscript(id) {
      db.prepare("DELETE FROM transcripts WHERE id = ?").run(id);
    },
    async createDraft(draft) {
      db.prepare(
        `INSERT INTO drafts (
          id, chapter_id, project_id, version, content, follow_ups, revision_notes, source, restored_from_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        draft.id,
        draft.chapterId,
        draft.projectId,
        draft.version,
        draft.content,
        JSON.stringify(draft.followUps),
        draft.revisionNotes,
        draft.source,
        draft.restoredFromVersion,
        draft.createdAt,
      );
    },
    async listDrafts(chapterId) {
      return all("SELECT * FROM drafts WHERE chapter_id = ? ORDER BY version", chapterId).map(mapDraft);
    },
    async getDraft(chapterId, version) {
      const row = get("SELECT * FROM drafts WHERE chapter_id = ? AND version = ?", chapterId, version);
      return row ? mapDraft(row) : null;
    },
    async saveFile(key, data) {
      const dest = filePath(key);
      await mkdir(path.dirname(dest), { recursive: true });
      await rm(dest, { force: true });
      await appendFile(dest, data);
    },
    async readFile(key) {
      try {
        return await readFile(filePath(key));
      } catch {
        return null;
      }
    },
    async deleteFile(key) {
      await rm(filePath(key), { force: true });
    },
    async saveChunk(userId, uploadId, index, data) {
      const dest = chunkPath(userId, uploadId, index);
      await mkdir(path.dirname(dest), { recursive: true });
      await rm(dest, { force: true });
      await appendFile(dest, data);
    },
    async assembleChunks(userId, uploadId, total, destKey) {
      if (!Number.isInteger(total) || total < 1 || total > 1000) throw new Error("That upload is incomplete.");
      const dest = filePath(destKey);
      await mkdir(path.dirname(dest), { recursive: true });
      await rm(dest, { force: true });
      let size = 0;
      for (let index = 0; index < total; index += 1) {
        let chunk: Buffer;
        try {
          chunk = await readFile(chunkPath(userId, uploadId, index));
        } catch {
          throw new Error("The upload was missing a piece. Please try it again.");
        }
        size += chunk.length;
        if (size > MAX_AUDIO_BYTES) throw new Error("That recording is larger than 150 MB.");
        await appendFile(dest, chunk);
      }
      await rm(path.dirname(chunkPath(userId, uploadId, 0)), { recursive: true, force: true });
      return size;
    },
  };

  return repo;
}

export function createSqliteDb(): Repository {
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "legacy.db");
  const holder = globalThis as unknown as { legacySqlite?: Sql };
  if (!holder.legacySqlite) {
    mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL;");
    holder.legacySqlite = db;
  }
  return createSqliteDatabase(holder.legacySqlite);
}
