import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "@usb-ai-workbench/shared";

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
  metadata: string;
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as Message["role"],
    content: row.content,
    createdAt: row.created_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}

export function addMessage(sessionId: string, role: Message["role"], content: string): Message {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO messages (id, session_id, role, content, created_at, metadata)
    VALUES (?, ?, ?, ?, ?, '{}')
  `).run(id, sessionId, role, content, nowIso());
  return rowToMessage(db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as MessageRow);
}

export function listMessages(sessionId: string): Message[] {
  const rows = getDb().prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(sessionId) as MessageRow[];
  return rows.map(rowToMessage);
}
