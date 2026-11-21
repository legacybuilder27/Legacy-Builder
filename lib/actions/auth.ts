"use server";

import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, setSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { nid, now } from "@/lib/ids";
import { safeNextPath, withQuery } from "@/lib/text";

function cleanEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

export async function signup(_prev: { error: string }, formData: FormData): Promise<{ error: string }> {
  const name = String(formData.get("name") || "").trim();
  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  if (name.length < 2) return { error: "Please add your name." };
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return { error: "That email does not look complete." };
  }
  if (password.length < 8) return { error: "Use at least 8 characters for the password." };
  const db = await getDb();
  const existing = await db.getUserByEmail(email);
  if (existing) return { error: "An account with that email already exists. Try signing in." };
  const user = {
    id: nid(),
    email,
    name,
    passwordHash: await hashPassword(password),
    createdAt: now(),
  };
  await db.createUser(user);
  await setSession(user.id);
  redirect("/projects");
}

export async function login(_prev: { error: string }, formData: FormData): Promise<{ error: string }> {
  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  const next = safeNextPath(String(formData.get("next") || ""));
  const db = await getDb();
  const user = await db.getUserByEmail(email);
  const matches = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !matches) {
    return { error: "That email and password did not match. If you are new here, create an account." };
  }
  await setSession(user.id);
  redirect(next);
}

export async function logout() {
  await clearSession();
  redirect(withQuery("/login", { saved: "signed-out" }));
}
