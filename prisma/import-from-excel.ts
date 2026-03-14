import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

type IncomeRow = {
  date: Date;
  category: string;
  description: string;
  account: string;
  amount: number;
};

type ExpenseRow = {
  date: Date;
  category: string;
  description: string;
  account: string;
  amount: number;
};

type DebtTxRow = {
  date: Date;
  source: string;
  account: string;
  amount: number;
};

type ReceivableTxRow = {
  date: Date;
  person: string;
  account: string;
  amount: number;
  type: "given" | "received";
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toAmount(v: unknown) {
  if (typeof v === "number") return v;
  const s = toText(v);
  if (!s) return 0;
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const code = XLSX.SSF.parse_date_code(v);
    if (code) {
      return new Date(code.y, code.m - 1, code.d);
    }
  }
  const s = toText(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parsePendapatan(rows: unknown[][]): IncomeRow[] {
  const out: IncomeRow[] = [];
  for (const row of rows) {
    const date = toDate(row[1]);
    const category = toText(row[2]);
    const description = toText(row[3]);
    const account = toText(row[4]);
    const amount = toAmount(row[5]);
    if (!date || !category || !account || amount <= 0) continue;
    out.push({ date, category, description, account, amount });
  }
  return out;
}

function parsePengeluaran(rows: unknown[][]): ExpenseRow[] {
  const out: ExpenseRow[] = [];
  for (const row of rows) {
    const date = toDate(row[1]);
    const category = toText(row[2]);
    const description = toText(row[3]);
    const account = toText(row[4]);
    const amount = toAmount(row[5]);
    if (!date || !category || !account || amount <= 0) continue;
    out.push({ date, category, description, account, amount });
  }
  return out;
}

function parseUtang(rows: unknown[][]) {
  const payments: DebtTxRow[] = [];
  const loans: DebtTxRow[] = [];
  const remainingMap = new Map<string, number>();

  for (const row of rows) {
    const sourceName = toText(row[1]);
    const remaining = toAmount(row[2]);
    if (sourceName && remaining > 0 && sourceName !== "Pemberi Utang" && sourceName !== "Total Sisa Utang") {
      remainingMap.set(sourceName, remaining);
    }

    const pDate = toDate(row[4]);
    const pSource = toText(row[5]);
    const pAccount = toText(row[6]);
    const pAmount = toAmount(row[7]);
    if (pDate && pSource && pAccount && pAmount > 0) {
      payments.push({ date: pDate, source: pSource, account: pAccount, amount: pAmount });
    }

    const lDate = toDate(row[9]);
    const lSource = toText(row[10]);
    const lAccount = toText(row[11]);
    const lAmount = toAmount(row[12]);
    if (lDate && lSource && lAccount && lAmount > 0) {
      loans.push({ date: lDate, source: lSource, account: lAccount, amount: lAmount });
    }
  }

  return { payments, loans, remainingMap };
}

function parsePiutang(rows: unknown[][]) {
  const tx: ReceivableTxRow[] = [];
  const remainingMap = new Map<string, number>();

  for (const row of rows) {
    const person = toText(row[1]);
    const remaining = toAmount(row[2]);
    if (person && person !== "Peminjam" && person !== "Total Sisa Piutang") {
      remainingMap.set(person, remaining);
    }

    const gDate = toDate(row[4]);
    const gPerson = toText(row[5]);
    const gAccount = toText(row[6]);
    const gAmount = toAmount(row[7]);
    if (gDate && gPerson && gAccount && gAmount > 0) {
      tx.push({ date: gDate, person: gPerson, account: gAccount, amount: gAmount, type: "given" });
    }

    const rDate = toDate(row[9]);
    const rPerson = toText(row[10]);
    const rAccount = toText(row[11]);
    const rAmount = toAmount(row[12]);
    if (rDate && rPerson && rAccount && rAmount > 0) {
      tx.push({ date: rDate, person: rPerson, account: rAccount, amount: rAmount, type: "received" });
    }
  }

  return { tx, remainingMap };
}

async function main() {
  const excelPath = path.resolve(process.cwd(), "../Wealth Checker and Tracker (1).xlsx");
  const wb = XLSX.readFile(excelPath);

  const shPendapatan = wb.Sheets["Catat - Pendapatan"];
  const shPengeluaran = wb.Sheets["Catat - Pengeluaran"];
  const shUtang = wb.Sheets["Catat - Utang"];
  const shPiutang = wb.Sheets["Catat - Piutang"];

  if (!shPendapatan || !shPengeluaran || !shUtang || !shPiutang) {
    throw new Error("Sheet wajib tidak ditemukan di Excel.");
  }

  const rowsPendapatan = XLSX.utils.sheet_to_json(shPendapatan, { header: 1, defval: null, raw: true }) as unknown[][];
  const rowsPengeluaran = XLSX.utils.sheet_to_json(shPengeluaran, { header: 1, defval: null, raw: true }) as unknown[][];
  const rowsUtang = XLSX.utils.sheet_to_json(shUtang, { header: 1, defval: null, raw: true }) as unknown[][];
  const rowsPiutang = XLSX.utils.sheet_to_json(shPiutang, { header: 1, defval: null, raw: true }) as unknown[][];

  const incomes = parsePendapatan(rowsPendapatan);
  const expenses = parsePengeluaran(rowsPengeluaran);
  const utang = parseUtang(rowsUtang);
  const piutang = parsePiutang(rowsPiutang);

  const accountSet = new Set<string>(["Kas Utama"]);
  for (const i of incomes) accountSet.add(i.account);
  for (const e of expenses) accountSet.add(e.account);
  for (const l of utang.loans) accountSet.add(l.account);
  for (const p of utang.payments) accountSet.add(p.account);
  for (const r of piutang.tx) accountSet.add(r.account);

  const incomeCategorySet = new Set(incomes.map((v) => v.category));
  const expenseCategorySet = new Set(expenses.map((v) => v.category));

  const debtSourceNames = new Set<string>([
    ...Array.from(utang.remainingMap.keys()),
    ...utang.loans.map((v) => v.source),
    ...utang.payments.map((v) => v.source),
  ]);

  const receivablePersonNames = new Set<string>([
    ...Array.from(piutang.remainingMap.keys()),
    ...piutang.tx.map((v) => v.person),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.assetTransaction.deleteMany();
    await tx.itemTransaction.deleteMany();
    await tx.transfer.deleteMany();
    await tx.debtPayment.deleteMany();
    await tx.debtLoan.deleteMany();
    await tx.receivable.deleteMany();
    await tx.income.deleteMany();
    await tx.expense.deleteMany();
    await tx.initialBalance.deleteMany();
    await tx.investmentAsset.deleteMany();
    await tx.item.deleteMany();
    await tx.budget.deleteMany();
    await tx.receivablePerson.deleteMany();
    await tx.debtSource.deleteMany();
    await tx.account.deleteMany();
    await tx.incomeCategory.deleteMany();
    await tx.expenseCategory.deleteMany();
  });

  const accountIds = new Map<string, number>();
  for (const name of accountSet) {
    const acc = await prisma.account.create({ data: { name, type: "cash" } });
    accountIds.set(name, acc.id);
  }

  const incomeCatIds = new Map<string, number>();
  for (const name of incomeCategorySet) {
    const cat = await prisma.incomeCategory.create({ data: { name } });
    incomeCatIds.set(name, cat.id);
  }

  const expenseCatIds = new Map<string, number>();
  for (const name of expenseCategorySet) {
    const cat = await prisma.expenseCategory.create({ data: { name } });
    expenseCatIds.set(name, cat.id);
  }

  for (const row of incomes) {
    await prisma.income.create({
      data: {
        date: row.date,
        categoryId: incomeCatIds.get(row.category)!,
        description: row.description || "-",
        accountId: accountIds.get(row.account) || accountIds.get("Kas Utama")!,
        amount: row.amount,
      },
    });
  }

  for (const row of expenses) {
    await prisma.expense.create({
      data: {
        date: row.date,
        categoryId: expenseCatIds.get(row.category)!,
        description: row.description || "-",
        accountId: accountIds.get(row.account) || accountIds.get("Kas Utama")!,
        amount: row.amount,
      },
    });
  }

  const debtSourceIds = new Map<string, number>();
  for (const name of debtSourceNames) {
    const loanSum = utang.loans.filter((v) => v.source === name).reduce((s, v) => s + v.amount, 0);
    const paymentSum = utang.payments.filter((v) => v.source === name).reduce((s, v) => s + v.amount, 0);
    const remaining = utang.remainingMap.get(name) ?? 0;
    const initialAmount = remaining - loanSum + paymentSum;

    const source = await prisma.debtSource.create({
      data: {
        name,
        initialAmount: Number.isFinite(initialAmount) ? initialAmount : 0,
      },
    });
    debtSourceIds.set(name, source.id);
  }

  for (const row of utang.loans) {
    await prisma.debtLoan.create({
      data: {
        date: row.date,
        debtSourceId: debtSourceIds.get(row.source)!,
        accountId: accountIds.get(row.account) || accountIds.get("Kas Utama")!,
        amount: row.amount,
        description: "Import Excel - Pinjaman",
      },
    });
  }

  for (const row of utang.payments) {
    await prisma.debtPayment.create({
      data: {
        date: row.date,
        debtSourceId: debtSourceIds.get(row.source)!,
        accountId: accountIds.get(row.account) || accountIds.get("Kas Utama")!,
        amount: row.amount,
        description: "Import Excel - Bayar",
      },
    });
  }

  const personIds = new Map<string, number>();
  for (const name of receivablePersonNames) {
    const person = await prisma.receivablePerson.create({ data: { name } });
    personIds.set(name, person.id);
  }

  for (const row of piutang.tx) {
    await prisma.receivable.create({
      data: {
        date: row.date,
        personId: personIds.get(row.person)!,
        accountId: accountIds.get(row.account) || accountIds.get("Kas Utama")!,
        amount: row.amount,
        type: row.type,
      },
    });
  }

  for (const [person, remaining] of piutang.remainingMap.entries()) {
    const given = piutang.tx.filter((v) => v.person === person && v.type === "given").reduce((s, v) => s + v.amount, 0);
    const received = piutang.tx.filter((v) => v.person === person && v.type === "received").reduce((s, v) => s + v.amount, 0);
    const current = given - received;
    const diff = remaining - current;
    if (Math.abs(diff) > 0.5) {
      await prisma.receivable.create({
        data: {
          date: new Date(),
          personId: personIds.get(person)!,
          accountId: accountIds.get("Kas Utama")!,
          amount: Math.abs(diff),
          type: diff > 0 ? "given" : "received",
        },
      });
    }
  }

  const dbIncomeAgg = await prisma.income.aggregate({ _sum: { amount: true }, _count: { _all: true } });
  const dbExpenseAgg = await prisma.expense.aggregate({ _sum: { amount: true }, _count: { _all: true } });
  const dbDebtRemaining = await prisma.debtSource.findMany({ include: { loans: true, payments: true } });
  const dbReceivableRemaining = await prisma.receivablePerson.findMany({ include: { receivables: true } });

  const excelIncomeTotal = incomes.reduce((s, v) => s + v.amount, 0);
  const excelExpenseTotal = expenses.reduce((s, v) => s + v.amount, 0);
  const excelDebtRemaining = Array.from(debtSourceNames).reduce((s, name) => s + (utang.remainingMap.get(name) ?? 0), 0);
  const excelPiutangRemaining = Array.from(piutang.remainingMap.values()).reduce((s, v) => s + v, 0);

  const dbDebtTotal = dbDebtRemaining.reduce((s, d) => {
    const loans = d.loans.reduce((a, b) => a + b.amount, 0);
    const payments = d.payments.reduce((a, b) => a + b.amount, 0);
    return s + d.initialAmount + loans - payments;
  }, 0);

  const dbPiutangTotal = dbReceivableRemaining.reduce((s, p) => {
    const given = p.receivables.filter((r) => r.type === "given").reduce((a, b) => a + b.amount, 0);
    const received = p.receivables.filter((r) => r.type === "received").reduce((a, b) => a + b.amount, 0);
    return s + (given - received);
  }, 0);

  console.log("\n=== IMPORT SUMMARY ===");
  console.log(JSON.stringify({
    excel: {
      incomesCount: incomes.length,
      incomesTotal: excelIncomeTotal,
      expensesCount: expenses.length,
      expensesTotal: excelExpenseTotal,
      debtSourcesCount: debtSourceNames.size,
      debtRemainingTotal: excelDebtRemaining,
      receivablePersonsCount: receivablePersonNames.size,
      receivableRemainingTotal: excelPiutangRemaining,
    },
    db: {
      incomesCount: dbIncomeAgg._count._all,
      incomesTotal: dbIncomeAgg._sum.amount || 0,
      expensesCount: dbExpenseAgg._count._all,
      expensesTotal: dbExpenseAgg._sum.amount || 0,
      debtSourcesCount: dbDebtRemaining.length,
      debtRemainingTotal: dbDebtTotal,
      receivablePersonsCount: dbReceivableRemaining.length,
      receivableRemainingTotal: dbPiutangTotal,
    },
    match: {
      incomesCount: dbIncomeAgg._count._all === incomes.length,
      incomesTotal: Math.abs((dbIncomeAgg._sum.amount || 0) - excelIncomeTotal) < 0.5,
      expensesCount: dbExpenseAgg._count._all === expenses.length,
      expensesTotal: Math.abs((dbExpenseAgg._sum.amount || 0) - excelExpenseTotal) < 0.5,
      debtRemainingTotal: Math.abs(dbDebtTotal - excelDebtRemaining) < 0.5,
      receivableRemainingTotal: Math.abs(dbPiutangTotal - excelPiutangRemaining) < 0.5,
    },
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
