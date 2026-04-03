// Sanitize strings for safe use in file paths (no path traversal)
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, "_").slice(0, 200);
}

// Ensure a resolved path stays within a root directory
export function assertUnderRoot(root: string, target: string): void {
  const rel = target.startsWith(root);
  if (!rel) {
    throw new Error(`Path traversal attempt: ${target} is not under ${root}`);
  }
}
