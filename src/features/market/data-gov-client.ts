import "server-only";
import type { MarketDataConfig } from "@/config/env";
import { ConfigurationError, ExternalServiceError } from "@/lib/errors";

const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_LIMIT = 1000;

export interface DataGovQuery {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  limit?: number;
}

export interface DataGovEnvelope {
  records?: unknown[];
  total?: number;
  count?: number;
}

export async function fetchDataGovResource(
  config: MarketDataConfig,
  query: DataGovQuery,
  fetcher: typeof fetch = fetch,
): Promise<unknown[]> {
  if (!config.provider || !config.baseUrl || !config.apiKey || !config.resourceId) {
    throw new ConfigurationError(
      "Market-data configuration is incomplete. Set MARKET_DATA_PROVIDER, MARKET_DATA_BASE_URL, MARKET_DATA_API_KEY and MARKET_DATA_RESOURCE_ID.",
    );
  }

  const url = new URL(`${trimTrailingSlash(config.baseUrl)}/resource/${config.resourceId}`);
  url.searchParams.set("api-key", config.apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(query.limit ?? DEFAULT_LIMIT));

  let response: Response;
  try {
    response = await fetcher(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("timeout") || error instanceof DOMException) {
      throw new ExternalServiceError("The market-data provider timed out.", {
        cause: error,
      });
    }
    throw new ExternalServiceError("Could not reach the market-data provider.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw mapHttpError(response.status);
  }

  let payload: DataGovEnvelope | null = null;
  try {
    payload = (await response.json()) as DataGovEnvelope;
  } catch {
    throw new ExternalServiceError("The market-data provider returned invalid JSON.");
  }

  if (!Array.isArray(payload?.records)) {
    throw new ExternalServiceError(
      "The market-data provider returned an unexpected response shape.",
    );
  }

  return payload.records;
}

function mapHttpError(status: number): ExternalServiceError {
  switch (status) {
    case 400:
      return new ExternalServiceError("The market-data request was rejected.");
    case 401:
    case 403:
      return new ExternalServiceError(
        "Market-data access was denied. Check the API key configuration.",
      );
    case 404:
      return new ExternalServiceError(
        "The market-data resource was not found. Check MARKET_DATA_RESOURCE_ID.",
      );
    case 429:
      return new ExternalServiceError(
        "The market-data provider rate limit was reached.",
      );
    default:
      return new ExternalServiceError(
        "The market-data provider is temporarily unavailable.",
      );
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
