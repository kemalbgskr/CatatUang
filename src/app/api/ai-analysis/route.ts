import { NextResponse } from "next/server";
import { readSavedAIAnalysis } from "@/lib/ai-analysis";

export async function GET() {
  const saved = await readSavedAIAnalysis();
  return NextResponse.json(saved);
}
