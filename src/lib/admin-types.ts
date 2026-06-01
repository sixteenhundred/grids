/** Shared admin types — plain module (importable from client & server). */

export type FlagMap = Record<string, boolean>;

export type DbStatus = {
  configured: boolean;
  connected: boolean;
  driver: string;
  tables: Record<string, number | null>;
  error?: string;
};

export type EnvVarStatus = { name: string; present: boolean; public: boolean };

export type AuditReport = {
  at: number;
  bootId: string;
  uptimeMs: number;
  node: string;
  env: string;
  db: DbStatus;
  envVars: EnvVarStatus[];
  features: { total: number; enabled: number; disabled: number; off: string[] };
};

export type ServerActionResult = {
  ok: boolean;
  message: string;
  detail?: Record<string, unknown>;
};
