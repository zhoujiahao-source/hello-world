import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getWorkspaceDiff } from "./internalDiff.js";

describe("internal diff fallback", () => {
  it("returns internal diff for non-git folder", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ws-no-git-"));
    fs.writeFileSync(path.join(dir, "a.txt"), "hello\nworld\n");
    const result = await getWorkspaceDiff(dir);
    expect(["git", "internal"]).toContain(result.provider);
    expect(Array.isArray(result.files)).toBe(true);
    expect(typeof result.diff).toBe("string");
  });
});
