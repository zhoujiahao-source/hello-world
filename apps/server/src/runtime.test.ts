import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { resolveBundleRoot, resolvePortableDataDir, resolveManifestPath } from "./runtime.js";

describe("runtime resolver", () => {
  it("resolves bundle and data dirs from env", () => {
    const prevRoot = process.env.APP_ROOT;
    const prevData = process.env.APP_DATA_DIR;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-root-"));
    const data = path.join(root, "custom-data");
    process.env.APP_ROOT = root;
    process.env.APP_DATA_DIR = data;
    expect(resolveBundleRoot()).toBe(path.resolve(root));
    expect(resolvePortableDataDir()).toBe(path.resolve(data));
    expect(resolveManifestPath()).toBe(path.join(path.resolve(root), "manifest.json"));
    if (prevRoot === undefined) delete process.env.APP_ROOT; else process.env.APP_ROOT = prevRoot;
    if (prevData === undefined) delete process.env.APP_DATA_DIR; else process.env.APP_DATA_DIR = prevData;
  });
});
