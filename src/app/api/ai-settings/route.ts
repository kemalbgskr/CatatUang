import { NextResponse } from "next/server";
import { readAISettings, writeAISettings } from "@/lib/ai-settings";

export async function GET() {
  const settings = await readAISettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const updated = await writeAISettings({
    baseUrl: body.baseUrl,
    model: body.model,
    apiKey: body.apiKey,
    systemPrompt: body.systemPrompt,
  });
  return NextResponse.json(updated);
}
