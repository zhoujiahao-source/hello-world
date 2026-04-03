import path from "node:path";

// Sanitize strings for safe use in file paths (no path traversal)
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, "_").slice(0, 200);
}

// Ensure a resolved path stays within a root directory
export function assertUnderRoot(root: string, target: string): void {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path traversal attempt: ${target} is not under ${root}`);
  }
}
