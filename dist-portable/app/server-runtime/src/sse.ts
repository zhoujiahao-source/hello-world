import type { FastifyReply } from "fastify";
import { SSE_EVENTS } from "@usb-ai-workbench/shared";

export interface SseClient {
  id: string;
  reply: FastifyReply;
  runId?: string;
  sessionId?: string;
}

const clients = new Map<string, SseClient>();

export function addSseClient(client: SseClient): void {
  clients.set(client.id, client);
}

export function removeSseClient(id: string): void {
  clients.delete(id);
}

export function sendSseEvent(
  clientId: string,
  event: string,
  data: unknown,
): void {
  const client = clients.get(clientId);
  if (!client) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  client.reply.raw.write(payload);
}

export function broadcastRunEvent(
  runId: string,
  event: string,
  data: unknown,
): void {
  for (const client of clients.values()) {
    if (client.runId === runId) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.reply.raw.write(payload);
    }
  }
}

export function broadcastSessionEvent(
  sessionId: string,
  event: string,
  data: unknown,
): void {
  for (const client of clients.values()) {
    if (client.sessionId === sessionId) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.reply.raw.write(payload);
    }
  }
}

export function pingAllClients(): void {
  for (const client of clients.values()) {
    const payload = `event: ${SSE_EVENTS.PING}\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`;
    client.reply.raw.write(payload);
  }
}

export function getClientCount(): number {
  return clients.size;
}
