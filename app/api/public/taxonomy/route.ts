import { NextResponse } from "next/server";
import { getCachedPublicTaxonomy } from "@/lib/cache/public-data";

export async function GET() {
  try {
    const taxonomy = await getCachedPublicTaxonomy();
    return NextResponse.json(taxonomy, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Public taxonomy lookup failed:", error);
    return NextResponse.json(
      { error: "Public taxonomy is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
