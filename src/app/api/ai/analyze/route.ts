import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readAISettings } from "@/lib/ai-settings";
import { writeSavedAIAnalysis } from "@/lib/ai-analysis";
import { getAuthenticatedUser } from "@/lib/auth";

function monthOf(date: Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function levelExplanation(level: number) {
  const descriptions = [
    "Level 0 (Pailit): total aset lebih kecil daripada total utang.",
    "Level 1 (Terjerat Utang): aset cair belum cukup menutup utang.",
    "Level 2 (Terlihat Kaya): terlihat punya aset tapi fondasi keuangan belum aman.",
    "Level 3 (Gaji ke Gaji): arus kas berjalan tapi belum punya bantalan kuat.",
    "Level 4 (Dana Darurat): sudah punya cadangan yang lebih aman.",
    "Level 5 (Dana Pensiun): aset bersih cukup untuk target pensiun.",
    "Level 6 (Punya Warisan): aset bersih melampaui kebutuhan pensiun dan warisan.",
  ];
  return descriptions[level] || descriptions[0];
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const selectedMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const settings = await readAISettings(user.userId);
  if (!settings.apiKey || !settings.baseUrl || !settings.model) {
    return NextResponse.json(
      { error: "AI belum dikonfigurasi. Isi API Key, Base URL, dan Model di Pengaturan > AI." },
      { status: 400 },
    );
  }

  const [
    profile,
    incomes,
    expenses,
    budgets,
    debtSources,
    debtLoans,
    debtPayments,
    receivablePersons,
  ] = await Promise.all([
    prisma.financialProfile.findUnique({ where: { userId: user.userId } }),
    prisma.income.findMany({ where: { userId: user.userId }, include: { category: true }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ where: { userId: user.userId }, include: { category: true }, orderBy: { date: "asc" } }),
    prisma.budget.findMany({ where: { userId: user.userId }, include: { category: true } }),
    prisma.debtSource.findMany({ where: { userId: user.userId } }),
    prisma.debtLoan.findMany({ where: { userId: user.userId } }),
    prisma.debtPayment.findMany({ where: { userId: user.userId } }),
    prisma.receivablePerson.findMany({ where: { userId: user.userId }, include: { receivables: true } }),
  ]);

  const incomesMonth = incomes.filter((i) => monthOf(i.date) === selectedMonth);
  const expensesMonth = expenses.filter((e) => monthOf(e.date) === selectedMonth);

  const totalPendapatan = incomesMonth.reduce((s, i) => s + i.amount, 0);
  const totalPengeluaran = expensesMonth.reduce((s, e) => s + e.amount, 0);
  const sisaPendapatan = totalPendapatan - totalPengeluaran;

  const totalPendapatanAll = incomes.reduce((s, i) => s + i.amount, 0);
  const totalPengeluaranAll = expenses.reduce((s, e) => s + e.amount, 0);
  const saldoBersih = totalPendapatanAll - totalPengeluaranAll;

  const debtSummary = debtSources.map((ds) => {
    const totalLoans = debtLoans.filter((l) => l.debtSourceId === ds.id).reduce((s, l) => s + l.amount, 0);
    const totalPayments = debtPayments.filter((p) => p.debtSourceId === ds.id).reduce((s, p) => s + p.amount, 0);
    return { name: ds.name, remaining: ds.initialAmount + totalLoans - totalPayments };
  });
  const totalUtang = debtSummary.reduce((s, d) => s + d.remaining, 0);

  const receivableSummary = receivablePersons.map((p) => {
    const given = p.receivables.filter((r) => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter((r) => r.type === "received").reduce((s, r) => s + r.amount, 0);
    return { name: p.name, remaining: given - received };
  });
  const totalPiutang = receivableSummary.reduce((s, r) => s + r.remaining, 0);

  const expenseByCategory = expensesMonth.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.category.name] = (acc[curr.category.name] || 0) + curr.amount;
    return acc;
  }, {});

  const budgetComparison = budgets.map((b) => ({
    category: b.category.name,
    rencana: b.monthlyAmount,
    aktual: expenseByCategory[b.category.name] || 0,
  }));

  let level = 0;
  const uang = saldoBersih + totalPiutang;
  if (uang < totalUtang) level = 1;
  if (uang >= totalUtang) level = 2;
  if (sisaPendapatan > 0) level = 3;
  const monthlyExp = profile?.monthlyExpense || totalPengeluaran;
  if (monthlyExp > 0 && saldoBersih / monthlyExp >= 6) level = 4;
  if (monthlyExp > 0 && profile?.birthDate && profile.retirementAge) {
    const age = (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    const yearsToRetire = Math.max(profile.retirementAge - age, 0);
    const retirementFund = yearsToRetire * 12 * monthlyExp;
    if (saldoBersih > retirementFund) level = 5;
    if (profile.inheritanceAge && saldoBersih > retirementFund + (profile.inheritanceAge - profile.retirementAge) * 12 * monthlyExp) {
      level = 6;
    }
  }

  const payload = {
    month: selectedMonth,
    metrics: {
      totalPendapatan,
      totalPengeluaran,
      sisaPendapatan,
      totalPendapatanAll,
      totalPengeluaranAll,
      saldoBersih,
      totalUtang,
      totalPiutang,
      level,
      levelDescription: levelExplanation(level),
    },
    budgetComparison,
    debtSummary,
    receivableSummary,
    expenseByCategory,
    profile,
    samples: {
      latestIncomes: incomes.slice(-20).map((i) => ({ date: i.date, amount: i.amount, category: i.category.name, description: i.description })),
      latestExpenses: expenses.slice(-20).map((e) => ({ date: e.date, amount: e.amount, category: e.category.name, description: e.description })),
    },
  };

  const prompt =
    "Berdasarkan data JSON berikut, berikan analisis level kekayaan saat ini, jelaskan masalah utamanya, dan berikan rekomendasi prioritas 30 hari, 90 hari, dan 1 tahun. Gunakan bahasa Indonesia yang jelas. Output dalam format markdown dengan heading: Ringkasan, Risiko Utama, Rekomendasi 30 Hari, Rekomendasi 90 Hari, Rekomendasi 1 Tahun. Data: " +
    JSON.stringify(payload);

  const endpoint = settings.baseUrl.trim();
  const isResponsesApi = endpoint.includes("/openai/responses");
  const modelName = settings.model.toLowerCase();
  const supportsTemperature = !modelName.includes("gpt-5");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (isResponsesApi) {
    headers["api-key"] = settings.apiKey;
  } else {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const requestBody = isResponsesApi
    ? {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.35 } : {}),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: settings.systemPrompt,
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
            ],
          },
        ],
      }
    : {
        model: settings.model,
        ...(supportsTemperature ? { temperature: 0.35 } : {}),
        messages: [
          { role: "system", content: settings.systemPrompt },
          {
            role: "user",
            content: prompt,
          },
        ],
      };

  const response = await fetch(isResponsesApi ? endpoint : `${endpoint.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Gagal memanggil AI API: ${text}` }, { status: 500 });
  }

  const result = await response.json();
  const analysis = isResponsesApi
    ? result?.output_text ||
      result?.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
        ?.map((content: { text?: string }) => content.text || "")
        ?.join("\n")
        ?.trim() ||
      "AI tidak mengembalikan hasil analisis."
    : result?.choices?.[0]?.message?.content || "AI tidak mengembalikan hasil analisis.";

  const levelLabels = [
    "Level 0 - Pailit",
    "Level 1 - Terjerat Utang",
    "Level 2 - Terlihat Kaya",
    "Level 3 - Gaji ke Gaji",
    "Level 4 - Punya Dana Darurat",
    "Level 5 - Dana Pensiun",
    "Level 6 - Punya Warisan",
  ];

  const generatedAt = new Date().toISOString();
  await writeSavedAIAnalysis(user.userId, {
    month: selectedMonth,
    generatedAt,
    level,
    levelLabel: levelLabels[level] || levelLabels[0],
    analysis,
  });

  return NextResponse.json({
    generatedAt,
    level,
    levelExplanation: levelExplanation(level),
    snapshot: payload.metrics,
    analysis,
  });
}
