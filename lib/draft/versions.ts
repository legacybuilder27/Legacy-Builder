import type { DraftSource } from "@/lib/types";

export type VersionDraft = {
  version: number;
  content: string;
  followUps: string[];
  revisionNotes: string;
  source: DraftSource;
  restoredFromVersion: number | null;
};

export function nextVersionNumber(existing: { version: number }[]): number {
  return existing.reduce((max, item) => Math.max(max, item.version), 0) + 1;
}

export function buildVersion(
  existing: { version: number }[],
  input: Omit<VersionDraft, "version">,
): VersionDraft {
  return {
    version: nextVersionNumber(existing),
    content: input.content,
    followUps: [...input.followUps],
    revisionNotes: input.revisionNotes,
    source: input.source,
    restoredFromVersion: input.restoredFromVersion,
  };
}

export function buildRestore(existing: VersionDraft[], version: number): VersionDraft {
  const found = existing.find((item) => item.version === version);
  if (!found) {
    throw new Error("That version is not in the history.");
  }
  return buildVersion(existing, {
    content: found.content,
    followUps: [...found.followUps],
    revisionNotes: `Restored version ${found.version}.`,
    source: "restore",
    restoredFromVersion: found.version,
  });
}
