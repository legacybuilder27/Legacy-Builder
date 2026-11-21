import { describe, expect, it } from "vitest";
import { buildRestore, buildVersion } from "@/lib/draft/versions";

describe("chapter versions", () => {
  it("numbers new versions and restores an older one without erasing history", () => {
    const first = buildVersion([], {
      content: "I ran a lathe.",
      followUps: ["Who was the foreman?"],
      revisionNotes: "",
      source: "generate",
      restoredFromVersion: null,
    });
    const second = buildVersion([first], {
      content: "I ran a lathe. The coffee was terrible.",
      followUps: ["Who was the foreman?"],
      revisionNotes: "Edited by hand.",
      source: "edit",
      restoredFromVersion: null,
    });
    const restored = buildRestore([first, second], 1);
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(restored.version).toBe(3);
    expect(restored.content).toBe(first.content);
    expect(restored.followUps).toEqual(first.followUps);
    expect(restored.source).toBe("restore");
    expect(restored.restoredFromVersion).toBe(1);
    expect([first, second, restored].map((item) => item.version)).toEqual([1, 2, 3]);
  });

  it("refuses to restore a version that does not exist", () => {
    expect(() => buildRestore([], 4)).toThrow(/not in the history/);
  });
});
