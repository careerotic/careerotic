import { NextResponse } from "next/server";
import { getCachedQuestionFilterPage } from "@/lib/cache/public-data";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsePositive = (value: string | null, fallback: number, max: number) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback;
  };
  const page = parsePositive(params.get("page"), 1, 100000);
  const pageSize = parsePositive(params.get("pageSize"), 25, 50);
  const subjectId = (params.get("subjectId") ?? "all").slice(0, 128);
  const topicId = (params.get("topicId") ?? "all").slice(0, 128);
  const language = (params.get("language") ?? "all").slice(0, 32);
  const search = (params.get("search") ?? "").trim().slice(0, 100);
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";

  try {
    const result = await getCachedQuestionFilterPage(page, pageSize, subjectId, topicId, language, search, sort);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240" },
    });
  } catch (error) {
    console.error("Public filtered question lookup failed:", error);
    return NextResponse.json(
      { error: "Questions are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
