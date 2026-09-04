import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { parseOrThrow } from "@/lib/validation";
import {
  marketPricesQuerySchema,
  readSearchParams,
} from "@/features/market/query-schema";
import { getMarketPrices } from "@/features/market/market-service";
import type { MarketScope } from "@/features/market/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    await requireApiUser();

    const query = parseOrThrow(
      marketPricesQuerySchema,
      readSearchParams(request.nextUrl.searchParams),
    );

    const scope: MarketScope = {
      crop: query.crop,
      state: query.state,
      district: query.district,
      market: query.market,
    };

    const result = await getMarketPrices(scope);

    return ok({
      availability: result.availability,
      prices: result.records,
      meta: result.meta,
    });
  });
}
