import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// @ts-ignore
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // === USERS ===
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: { username: "admin", password: hashedPassword, role: "ADMIN" },
  });

  const testUser = await prisma.user.upsert({
    where: { username: "user1" },
    update: { password: hashedPassword, role: "USER" },
    create: { username: "user1", password: hashedPassword, role: "USER" },
  });

  const users = [admin, testUser];

  for (const user of users) {
    console.log(`  Linking data for user: ${user.username}`);

    // === INCOME CATEGORIES ===
    const incomeCatNames = ["Gaji", "Proyek", "Dividen", "Hadiah", "Piutang", "Bonus", "THR", "Jualan"];
    const incomeCats: Record<string, number> = {};
    for (const name of incomeCatNames) {
      const cat = await prisma.incomeCategory.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name },
      });
      incomeCats[name] = cat.id;
    }

    // === EXPENSE CATEGORIES ===
    const expenseCatNames = ["Utilitas", "Transportasi", "Konsumsi", "Bunga", "Emoney", "Biaya Tempat Tinggal", "Lifestyle", "Parkir", "Pacaran", "Perawatan Kendaraan", "Rokok/Vape", "Admin"];
    const expenseCats: Record<string, number> = {};
    for (const name of expenseCatNames) {
      const cat = await prisma.expenseCategory.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name },
      });
      expenseCats[name] = cat.id;
    }

    // === INCOMES ===
    const incomes = [
      { date: "2026-03-01", category: "Gaji", description: "Gaji Maret", amount: 5000000 },
    ];
    for (const inc of incomes) {
      await prisma.income.create({
        data: { userId: user.id, date: new Date(inc.date), categoryId: incomeCats[inc.category], description: inc.description, amount: inc.amount },
      });
    }

    // === EXPENSES ===
    const expenses = [
      { date: "2026-03-02", category: "Konsumsi", description: "Makan siang", amount: 50000 },
    ];
    for (const exp of expenses) {
      await prisma.expense.create({
        data: { userId: user.id, date: new Date(exp.date), categoryId: expenseCats[exp.category], description: exp.description, amount: exp.amount },
      });
    }

    // === DEBT SOURCES ===
    const debtSources = [
      { name: "Kartu Kredit", initialAmount: 0 },
    ];
    const debts: Record<string, number> = {};
    for (const ds of debtSources) {
      const d = await prisma.debtSource.upsert({
        where: { userId_name: { userId: user.id, name: ds.name } },
        update: {},
        create: { userId: user.id, name: ds.name, initialAmount: ds.initialAmount },
      });
      debts[ds.name] = d.id;
    }

    // === RECEIVABLE PERSONS ===
    const receivablePersons = [{ name: "Andi" }];
    const persons: Record<string, number> = {};
    for (const p of receivablePersons) {
      const per = await prisma.receivablePerson.upsert({
        where: { userId_name: { userId: user.id, name: p.name } },
        update: {},
        create: { userId: user.id, name: p.name },
      });
      persons[p.name] = per.id;
    }

    // === FINANCIAL PROFILE ===
    await prisma.financialProfile.upsert({
      where: { userId: user.id },
      update: {
        monthlyIncome: 10000000,
        monthlyExpense: 7000000,
        birthDate: new Date("1995-01-01"),
      },
      create: {
        userId: user.id,
        monthlyIncome: 10000000,
        monthlyExpense: 7000000,
        birthDate: new Date("1995-01-01"),
      },
    });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
