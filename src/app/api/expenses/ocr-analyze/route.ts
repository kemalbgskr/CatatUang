import { NextResponse } from "next/server";
import { recognize } from "tesseract.js";
import { prisma } from "@/lib/prisma";
import { readAISettings } from "@/lib/ai-settings";

export const runtime = "nodejs";

function parseAmountFromText(text: string) {
  const matches = text.match(/(?:rp|idr)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,})/gi) || [];
  const numbers = matches
    .map((m) => m.replace(/[^0-9]/g, ""))
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

function parseJsonResult(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as {
      category?: string;
      note?: string;
      amount?: number;
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File nota tidak ditemukan." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ocr = await recognize(buffer, "ind+eng");
  const ocrText = (ocr.data.text || "").trim();

  if (!ocrText) {
    return NextResponse.json({ error: "Teks pada nota tidak terbaca." }, { status: 422 });
  }

  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  const fallbackAmount = parseAmountFromText(ocrText);

  let suggestedCategoryName = categories[0]?.name || "Lain-lain";
  let suggestedNote = `Catatan dari nota: ${ocrText.slice(0, 180)}`;
  let suggestedAmount = fallbackAmount || 0;

  const settings = await readAISettings();
  if (settings.apiKey && settings.baseUrl && settings.model && categories.length > 0) {
    const endpoint = settings.baseUrl.trim();
    const isResponsesApi = endpoint.includes("/openai/responses");
    const modelName = settings.model.toLowerCase();
    const supportsTemperature = !modelName.includes("gpt-5");

    const prompt = [
      "Kamu adalah asisten pencatatan pengeluaran dari nota/resi.",
      "Pilih SATU kategori paling cocok dari daftar kategori berikut:",
      categories.map((c) => `- ${c.name}`).join("\n"),
      "",
      "Buat ringkasan catatan pengeluaran singkat (maksimal 120 karakter).",
      "Estimasi amount total yang paling masuk akal dari teks nota.",
      "",
      "Wajib balas JSON valid tanpa teks lain dengan format:",
      '{"category":"...","note":"...","amount":12345}',
      "",
      "Teks OCR nota:",
      ocrText,
    ].join("\n");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isResponsesApi) headers["api-key"] = settings.apiKey;
    else headers.Authorization = `Bearer ${settings.apiKey}`;

    const body = isResponsesApi
      ? {
          model: settings.model,
          ...(supportsTemperature ? { temperature: 0.2 } : {}),
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: settings.systemPrompt }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: prompt }],
            },
          ],
        }
      : {
          model: settings.model,
          ...(supportsTemperature ? { temperature: 0.2 } : {}),
          messages: [
            { role: "system", content: settings.systemPrompt },
            { role: "user", content: prompt },
          ],
        };

    const aiRes = await fetch(isResponsesApi ? endpoint : `${endpoint.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const content = isResponsesApi
        ? aiData?.output_text ||
          aiData?.output
            ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
            ?.map((chunk: { text?: string }) => chunk.text || "")
            ?.join("\n") ||
          ""
        : aiData?.choices?.[0]?.message?.content || "";

      const parsed = parseJsonResult(content);
      if (parsed) {
        if (parsed.category) suggestedCategoryName = parsed.category;
        if (parsed.note) suggestedNote = parsed.note;
        if (typeof parsed.amount === "number" && Number.isFinite(parsed.amount) && parsed.amount > 0) {
          suggestedAmount = Math.round(parsed.amount);
        }
      }
    }
  }

  const matchedCategory =
    categories.find((c) => c.name.toLowerCase() === suggestedCategoryName.toLowerCase()) ||
    categories.find((c) => suggestedCategoryName.toLowerCase().includes(c.name.toLowerCase())) ||
    categories[0] ||
    null;

  return NextResponse.json({
    ocrText,
    suggestedCategoryId: matchedCategory?.id || null,
    suggestedCategoryName: matchedCategory?.name || suggestedCategoryName,
    suggestedDescription: suggestedNote,
    suggestedAmount,
  });
}
