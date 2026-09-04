import { describe, expect, it } from "vitest";
import { fetchDataGovResource } from "./data-gov-client";
import { ConfigurationError, ExternalServiceError } from "@/lib/errors";

const config = {
  provider: "data.gov.in",
  baseUrl: "https://api.data.gov.in",
  apiKey: "test-key",
  resourceId: "test-resource",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("data.gov.in client", () => {
  it("throws a configuration error when configuration is incomplete", async () => {
    await expect(
      fetchDataGovResource({ provider: "data.gov.in" }, {}),
    ).rejects.toThrow(ConfigurationError);
  });

  it("returns records from a valid envelope", async () => {
    const fetcher = async () =>
      jsonResponse({ records: [{ commodity: "Tomato" }], total: 1, count: 1 });
    const records = await fetchDataGovResource(config, {}, fetcher);
    expect(records).toEqual([{ commodity: "Tomato" }]);
  });

  it("sends filters for state/commodity on the resource request", async () => {
    let requestedUrl = "";
    const fetcher = async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return jsonResponse({ records: [] });
    };
    await fetchDataGovResource(
      config,
      { state: "Karnataka", commodity: "Tomato" },
      fetcher,
    );
    expect(requestedUrl).toContain("filters%5Bstate%5D=Karnataka");
    expect(requestedUrl).toContain("filters%5Bcommodity%5D=Tomato");
  });

  it("falls back to an unfiltered request when filters return 400", async () => {
    const calls: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("filters%5Bstate%5D")) {
        return jsonResponse({ message: "bad request" }, 400);
      }
      return jsonResponse({ records: [{ commodity: "Tomato" }] });
    };
    const records = await fetchDataGovResource(
      config,
      { state: "Karnataka" },
      fetcher,
    );
    expect(calls.length).toBe(2);
    expect(records).toEqual([{ commodity: "Tomato" }]);
  });

  it("maps HTTP 401/403 to a denial error", async () => {
    const fetcher = async () => jsonResponse({ message: "forbidden" }, 403);
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("maps HTTP 404 to an invalid-resource error", async () => {
    const fetcher = async () => jsonResponse({ message: "not found" }, 404);
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("maps HTTP 429 to a rate-limit error", async () => {
    const fetcher = async () => jsonResponse({}, 429);
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("maps HTTP 500/503 to an availability error", async () => {
    const fetcher = async () => jsonResponse({}, 503);
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("rejects malformed JSON", async () => {
    const fetcher = async () => new Response("not-json", { status: 200 });
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("rejects a payload without a records array", async () => {
    const fetcher = async () => jsonResponse({ data: [] });
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });

  it("surfaces timeouts as external service errors", async () => {
    const fetcher = async () => {
      throw new Error("The operation was aborted due to timeout");
    };
    await expect(fetchDataGovResource(config, {}, fetcher)).rejects.toThrow(
      ExternalServiceError,
    );
  });
});
