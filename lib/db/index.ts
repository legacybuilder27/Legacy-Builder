import type { Repository } from "@/lib/db/repository";

export type DataDriver = "sqlite" | "blobs";

export function resolveDriver(): DataDriver {
  const forced = process.env.DATA_DRIVER;
  if (forced === "sqlite" || forced === "blobs") return forced;
  if (process.env.NETLIFY === "true") return "blobs";
  return "sqlite";
}

let pending: Promise<Repository> | null = null;

async function open(): Promise<Repository> {
  if (resolveDriver() === "blobs") {
    const { createBlobsDb } = await import("@/lib/db/blobs");
    return createBlobsDb();
  }
  const { createSqliteDb } = await import("@/lib/db/sqlite");
  return createSqliteDb();
}

export function getDb(): Promise<Repository> {
  if (!pending) pending = open();
  return pending;
}
