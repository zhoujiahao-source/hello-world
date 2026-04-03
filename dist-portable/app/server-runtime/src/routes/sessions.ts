import type { FastifyInstance } from "fastify";
import {
  createSession, listSessions, getSessionById, deleteSession
} from "../repositories/sessionsRepo.js";
import { listMessages } from "../repositories/messagesRepo.js";
import { createSessionSchema } from "@usb-ai-workbench/shared";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { ZodError } from "zod";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { workspaceId?: string } }>("/sessions", async (req) => {
    return { success: true, data: listSessions(req.query.workspaceId) };
  });

  app.post("/sessions", async (req) => {
    let input;
    try {
      input = createSessionSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const session = createSession(input);
    return { success: true, data: session };
  });

  app.get<{ Params: { id: string } }>("/sessions/:id", async (req) => {
    const session = getSessionById(req.params.id);
    if (!session) throw new NotFoundError("Session", req.params.id);
    return { success: true, data: session };
  });

  app.get<{ Params: { id: string } }>("/sessions/:id/messages", async (req) => {
    const session = getSessionById(req.params.id);
    if (!session) throw new NotFoundError("Session", req.params.id);
    return { success: true, data: listMessages(req.params.id) };
  });

  app.delete<{ Params: { id: string } }>("/sessions/:id", async (req) => {
    const ok = deleteSession(req.params.id);
    if (!ok) throw new NotFoundError("Session", req.params.id);
    return { success: true, data: null };
  });
}
