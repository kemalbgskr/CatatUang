import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readAISettings } from "@/lib/ai-settings";
import { getAuthenticatedUser } from "@/lib/auth";

function monthOf(date: Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * POST /api/ai/budget
 */
export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await readAISettings(user.userId);
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
      where: { userId: user.userId, date: { gte: threeMonthsAgo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.income.findMany({
      where: { userId: user.userId, date: { gte: threeMonthsAgo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.expenseCategory.findMany({ where: { userId: user.userId } }),
    prisma.financialProfile.findUnique({ where: { userId: user.userId } }),
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
Berdasarkan data pengeluaran 3 bulan terakhir pengguna, buatkan rekomendasi budget bulanan realistis per kategori menggunakan teori keuangan yang sesuai.
Data pengguna:
${JSON.stringify(payload, null, 2)}
Balas HANYA dalam JSON:
{
  "theory": "nama teori",
  "reason": "alasan",
  "budgets": [ { "category": "nama kategori", "amount": angka_integer, "note": "catatan" } ]
}`;

  const endpoint = settings.baseUrl.trim();
  const isResponsesApi = endpoint.includes("/openai/responses");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isResponsesApi) headers["api-key"] = settings.apiKey;
  else headers.Authorization = `Bearer ${settings.apiKey}`;

  const requestBody = isResponsesApi
    ? {
        model: settings.model,
        input: [
            { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: userPrompt }] },
        ],
      }
    : {
        model: settings.model,
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

  if (!aiRes.ok) return NextResponse.json({ error: "Gagal memanggil AI" }, { status: 500 });
  const aiResult = await aiRes.json();
  const rawText = isResponsesApi ? (aiResult?.output_text || "") : (aiResult?.choices?.[0]?.message?.content || "");

  let parsed: { theory: string; reason: string; budgets: { category: string; amount: number; note: string }[] };
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return NextResponse.json({ error: "AI tidak merespons JSON valid" }, { status: 500 });
  }

  const savedBudgets: { category: string; amount: number; note: string }[] = [];
  for (const b of parsed.budgets) {
    const cat = await prisma.expenseCategory.findUnique({
      where: { userId_name: { userId: user.userId, name: b.category } }
    });
    if (!cat || !b.amount || b.amount <= 0) continue;

    await prisma.budget.upsert({
      where: { categoryId: cat.id },
      create: { userId: user.userId, categoryId: cat.id, monthlyAmount: Math.round(b.amount) },
      update: { monthlyAmount: Math.round(b.amount) }
    });
    savedBudgets.push({ category: b.category, amount: Math.round(b.amount), note: b.note || "" });
  }

  return NextResponse.json({
    theory: parsed.theory,
    reason: parsed.reason,
    savedCount: savedBudgets.length,
    budgets: savedBudgets,
  });
}
