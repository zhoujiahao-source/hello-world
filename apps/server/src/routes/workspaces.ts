import type { FastifyInstance } from "fastify";
import {
  createWorkspace, listWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace
} from "../repositories/workspacesRepo.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "@usb-ai-workbench/shared";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { ZodError } from "zod";
import { getWorkspaceDiff } from "../services/internalDiff.js";

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/workspaces", async () => {
    return { success: true, data: listWorkspaces() };
  });

  app.post("/workspaces", async (req) => {
    let input;
    try {
      input = createWorkspaceSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const workspace = createWorkspace(input);
    return { success: true, data: workspace };
  });

  app.get<{ Params: { id: string } }>("/workspaces/:id", async (req) => {
    const workspace = getWorkspaceById(req.params.id);
    if (!workspace) throw new NotFoundError("Workspace", req.params.id);
    return { success: true, data: workspace };
  });

  app.patch<{ Params: { id: string } }>("/workspaces/:id", async (req) => {
    let input;
    try {
      input = updateWorkspaceSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const workspace = updateWorkspace(req.params.id, input);
    if (!workspace) throw new NotFoundError("Workspace", req.params.id);
    return { success: true, data: workspace };
  });

  app.delete<{ Params: { id: string } }>("/workspaces/:id", async (req) => {
    const ok = deleteWorkspace(req.params.id);
    if (!ok) throw new NotFoundError("Workspace", req.params.id);
    return { success: true, data: null };
  });

  app.get<{ Params: { id: string } }>("/workspaces/:id/diff", async (req) => {
    const workspace = getWorkspaceById(req.params.id);
    if (!workspace) throw new NotFoundError("Workspace", req.params.id);
    const diff = await getWorkspaceDiff(workspace.path);
    return { success: true, data: diff };
  });
}
