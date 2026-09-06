import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Result<T = unknown> = {
  success?: boolean;
  results?: T[];
  meta?: Record<string, unknown>;
};

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: <T = unknown>() => Promise<D1Result<T>>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  first: <T = unknown>() => Promise<T | null>;
};

export type SellComplyD1 = {
  prepare: (query: string) => D1Statement;
};

export function getOptionalDb(): SellComplyD1 | null {
  try {
    const { env } = getCloudflareContext();
    return ((env as unknown as Record<string, unknown>).DB as SellComplyD1 | undefined) ?? null;
  } catch {
    return null;
  }
}

export function databaseState(db: SellComplyD1 | null) {
  return db ? "connected" : "not_configured";
}
