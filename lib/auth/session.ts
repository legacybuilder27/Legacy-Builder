import { cookies } from "next/headers";
import { cookieSecure, openSession, sealSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/token";

export async function getSession() {
  const jar = await cookies();
  return openSession(jar.get(SESSION_COOKIE)?.value);
}

export async function setSession(uid: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sealSession(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
