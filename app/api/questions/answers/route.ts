import { NextResponse } from "next/server";
import { getCachedPublishedAnswer } from "@/lib/cache/public-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = [...new Set((url.searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > 5 || ids.some((id) => id.length > 128)) {
    return NextResponse.json(
      { error: "Provide between one and five question IDs." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const pairs = await Promise.all(ids.map(async (id) => {
    try {
      return [id, await getCachedPublishedAnswer(id)] as const;
    } catch (error) {
      console.error("Published answer cache lookup failed:", error);
      return null;
    }
  }));
  const answers = Object.fromEntries(pairs.filter((pair): pair is readonly [string, unknown] => pair !== null));
  return NextResponse.json(
    { answers },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240" } },
  );
}
