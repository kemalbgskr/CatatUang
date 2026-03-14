import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  // Get all data
  const [
    accounts,
    incomes,
    expenses,
    transfers,
    debtSources,
    debtPayments,
    debtLoans,
    investmentAssets,
    assetTransactions,
    items,
    itemTransactions,
    profile,
    budgets,
    receivablePersons,
  ] = await Promise.all([
    prisma.account.findMany({ include: { initialBalance: true } }),
    prisma.income.findMany({ include: { category: true, account: true }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ include: { category: true, account: true }, orderBy: { date: "asc" } }),
    prisma.transfer.findMany({ include: { fromAccount: true, toAccount: true }, orderBy: { date: "asc" } }),
    prisma.debtSource.findMany(),
    prisma.debtPayment.findMany({ include: { debtSource: true, account: true } }),
    prisma.debtLoan.findMany({ include: { debtSource: true, account: true } }),
    prisma.investmentAsset.findMany(),
    prisma.assetTransaction.findMany({ include: { asset: true, account: true } }),
    prisma.item.findMany(),
    prisma.itemTransaction.findMany({ include: { item: true, account: true } }),
    prisma.financialProfile.findFirst(),
    prisma.budget.findMany({ include: { category: true } }),
    prisma.receivablePerson.findMany({ include: { receivables: true } }),
  ]);

  // === SALDO REKENING ===
  const accountBalances: Record<string, number> = {};
  for (const acc of accounts) {
    accountBalances[acc.name] = acc.initialBalance?.balance || 0;
  }
  for (const inc of incomes) {
    accountBalances[inc.account.name] = (accountBalances[inc.account.name] || 0) + inc.amount;
  }
  for (const exp of expenses) {
    accountBalances[exp.account.name] = (accountBalances[exp.account.name] || 0) - exp.amount;
  }
  for (const tr of transfers) {
    accountBalances[tr.fromAccount.name] = (accountBalances[tr.fromAccount.name] || 0) - tr.amount - tr.adminFee;
    accountBalances[tr.toAccount.name] = (accountBalances[tr.toAccount.name] || 0) + tr.amount;
  }
  for (const dp of debtPayments) {
    accountBalances[dp.account.name] = (accountBalances[dp.account.name] || 0) - dp.amount;
  }
  for (const dl of debtLoans) {
    accountBalances[dl.account.name] = (accountBalances[dl.account.name] || 0) + dl.amount;
  }
  for (const at of assetTransactions) {
    if (at.type === "buy") {
      accountBalances[at.account.name] = (accountBalances[at.account.name] || 0) - at.price * at.quantity;
    } else {
      accountBalances[at.account.name] = (accountBalances[at.account.name] || 0) + at.price * at.quantity;
    }
  }
  for (const it of itemTransactions) {
    if (it.type === "buy") {
      accountBalances[it.account.name] = (accountBalances[it.account.name] || 0) - it.price * it.quantity;
    } else {
      accountBalances[it.account.name] = (accountBalances[it.account.name] || 0) + it.price * it.quantity;
    }
  }
  // Receivable given = money going out, received = money coming in
  for (const p of receivablePersons) {
    for (const r of p.receivables) {
      const acc = accounts.find(a => a.id === r.accountId);
      if (acc) {
        if (r.type === "given") {
          accountBalances[acc.name] = (accountBalances[acc.name] || 0) - r.amount;
        } else {
          accountBalances[acc.name] = (accountBalances[acc.name] || 0) + r.amount;
        }
      }
    }
  }

  const totalKas = Object.values(accountBalances).reduce((s, v) => s + v, 0);

  // === TOTAL UTANG ===
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

  // === ASET INVESTASI ===
  const investmentSummary = investmentAssets.map((a) => {
    const buys = assetTransactions.filter((t) => t.assetId === a.id && t.type === "buy");
    const sells = assetTransactions.filter((t) => t.assetId === a.id && t.type === "sell");
    const totalQty = a.initialQty + buys.reduce((s, b) => s + b.quantity, 0) - sells.reduce((s, s2) => s + s2.quantity, 0);
    const totalValue = a.initialValue + buys.reduce((s, b) => s + b.price * b.quantity, 0) - sells.reduce((s, s2) => s + s2.price * s2.quantity, 0);
    return { name: a.name, qty: totalQty, value: totalValue };
  });
  const totalAsetInvestasi = investmentSummary.reduce((s, a) => s + a.value, 0);

  // === BARANG ===
  const itemSummary = items.map((i) => {
    const buys = itemTransactions.filter((t) => t.itemId === i.id && t.type === "buy");
    const sells = itemTransactions.filter((t) => t.itemId === i.id && t.type === "sell");
    const totalQty = i.initialQty + buys.reduce((s, b) => s + b.quantity, 0) - sells.reduce((s, s2) => s + s2.quantity, 0);
    const totalValue = i.initialValue + buys.reduce((s, b) => s + b.price * b.quantity, 0) - sells.reduce((s, s2) => s + s2.price * s2.quantity, 0);
    return { name: i.name, qty: totalQty, value: totalValue };
  });
  const totalBarang = itemSummary.reduce((s, i) => s + i.value, 0);

  // === KEKAYAAN BERSIH ===
  const totalAset = totalKas + totalAsetInvestasi + totalPiutang + totalBarang;
  const kekayaanBersih = totalAset - totalUtang;

  // === MONTHLY FILTER (for Laba Rugi) ===
  const filterMonth = (date: Date, m: string) => {
    const d = new Date(date);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") === m;
  };

  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const monthlyIncomes = incomes.filter((i) => filterMonth(i.date, currentMonth));
  const monthlyExpenses = expenses.filter((e) => filterMonth(e.date, currentMonth));
  const monthlyAssetBuys = assetTransactions.filter((t) => t.type === "buy" && filterMonth(t.date, currentMonth));
  const monthlyItemBuys = itemTransactions.filter((t) => t.type === "buy" && filterMonth(t.date, currentMonth));

  const totalPendapatan = monthlyIncomes.reduce((s, i) => s + i.amount, 0);
  const totalKebutuhanPokok = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPengeluaran = totalKebutuhanPokok;
  const totalPendapatanAll = incomes.reduce((s, i) => s + i.amount, 0);
  const totalPengeluaranAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBeliAset = monthlyAssetBuys.reduce((s, t) => s + t.price * t.quantity, 0);
  const totalBeliBarang = monthlyItemBuys.reduce((s, t) => s + t.price * t.quantity, 0);
  const sisaPendapatan = totalPendapatan - totalKebutuhanPokok - totalBeliAset - totalBeliBarang;

  // === LABA RUGI BULANAN (12 bulan) ===
  const labaRugiBulanan: { month: string; pendapatan: number; pengeluaran: number; kebutuhanPokok: number; beliAset: number; beliBarang: number; sisa: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const mIncomes = incomes.filter((inc) => filterMonth(inc.date, m));
    const mExpenses = expenses.filter((exp) => filterMonth(exp.date, m));
    const mAssets = assetTransactions.filter((t) => t.type === "buy" && filterMonth(t.date, m));
    const mItems = itemTransactions.filter((t) => t.type === "buy" && filterMonth(t.date, m));
    const p = mIncomes.reduce((s, inc) => s + inc.amount, 0);
    const k = mExpenses.reduce((s, exp) => s + exp.amount, 0);
    const a = mAssets.reduce((s, t) => s + t.price * t.quantity, 0);
    const b = mItems.reduce((s, t) => s + t.price * t.quantity, 0);
    labaRugiBulanan.push({ month: m, pendapatan: p, pengeluaran: k, kebutuhanPokok: k, beliAset: a, beliBarang: b, sisa: p - k - a - b });
  }

  // === PENGELUARAN PER KATEGORI (current month) ===
  const expenseByCategory: Record<string, number> = {};
  for (const exp of monthlyExpenses) {
    expenseByCategory[exp.category.name] = (expenseByCategory[exp.category.name] || 0) + exp.amount;
  }

  // === BUDGETING ===
  const budgetComparison = budgets.map((b) => ({
    category: b.category.name,
    rencana: b.monthlyAmount,
    aktual: expenseByCategory[b.category.name] || 0,
  }));

  // === FINANCIAL LEVEL (Level Kekayaan) ===
  let level = 0;
  const uang = totalKas + totalAsetInvestasi + totalPiutang;
  if (totalAset < totalUtang) level = 0;
  else if (uang < totalUtang) level = 1;
  else if (uang >= totalUtang && kekayaanBersih < 0) level = 2;
  else if (uang >= totalUtang && kekayaanBersih >= 0) level = 3;
  // If has emergency fund
  const monthlyExp = profile?.monthlyExpense || 0;
  if (level >= 3 && monthlyExp > 0) {
    const emergencyMonths = (uang - totalUtang) / monthlyExp;
    if (emergencyMonths >= 6) level = 4;
    // If has retirement fund
    if (profile?.birthDate && profile.retirementAge) {
      const age = (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
      const yearsToRetire = profile.retirementAge - age;
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

  return NextResponse.json({
    accountBalances,
    totalKas,
    totalUtang,
    totalPiutang,
    totalAsetInvestasi,
    totalBarang,
    totalAset,
    kekayaanBersih,
    debtSummary,
    receivableSummary,
    investmentSummary,
    itemSummary,
    currentMonth,
    totalPendapatan,
    totalPengeluaran,
    totalKebutuhanPokok,
    totalPendapatanAll,
    totalPengeluaranAll,
    totalBeliAset,
    totalBeliBarang,
    sisaPendapatan,
    labaRugiBulanan,
    expenseByCategory,
    budgetComparison,
    level,
    levelLabel: levelLabels[level],
    profile,
  });
}
