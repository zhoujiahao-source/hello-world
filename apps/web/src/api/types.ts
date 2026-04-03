export type {
  Engine,
  Workspace,
  Session,
  Message,
  Run,
  Artifact,
  Schedule,
  Setting,
  EngineStatus,
} from "@usb-ai-workbench/shared";

export interface EngineDiagnostic {
  kind: "claude" | "codex" | "opencode" | "openclaw";
  enabled: boolean;
  openClawMvpDisabled: boolean;
  source: "bundled" | "configured" | "system-path" | "not-found";
  command: string;
  bundledPath: string | null;
  overridePath: string | null;
  pathFallbackAllowed: boolean;
  warnings: string[];
  status: {
    kind: string;
    health: string;
    version: string | null;
    executablePath: string | null;
    message: string | null;
  } | null;
  validation: { valid: boolean; message: string | null };
  metadata: Record<string, unknown>;
}

export interface ManifestState {
  manifest: Record<string, unknown> | null;
  exists: boolean;
  valid: boolean;
  errors: string[];
  path: string;
}

export interface RuntimeInfoResponse {
  runtime: {
    mode: "dev" | "portable" | "packaged";
    portable: boolean;
    bundleRoot: string;
    target: string;
    dataDir: string;
    manifestPath: string;
    webDistPath: string;
    bundledNodePath: string | null;
    targetRoot: string;
  };
  manifest: ManifestState;
  knownLimitations: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
  time: string;
  appRoot: string;
  dataDir: string;
  sseClients: number;
  runtime?: RuntimeInfoResponse["runtime"];
  manifest?: {
    valid: boolean;
    exists: boolean;
    errors: string[];
    summary: Record<string, unknown> | null;
  };
  limitations?: string[];
  config: { port: number };
}
