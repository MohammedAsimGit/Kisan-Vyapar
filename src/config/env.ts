import "server-only";
import { z } from "zod";
import { ConfigurationError } from "@/lib/errors";

const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalNonEmptyString = z
  .preprocess(emptyStringToUndefined, z.string().trim().min(1))
  .optional();

const serverEnvSchema = z.object({
  MONGODB_URI: optionalNonEmptyString,
  DATABASE_NAME: optionalNonEmptyString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const DEFAULT_DATABASE_NAME = "kisan-vyapar";

let cachedServerEnv: ServerEnv | undefined;

function loadServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ConfigurationError(
      `Invalid server environment configuration. ${detail}`,
      { details: result.error.issues },
    );
  }

  return result.data;
}

export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = loadServerEnv();
  }
  return cachedServerEnv;
}

export interface DatabaseConfig {
  uri: string;
  name: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const env = getServerEnv();
  if (!env.MONGODB_URI) {
    throw new ConfigurationError(
      "MONGODB_URI is not configured. Copy .env.example to .env.local and set MONGODB_URI.",
    );
  }
  return {
    uri: env.MONGODB_URI,
    name: env.DATABASE_NAME ?? DEFAULT_DATABASE_NAME,
  };
}

export function isDatabaseConfigured(): boolean {
  return getServerEnv().MONGODB_URI !== undefined;
}
