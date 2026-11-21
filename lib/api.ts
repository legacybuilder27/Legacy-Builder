import { openSession, readCookie, SESSION_COOKIE } from "@/lib/auth/token";
import { getDb } from "@/lib/db";
import type { Repository } from "@/lib/db/repository";
import type { User } from "@/lib/types";

export async function apiUser(request: Request): Promise<{ user: User; db: Repository } | null> {
  const session = await openSession(readCookie(request, SESSION_COOKIE));
  if (!session) return null;
  const db = await getDb();
  const user = await db.getUserById(session.uid);
  if (!user) return null;
  return { user, db };
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("The upload did not come from this site.");
  }
  if (originHost !== host) throw new Error("The upload did not come from this site.");
}

export function plain(message: string, status = 400) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
