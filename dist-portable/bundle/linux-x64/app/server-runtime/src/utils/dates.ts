export function nowIso(): string {
  return new Date().toISOString();
}

export function parseIso(s: string): Date {
  return new Date(s);
}
