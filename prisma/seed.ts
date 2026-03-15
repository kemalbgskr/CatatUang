import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // === INCOME CATEGORIES ===
  const incomeCatNames = ["Gaji", "Proyek", "Dividen", "Hadiah", "Piutang", "Bonus", "THR", "Jualan"];
  const incomeCats: Record<string, number> = {};
  for (const name of incomeCatNames) {
    const cat = await prisma.incomeCategory.upsert({ where: { name }, update: {}, create: { name } });
    incomeCats[name] = cat.id;
  }

  // === EXPENSE CATEGORIES ===
  const expenseCatNames = ["Utilitas", "Transportasi", "Konsumsi", "Bunga", "Emoney", "Biaya Tempat Tinggal", "Lifestyle", "Parkir", "Pacaran", "Perawatan Kendaraan", "Rokok/Vape", "Admin"];
  const expenseCats: Record<string, number> = {};
  for (const name of expenseCatNames) {
    const cat = await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
    expenseCats[name] = cat.id;
  }

  // === INCOMES ===
  const incomes = [
    { date: "2026-01-01", category: "Gaji", description: "Gaji Januari", amount: 5750000 },
    { date: "2026-01-15", category: "Gaji", description: "Gaji Januari ke-2", amount: 5750000 },
  ];
  for (const inc of incomes) {
    await prisma.income.create({
      data: { date: new Date(inc.date), categoryId: incomeCats[inc.category], description: inc.description, amount: inc.amount },
    });
  }

  // === EXPENSES ===
  const expenses = [
    { date: "2026-01-02", category: "Konsumsi", description: "Makan siang", amount: 35000 },
    { date: "2026-01-02", category: "Transportasi", description: "Bensin", amount: 50000 },
  ];
  for (const exp of expenses) {
    await prisma.expense.create({
      data: { date: new Date(exp.date), categoryId: expenseCats[exp.category], description: exp.description, amount: exp.amount },
    });
  }

  // === DEBT SOURCES ===
  const debtSources = [
    { name: "Cicilan Motor", initialAmount: 15000000 },
  ];
  const debts: Record<string, number> = {};
  for (const ds of debtSources) {
    const d = await prisma.debtSource.upsert({ where: { name: ds.name }, update: {}, create: ds });
    debts[ds.name] = d.id;
  }

  const debtLoans = [
    { date: "2026-01-05", source: "Cicilan Motor", amount: 500000, description: "Belanja online" },
  ];
  for (const dl of debtLoans) {
    await prisma.debtLoan.create({
      data: { date: new Date(dl.date), debtSourceId: debts[dl.source], amount: dl.amount, description: dl.description },
    });
  }

  const debtPayments = [
    { date: "2026-01-10", source: "Cicilan Motor", amount: 750000, description: "Cicilan Jan" },
  ];
  for (const dp of debtPayments) {
    await prisma.debtPayment.create({
      data: { date: new Date(dp.date), debtSourceId: debts[dp.source], amount: dp.amount, description: dp.description },
    });
  }

  // === RECEIVABLE PERSONS ===
  const receivablePersons = [{ name: "Budi" }];
  const persons: Record<string, number> = {};
  for (const p of receivablePersons) {
    const per = await prisma.receivablePerson.upsert({ where: { name: p.name }, update: {}, create: p });
    persons[p.name] = per.id;
  }

  const receivables = [
    { date: "2026-01-10", person: "Budi", amount: 500000, type: "given" },
  ];
  for (const r of receivables) {
    await prisma.receivable.create({
      data: { date: new Date(r.date), personId: persons[r.person], amount: r.amount, type: r.type },
    });
  }

  // === BUDGETS ===
  const budgetData = [
    { category: "Konsumsi", amount: 1500000 },
  ];
  for (const b of budgetData) {
    const catId = expenseCats[b.category];
    if (catId) {
      await prisma.budget.upsert({
        where: { categoryId: catId },
        update: { monthlyAmount: b.amount },
        create: { categoryId: catId, monthlyAmount: b.amount },
      });
    }
  }

  // === FINANCIAL PROFILE ===
  await prisma.financialProfile.upsert({
    where: { id: 1 },
    update: {
      monthlyIncome: 11500000,
      monthlyExpense: 8000000,
      birthDate: new Date("1995-02-14"),
      retirementAge: 60,
      inheritanceAge: 80,
    },
    create: {
      monthlyIncome: 11500000,
      monthlyExpense: 8000000,
      birthDate: new Date("1995-02-14"),
      retirementAge: 60,
      inheritanceAge: 80,
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
