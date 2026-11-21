import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { createSqliteDatabase } from "@/lib/db/sqlite";
import { buildRestore, buildVersion } from "@/lib/draft/versions";
import { CHAPTERS } from "@/lib/chapters/catalog";
import { nid, now } from "@/lib/ids";
import type { Draft, Project, Question } from "@/lib/types";

describe("sqlite repository", () => {
  it("stores drafts and a restored copy as a new version", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "legacy-builder-"));
    const db = createSqliteDatabase(new DatabaseSync(":memory:"), root);
    const timestamp = now();
    const userId = nid();
    await db.createUser({
      id: userId,
      email: "ada@example.com",
      name: "Ada",
      passwordHash: "hash",
      createdAt: timestamp,
    });
    const project: Project = {
      id: nid(),
      userId,
      parentName: "Elena Vasquez",
      relationship: "Mom",
      birthYear: "1951",
      birthPlace: "Millhaven",
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
    const chapter = {
      id: nid(),
      projectId: project.id,
      key: CHAPTERS[0].key,
      title: CHAPTERS[0].title,
      description: CHAPTERS[0].description,
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const question: Question = {
      id: nid(),
      chapterId: chapter.id,
      projectId: project.id,
      text: "What is the earliest thing you can remember?",
      source: "default",
      originText: null,
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.createProject({ project, chapters: [chapter], questions: [question] });
    const first = buildVersion([], {
      content: "We had a garden.",
      followUps: ["Who watered it?"],
      revisionNotes: "",
      source: "generate",
      restoredFromVersion: null,
    });
    const second = buildVersion([first], {
      content: "We had a garden. I watered it.",
      followUps: ["Who watered it?"],
      revisionNotes: "Edited by hand.",
      source: "edit",
      restoredFromVersion: null,
    });
    for (const version of [first, second]) {
      await db.createDraft(stored(chapter.id, project.id, version, timestamp));
    }
    const restored = buildRestore([first, second], 1);
    await db.createDraft(stored(chapter.id, project.id, restored, timestamp));
    const history = await db.listDrafts(chapter.id);
    expect(history.map((item) => item.version)).toEqual([1, 2, 3]);
    expect(history[2]?.content).toBe("We had a garden.");
    expect(history[1]?.content).toBe("We had a garden. I watered it.");
    const loaded = await db.getProject(project.id);
    expect(loaded?.userId).toBe(userId);
    expect(await db.getUserByEmail("ada@example.com")).toMatchObject({ name: "Ada" });
  });
});

function stored(
  chapterId: string,
  projectId: string,
  version: ReturnType<typeof buildVersion>,
  timestamp: string,
): Draft {
  return {
    id: nid(),
    chapterId,
    projectId,
    createdAt: timestamp,
    ...version,
  };
}
