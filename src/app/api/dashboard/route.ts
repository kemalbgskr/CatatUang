import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  const [
    incomes,
    expenses,
    debtSources,
    debtPayments,
    debtLoans,
    profile,
    budgets,
    receivablePersons,
  ] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.userId }, include: { category: true }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ where: { userId: user.userId }, include: { category: true }, orderBy: { date: "asc" } }),
    prisma.debtSource.findMany({ where: { userId: user.userId } }),
    prisma.debtPayment.findMany({ where: { debtSource: { userId: user.userId } }, include: { debtSource: true } }),
    prisma.debtLoan.findMany({ where: { debtSource: { userId: user.userId } }, include: { debtSource: true } }),
    prisma.financialProfile.findUnique({ where: { userId: user.userId } }),
    prisma.budget.findMany({ where: { userId: user.userId }, include: { category: true } }),
    prisma.receivablePerson.findMany({ where: { userId: user.userId }, include: { receivables: true } }),
  ]);

  const filterMonth = (date: Date, m: string) => {
    const d = new Date(date);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") === m;
  };

  const currentMonth = month || new Date().toISOString().slice(0, 7);

  // === MONTHLY DATA ===
  const monthlyIncomes = incomes.filter((i) => filterMonth(i.date, currentMonth));
  const monthlyExpenses = expenses.filter((e) => filterMonth(e.date, currentMonth));

  const totalPendapatan = monthlyIncomes.reduce((s, i) => s + i.amount, 0);
  const totalPengeluaran = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const sisaPendapatan = totalPendapatan - totalPengeluaran;
  const totalPendapatanAll = incomes.reduce((s, i) => s + i.amount, 0);
  const totalPengeluaranAll = expenses.reduce((s, e) => s + e.amount, 0);

  // === DAILY DATA (for Top Hero) ===
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncomes = monthlyIncomes.filter(i => i.date.toISOString().split('T')[0] === todayStr);
  const todayExpenses = monthlyExpenses.filter(e => e.date.toISOString().split('T')[0] === todayStr);
  const topPemasukan = todayIncomes.reduce((s, i) => s + i.amount, 0);
  const topPengeluaran = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(daysInMonth - new Date().getDate(), 1);
  const dailyBudget = Math.max(sisaPendapatan, 0) / remainingDays;

  // === UTANG ===
  const debtSummary = debtSources.map((ds) => {
    const totalLoans = debtLoans.filter((l) => l.debtSourceId === ds.id).reduce((s, l) => s + l.amount, 0);
    const totalPayments = debtPayments.filter((p) => p.debtSourceId === ds.id).reduce((s, p) => s + p.amount, 0);
    return { name: ds.name, remaining: ds.initialAmount + totalLoans - totalPayments };
  });
  const totalUtang = debtSummary.reduce((s, d) => s + d.remaining, 0);

  // === PIUTANG ===
  const receivableSummary = receivablePersons.map((p) => {
    const given = p.receivables.filter((r) => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter((r) => r.type === "received").reduce((s, r) => s + r.amount, 0);
    return { name: p.name, remaining: given - received };
  });
  const totalPiutang = receivableSummary.reduce((s, r) => s + r.remaining, 0);

  // === SALDO BERSIH ===
  const saldoBersih = totalPendapatanAll - totalPengeluaranAll;

  // === KEKAYAAN BERSIH ===
  const totalAset = saldoBersih + totalPiutang;
  const kekayaanBersih = totalAset - totalUtang;

  // === LABA RUGI BULANAN (12 bulan) ===
  const labaRugiBulanan: { month: string; pendapatan: number; pengeluaran: number; sisa: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const p = incomes.filter((inc) => filterMonth(inc.date, m)).reduce((s, inc) => s + inc.amount, 0);
    const k = expenses.filter((exp) => filterMonth(exp.date, m)).reduce((s, exp) => s + exp.amount, 0);
    labaRugiBulanan.push({ month: m, pendapatan: p, pengeluaran: k, sisa: p - k });
  }

  // === GROWTH COMPARISON (Last Month) ===
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lmStr = lastMonthDate.getFullYear() + "-" + String(lastMonthDate.getMonth() + 1).padStart(2, "0");
  const lmIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") <= lmStr;
  });
  const lmExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") <= lmStr;
  });
  const lmSaldo = lmIncomes.reduce((s, i) => s + i.amount, 0) - lmExpenses.reduce((s, e) => s + e.amount, 0);
  // Simple approximation: assuming debt/piutang is same or we use total at that point if we had snapshots. 
  // For now, let's just compare Net Wealth (kekayaanBersih) trends.
  const lastMonthNetWealth = lmSaldo + totalPiutang - totalUtang; 
  const netWealthGrowth = lastMonthNetWealth !== 0 ? ((kekayaanBersih - lastMonthNetWealth) / Math.abs(lastMonthNetWealth)) * 100 : 0;

  // === PENGELUARAN PER KATEGORI ===
  const expenseByCategory: Record<string, number> = {};
  for (const exp of monthlyExpenses) {
    expenseByCategory[exp.category.name] = (expenseByCategory[exp.category.name] || 0) + exp.amount;
  }

  // === BUDGET ===
  const budgetComparison = budgets.map((b) => ({
    category: b.category.name,
    rencana: b.monthlyAmount,
    aktual: expenseByCategory[b.category.name] || 0,
  }));

  // === LEVEL KEKAYAAN ===
  let level = 0;
  const uang = saldoBersih + totalPiutang;
  if (totalAset < totalUtang) level = 0;
  else if (uang < totalUtang) level = 1;
  else if (uang >= totalUtang && kekayaanBersih < 0) level = 2;
  else if (uang >= totalUtang && kekayaanBersih >= 0) level = 3;

  const monthlyExp = profile?.monthlyExpense || totalPengeluaran;
  if (level >= 3 && monthlyExp > 0) {
    const emergencyMonths = (uang - totalUtang) / monthlyExp;
    if (emergencyMonths >= 6) level = 4;
    if (profile?.birthDate && profile.retirementAge) {
      const age = (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
      const yearsToRetire = Math.max(profile.retirementAge - age, 0);
      const retirementFund = yearsToRetire * 12 * monthlyExp;
      if (kekayaanBersih > retirementFund) level = 5;
      if (profile.inheritanceAge) {
        const warisan = (profile.inheritanceAge - profile.retirementAge) * 12 * monthlyExp;
        if (kekayaanBersih > retirementFund + warisan) level = 6;
      }
    }
  }

  const levelLabels = [
    "Level 0 - Pailit",
    "Level 1 - Terjerat Utang",
    "Level 2 - Terlihat Kaya",
    "Level 3 - Gaji ke Gaji",
    "Level 4 - Punya Dana Darurat",
    "Level 5 - Dana Pensiun",
    "Level 6 - Punya Warisan",
  ];

  // === RECENT TRANSACTIONS ===
  const recentIncomes = monthlyIncomes.slice(-5).map(i => ({ ...i, type: 'income' }));
  const recentExpenses = monthlyExpenses.slice(-5).map(e => ({ ...e, type: 'expense' }));
  const recentTransactions = [...recentIncomes, ...recentExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // === DAILY EXPENSES (for Calendar) ===
  const dailyExpenses: Record<string, { expense: number, income: number }> = {};
  monthlyIncomes.forEach(i => {
    const d = i.date.toISOString().split('T')[0];
    if (!dailyExpenses[d]) dailyExpenses[d] = { expense: 0, income: 0 };
    dailyExpenses[d].income += i.amount;
  });
  monthlyExpenses.forEach(e => {
    const d = e.date.toISOString().split('T')[0];
    if (!dailyExpenses[d]) dailyExpenses[d] = { expense: 0, income: 0 };
    dailyExpenses[d].expense += e.amount;
  });

  // === CATEGORIZED BUDGET (Simplified for Demo) ===
  // We'll map categories to Kebutuhan, Keinginan, Tabungan if they match keywords
  const kebutuhanKeywords = ['makan', 'listrik', 'air', 'transport', 'sewa', 'kos', 'belanja', 'pangan'];
  const keinginanKeywords = ['hiburan', 'hobi', 'jajan', 'nongkrong', 'shopee', 'tokopedia', 'game'];
  
  const catProgress = {
    kebutuhan: { rencana: 0, aktual: 0 },
    keinginan: { rencana: 0, aktual: 0 },
    tabungan: { rencana: 0, aktual: 0 }
  };

  budgets.forEach(b => {
    const name = b.category.name.toLowerCase();
    const isKebutuhan = kebutuhanKeywords.some(k => name.includes(k));
    const isKeinginan = keinginanKeywords.some(k => name.includes(k));
    
    if (isKebutuhan) {
      catProgress.kebutuhan.rencana += b.monthlyAmount;
      catProgress.kebutuhan.aktual += expenseByCategory[b.category.name] || 0;
    } else if (isKeinginan) {
      catProgress.keinginan.rencana += b.monthlyAmount;
      catProgress.keinginan.aktual += expenseByCategory[b.category.name] || 0;
    } else {
      catProgress.tabungan.rencana += b.monthlyAmount;
      catProgress.tabungan.aktual += expenseByCategory[b.category.name] || 0;
    }
  });

  // If no budget for tabungan, we use sisaPendapatan as "aktual"
  if (catProgress.tabungan.rencana === 0) {
    catProgress.tabungan.rencana = totalPendapatan * 0.2; // 20% rule
    catProgress.tabungan.aktual = Math.max(sisaPendapatan, 0);
  }

  return NextResponse.json({
    totalUtang,
    totalPiutang,
    saldoBersih,
    kekayaanBersih,
    debtSummary,
    receivableSummary,
    currentMonth,
    totalPendapatan,
    totalPengeluaran,
    sisaPendapatan,
    totalPendapatanAll,
    totalPengeluaranAll,
    labaRugiBulanan,
    expenseByCategory,
    budgetComparison,
    level,
    levelLabel: levelLabels[level],
    profile,
    recentTransactions,
    dailyExpenses,
    catProgress,
    topPemasukan: totalPendapatan,
    topPengeluaran: totalPengeluaran,
    dailyBudget,
    netWealthGrowth,
    incomeGrowth: lmIncomes.length > 0 ? ((totalPendapatan - lmIncomes.filter(i => filterMonth(i.date, lmStr)).reduce((s, i) => s + i.amount, 0)) / Math.max(lmIncomes.filter(i => filterMonth(i.date, lmStr)).reduce((s, i) => s + i.amount, 0), 1)) * 100 : 0,
    expenseGrowth: lmExpenses.length > 0 ? ((totalPengeluaran - lmExpenses.filter(e => filterMonth(e.date, lmStr)).reduce((s, e) => s + e.amount, 0)) / Math.max(lmExpenses.filter(e => filterMonth(e.date, lmStr)).reduce((s, e) => s + e.amount, 0), 1)) * 100 : 0,
  });
}
