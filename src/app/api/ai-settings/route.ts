import { NextResponse } from "next/server";
import { readAISettings, writeAISettings } from "@/lib/ai-settings";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await readAISettings(user.userId);
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await writeAISettings(user.userId, {
    baseUrl: body.baseUrl,
    model: body.model,
    apiKey: body.apiKey,
    systemPrompt: body.systemPrompt,
  });
  return NextResponse.json(updated);
}
