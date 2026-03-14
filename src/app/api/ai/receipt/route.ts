import { NextResponse } from "next/server";
import { readAISettings } from "@/lib/ai-settings";

type CategoryInput = { id: number; name: string };

function extractJsonObject(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const raw = text.slice(first, last + 1);
  try {
    return JSON.parse(raw) as {
      categoryName?: string;
      amount?: number;
      description?: string;
      note?: string;
    };
  } catch {
    return null;
  }
}

function fallbackAmountFromText(text: string) {
  const matches = text.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+/g) || [];
  const nums = matches
    .map((m) => Number(m.replace(/\./g, "").replace(/,/g, ".")))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 1_000_000_000);
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}

function bestCategoryId(name: string | undefined, categories: CategoryInput[]) {
  if (!name) return "";
  const needle = name.toLowerCase();
  const exact = categories.find((c) => c.name.toLowerCase() === needle);
  if (exact) return String(exact.id);

  const partial = categories.find((c) => needle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(needle));
  if (partial) return String(partial.id);
  return "";
}

export async function POST(req: Request) {
  const body = await req.json();
  const ocrText = String(body.ocrText || "").trim();
  const categories = (body.categories || []) as CategoryInput[];

  if (!ocrText) {
    return NextResponse.json({ error: "Teks OCR kosong." }, { status: 400 });
  }

  const settings = await readAISettings();
  const endpoint = settings.baseUrl.trim();
  const isResponsesApi = endpoint.includes("/openai/responses");
  const modelName = settings.model.toLowerCase();
  const supportsTemperature = !modelName.includes("gpt-5");

  if (!settings.apiKey || !endpoint || !settings.model) {
    const fallbackAmount = fallbackAmountFromText(ocrText);
    return NextResponse.json({
      suggestedCategoryId: "",
      suggestedCategoryName: "",
      suggestedAmount: fallbackAmount,
      suggestedDescription: "Pengeluaran dari nota",
      noteText: `OCR fallback (tanpa AI): ${ocrText.slice(0, 250)}`,
    });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isResponsesApi) headers["api-key"] = settings.apiKey;
  else headers.Authorization = `Bearer ${settings.apiKey}`;

  const categoriesText = categories.map((c) => c.name).join(", ");
  const userPrompt =
    "Teks hasil OCR nota/bukti transfer berikut perlu dipetakan menjadi data pengeluaran. " +
    "Pilih kategori paling cocok dari daftar kategori ini: " +
    categoriesText +
    ". " +
    "Kembalikan HANYA JSON valid tanpa markdown dengan format: " +
    '{"categoryName":"...","amount":12345,"description":"...","note":"..."}. ' +
    "amount harus angka saja. description singkat <= 80 karakter. note ringkas <= 220 karakter. " +
    "OCR: " +
    ocrText;

  const requestBody = isResponsesApi
    ? {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.2 } : {}),
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: "Kamu ahli ekstraksi data nota dan klasifikasi pengeluaran." }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      }
    : {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.2 } : {}),
        messages: [
          { role: "system", content: "Kamu ahli ekstraksi data nota dan klasifikasi pengeluaran." },
          { role: "user", content: userPrompt },
        ],
      };

  const response = await fetch(isResponsesApi ? endpoint : `${endpoint.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    const fallbackAmount = fallbackAmountFromText(ocrText);
    return NextResponse.json({
      suggestedCategoryId: "",
      suggestedCategoryName: "",
      suggestedAmount: fallbackAmount,
      suggestedDescription: "Pengeluaran dari nota",
      noteText: `AI gagal, fallback dipakai. Detail: ${text.slice(0, 180)}`,
    });
  }

  const result = await response.json();
  const rawText = isResponsesApi
    ? result?.output_text ||
      result?.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
        ?.map((content: { text?: string }) => content.text || "")
        ?.join("\n")
        ?.trim() ||
      ""
    : result?.choices?.[0]?.message?.content || "";

  const parsed = extractJsonObject(rawText) || {};
  const suggestedAmount = Number(parsed.amount) > 0 ? Number(parsed.amount) : fallbackAmountFromText(ocrText);
  const suggestedCategoryName = parsed.categoryName?.trim() || "";
  const suggestedCategoryId = bestCategoryId(suggestedCategoryName, categories);

  return NextResponse.json({
    suggestedCategoryId,
    suggestedCategoryName,
    suggestedAmount,
    suggestedDescription: (parsed.description || "Pengeluaran dari nota").slice(0, 120),
    noteText: (parsed.note || ocrText.slice(0, 250)).slice(0, 300),
    rawOcr: ocrText,
  });
}
