import { NextResponse } from "next/server";
import { readSavedAIAnalysis } from "@/lib/ai-analysis";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await readSavedAIAnalysis(user.userId);
  return NextResponse.json(saved);
}
