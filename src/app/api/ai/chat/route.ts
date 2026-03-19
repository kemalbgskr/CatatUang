import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, context } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { aiSettings: true },
    });

    if (!user || !user.aiSettings || !user.aiSettings.apiKey) {
      return NextResponse.json({ error: "Konfigurasi API AI belum diatur" }, { status: 400 });
    }

    const { baseUrl, apiKey, model, systemPrompt } = user.aiSettings;

    // Build the payload for OpenRouter / OpenAI
    // We send context (like recent tx) if available
    let promptString = `${systemPrompt}\n\n`;
    if (context) {
      promptString += `Konteks Data Keuangan Pengguna saat ini:\n${JSON.stringify(context, null, 2)}\n\n`;
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://catatuang.app",
        "X-Title": "CatatUang App",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: promptString },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "API AI Error: " + errText }, { status: 500 });
    }

    const aiData = await res.json();
    return NextResponse.json({ reply: aiData.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
