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
  MARKET_DATA_PROVIDER: optionalNonEmptyString,
  MARKET_DATA_BASE_URL: optionalNonEmptyString,
  MARKET_DATA_API_KEY: optionalNonEmptyString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export interface MarketDataConfig {
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
}

export function getMarketDataConfig(): MarketDataConfig {
  const env = getServerEnv();
  return {
    provider: env.MARKET_DATA_PROVIDER,
    baseUrl: env.MARKET_DATA_BASE_URL,
    apiKey: env.MARKET_DATA_API_KEY,
  };
}

export function isMarketDataSourceConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.MARKET_DATA_PROVIDER &&
      env.MARKET_DATA_BASE_URL &&
      env.MARKET_DATA_API_KEY,
  );
}

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
