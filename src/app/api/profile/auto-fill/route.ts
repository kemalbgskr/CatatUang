import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/profile/auto-fill
 * Hitung rata-rata pendapatan dan pengeluaran bulanan dari semua data transaksi,
 * lalu simpan ke profil keuangan.
 */
export async function POST() {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ orderBy: { date: "asc" } }),
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
  ]);

  function monthOf(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  // Kelompokkan per bulan
  const incomeByMonth: Record<string, number> = {};
  for (const i of incomes) {
    const m = monthOf(i.date);
    incomeByMonth[m] = (incomeByMonth[m] || 0) + i.amount;
  }

  const expenseByMonth: Record<string, number> = {};
  for (const e of expenses) {
    const m = monthOf(e.date);
    expenseByMonth[m] = (expenseByMonth[m] || 0) + e.amount;
  }

  const incomeMonths = Object.values(incomeByMonth);
  const expenseMonths = Object.values(expenseByMonth);

  if (incomeMonths.length === 0 && expenseMonths.length === 0) {
    return NextResponse.json({ error: "Belum ada data transaksi untuk dikalkulasi." }, { status: 400 });
  }

  const avgIncome = incomeMonths.length > 0
    ? Math.round(incomeMonths.reduce((s, v) => s + v, 0) / incomeMonths.length)
    : 0;

  const avgExpense = expenseMonths.length > 0
    ? Math.round(expenseMonths.reduce((s, v) => s + v, 0) / expenseMonths.length)
    : 0;

  // Upsert profile
  const existing = await prisma.financialProfile.findFirst();
  if (existing) {
    await prisma.financialProfile.update({
      where: { id: existing.id },
      data: { monthlyIncome: avgIncome, monthlyExpense: avgExpense },
    });
  } else {
    await prisma.financialProfile.create({
      data: { monthlyIncome: avgIncome, monthlyExpense: avgExpense, retirementAge: 60, inheritanceAge: 80 },
    });
  }

  return NextResponse.json({
    monthlyIncome: avgIncome,
    monthlyExpense: avgExpense,
    incomeMonthsCount: incomeMonths.length,
    expenseMonthsCount: expenseMonths.length,
  });
}
