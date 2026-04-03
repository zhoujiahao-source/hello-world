import { runCommand } from "./process.js";

export async function getGitInfo(cwd: string): Promise<{ branch: string | null; commit: string | null }> {
  const branchResult = await runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  const commitResult = await runCommand("git", ["rev-parse", "--short", "HEAD"], { cwd });
  return {
    branch: branchResult.exitCode === 0 ? branchResult.stdout.trim() : null,
    commit: commitResult.exitCode === 0 ? commitResult.stdout.trim() : null,
  };
}
