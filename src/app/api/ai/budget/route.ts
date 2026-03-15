import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readAISettings } from "@/lib/ai-settings";

function monthOf(date: Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * POST /api/ai/budget
 * Menganalisis data pengeluaran 3 bulan terakhir + profil keuangan,
 * lalu meminta AI menyarankan budget per kategori sesuai teori umum (50/30/20, dll).
 * AI wajib merespons dalam JSON.
 * Setelah dapat respons, langsung simpan ke tabel Budget.
 */
export async function POST() {
  const settings = await readAISettings();
  if (!settings.apiKey || !settings.baseUrl || !settings.model) {
    return NextResponse.json(
      { error: "AI belum dikonfigurasi. Isi API Key, Base URL, dan Model di Pengaturan > AI." },
      { status: 400 }
    );
  }

  // Ambil data 3 bulan terakhir
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [expenses, incomes, expenseCats, profile] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: threeMonthsAgo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.income.findMany({
      where: { date: { gte: threeMonthsAgo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.expenseCategory.findMany(),
    prisma.financialProfile.findFirst(),
  ]);

  // Hitung rata-rata pengeluaran per kategori per bulan
  const months = new Set(expenses.map((e) => monthOf(e.date)));
  const numMonths = Math.max(months.size, 1);

  const expenseByCategory: Record<string, number> = {};
  const expenseCountByMonth: Record<string, Set<string>> = {};

  for (const e of expenses) {
    const cat = e.category.name;
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
    if (!expenseCountByMonth[cat]) expenseCountByMonth[cat] = new Set();
    expenseCountByMonth[cat].add(monthOf(e.date));
  }

  const avgExpensePerCat = Object.entries(expenseByCategory).map(([cat, total]) => ({
    category: cat,
    monthlyAvg: Math.round(total / numMonths),
    totalPeriod: total,
    activeMonths: expenseCountByMonth[cat]?.size || 1,
  }));

  // Rata-rata pendapatan per bulan
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const avgMonthlyIncome = Math.round(totalIncome / numMonths);

  const payload = {
    periodMonths: numMonths,
    avgMonthlyIncome,
    profileMonthlyIncome: profile?.monthlyIncome || 0,
    expenseCategories: expenseCats.map((c) => c.name),
    avgExpensePerCategory: avgExpensePerCat,
    totalAvgExpense: avgExpensePerCat.reduce((s, c) => s + c.monthlyAvg, 0),
  };

  const systemPrompt = settings.systemPrompt;

  const userPrompt = `Kamu adalah perencana keuangan profesional Indonesia.

Berdasarkan data pengeluaran 3 bulan terakhir pengguna, buatkan rekomendasi budget bulanan realistis per kategori menggunakan teori keuangan yang sesuai (50/30/20, envelope budgeting, atau zero-based budgeting — pilih yang paling cocok dengan kondisi pengguna).

Data pengguna:
${JSON.stringify(payload, null, 2)}

PENTING:
- Budget harus realistis berdasarkan rata-rata pengeluaran aktual
- Jika suatu kategori tampak terlalu tinggi, berikan sedikit pengurangan (maks 20%) untuk mendorong efisiensi
- Jika pendapatan mencukupi, alokasikan juga untuk tabungan/investasi dalam kategori yang ada
- Gunakan istilah Indonesia untuk teori yang dipakai
- Sebutkan teori yang kamu pakai dan alasannya

Balas HANYA dalam JSON array berikut (tanpa komentar tambahan):
{
  "theory": "nama teori yang dipakai",
  "reason": "alasan singkat pemilihan teori ini (1-2 kalimat)",
  "budgets": [
    { "category": "nama kategori persis", "amount": angka_integer, "note": "catatan singkat" }
  ]
}

Hanya sertakan kategori yang ada di expenseCategories. Jumlah dalam Rupiah (integer, tanpa desimal).`;

  const endpoint = settings.baseUrl.trim();
  const isResponsesApi = endpoint.includes("/openai/responses");
  const modelName = settings.model.toLowerCase();
  const supportsTemperature = !modelName.includes("gpt-5");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isResponsesApi) headers["api-key"] = settings.apiKey;
  else headers.Authorization = `Bearer ${settings.apiKey}`;

  const requestBody = isResponsesApi
    ? {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.2 } : {}),
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: userPrompt }] },
        ],
      }
    : {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.2 } : {}),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      };

  const aiRes = await fetch(
    isResponsesApi ? endpoint : `${endpoint.replace(/\/$/, "")}/chat/completions`,
    { method: "POST", headers, body: JSON.stringify(requestBody) }
  );

  if (!aiRes.ok) {
    const text = await aiRes.text();
    return NextResponse.json({ error: `Gagal memanggil AI: ${text}` }, { status: 500 });
  }

  const aiResult = await aiRes.json();
  const rawText = isResponsesApi
    ? aiResult?.output_text ||
      aiResult?.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
        ?.map((c: { text?: string }) => c.text || "")
        ?.join("\n")
    : aiResult?.choices?.[0]?.message?.content || "";

  // Parse JSON dari respons AI
  let parsed: { theory: string; reason: string; budgets: { category: string; amount: number; note: string }[] };
  try {
    // Coba parse langsung, atau cari blok JSON dalam teks
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return NextResponse.json(
      { error: "AI tidak merespons dalam format JSON yang valid. Coba lagi.", raw: rawText },
      { status: 500 }
    );
  }

  if (!Array.isArray(parsed.budgets)) {
    return NextResponse.json(
      { error: "Format respons AI tidak valid (tidak ada array budgets).", raw: rawText },
      { status: 500 }
    );
  }

  // Simpan budget ke database: upsert per kategori
  const savedBudgets: { category: string; amount: number; note: string }[] = [];
  for (const b of parsed.budgets) {
    const cat = await prisma.expenseCategory.findFirst({ where: { name: b.category } });
    if (!cat || !b.amount || b.amount <= 0) continue;

    // Hapus budget lama untuk kategori ini jika ada, lalu buat baru
    await prisma.budget.deleteMany({ where: { categoryId: cat.id } });
    await prisma.budget.create({ data: { categoryId: cat.id, monthlyAmount: Math.round(b.amount) } });
    savedBudgets.push({ category: b.category, amount: Math.round(b.amount), note: b.note || "" });
  }

  return NextResponse.json({
    theory: parsed.theory,
    reason: parsed.reason,
    savedCount: savedBudgets.length,
    budgets: savedBudgets,
  });
}
