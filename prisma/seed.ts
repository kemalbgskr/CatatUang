import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("🌱 Seeding database...");

  // === ACCOUNTS ===
  const accountNames = ["Jago", "BNI Gaji", "Jago Online", "BCA", "Jago Pendidikan", "BRI", "Jago Dana Darurat", "Jago Housing"];
  const accounts: Record<string, number> = {};
  for (const name of accountNames) {
    const acc = await prisma.account.upsert({ where: { name }, update: {}, create: { name } });
    accounts[name] = acc.id;
  }

  // === INITIAL BALANCES ===
  const initialBalances: Record<string, number> = {
    "Jago": 1000000, "BNI Gaji": 500000, "Jago Online": 200000, "BCA": 300000,
    "Jago Pendidikan": 0, "BRI": 100000, "Jago Dana Darurat": 0, "Jago Housing": 0,
  };
  for (const [name, balance] of Object.entries(initialBalances)) {
    await prisma.initialBalance.upsert({
      where: { accountId: accounts[name] },
      update: { balance },
      create: { accountId: accounts[name], balance, date: new Date("2026-01-01") },
    });
  }

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
    { date: "2026-01-01", category: "Gaji", description: "Gaji Januari", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-01-15", category: "Gaji", description: "Gaji Januari ke-2", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-01-20", category: "Proyek", description: "Proyek Freelance", account: "BCA", amount: 2000000 },
    { date: "2026-02-01", category: "Gaji", description: "Gaji Februari", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-02-15", category: "Gaji", description: "Gaji Februari ke-2", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-02-20", category: "Dividen", description: "Dividen Saham", account: "BCA", amount: 150000 },
    { date: "2026-03-01", category: "Gaji", description: "Gaji Maret", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-03-15", category: "Gaji", description: "Gaji Maret ke-2", account: "BNI Gaji", amount: 5750000 },
    { date: "2026-03-10", category: "Bonus", description: "Bonus Q1", account: "BNI Gaji", amount: 3000000 },
    { date: "2026-03-25", category: "Jualan", description: "Jualan Barang Bekas", account: "BCA", amount: 500000 },
  ];
  for (const inc of incomes) {
    await prisma.income.create({
      data: { date: new Date(inc.date), categoryId: incomeCats[inc.category], description: inc.description, accountId: accounts[inc.account], amount: inc.amount },
    });
  }

  // === EXPENSES ===
  const expenses = [
    // January
    { date: "2026-01-02", category: "Konsumsi", description: "Makan siang", account: "Jago", amount: 35000 },
    { date: "2026-01-02", category: "Transportasi", description: "Bensin", account: "Jago", amount: 50000 },
    { date: "2026-01-03", category: "Konsumsi", description: "Makan malam", account: "Jago", amount: 45000 },
    { date: "2026-01-04", category: "Rokok/Vape", description: "Vape liquid", account: "Jago", amount: 75000 },
    { date: "2026-01-05", category: "Utilitas", description: "Listrik", account: "BCA", amount: 350000 },
    { date: "2026-01-05", category: "Utilitas", description: "Internet", account: "BCA", amount: 300000 },
    { date: "2026-01-06", category: "Biaya Tempat Tinggal", description: "Kos Januari", account: "BCA", amount: 1500000 },
    { date: "2026-01-07", category: "Emoney", description: "Top up GoPay", account: "Jago Online", amount: 200000 },
    { date: "2026-01-08", category: "Parkir", description: "Parkir kantor", account: "Jago", amount: 10000 },
    { date: "2026-01-09", category: "Konsumsi", description: "Kopi", account: "Jago", amount: 25000 },
    { date: "2026-01-10", category: "Lifestyle", description: "Langganan Spotify", account: "BCA", amount: 55000 },
    { date: "2026-01-12", category: "Pacaran", description: "Makan bareng", account: "Jago", amount: 150000 },
    { date: "2026-01-15", category: "Transportasi", description: "Bensin", account: "Jago", amount: 50000 },
    { date: "2026-01-18", category: "Konsumsi", description: "Groceries", account: "BCA", amount: 250000 },
    { date: "2026-01-20", category: "Perawatan Kendaraan", description: "Ganti oli", account: "BCA", amount: 100000 },
    { date: "2026-01-22", category: "Admin", description: "Biaya admin bank", account: "BRI", amount: 15000 },
    { date: "2026-01-25", category: "Konsumsi", description: "Makan siang kantor", account: "Jago", amount: 180000 },
    { date: "2026-01-28", category: "Transportasi", description: "Grab", account: "Jago Online", amount: 45000 },
    // February
    { date: "2026-02-01", category: "Konsumsi", description: "Makan", account: "Jago", amount: 40000 },
    { date: "2026-02-02", category: "Transportasi", description: "Bensin", account: "Jago", amount: 55000 },
    { date: "2026-02-03", category: "Rokok/Vape", description: "Vape liquid", account: "Jago", amount: 75000 },
    { date: "2026-02-05", category: "Utilitas", description: "Listrik", account: "BCA", amount: 320000 },
    { date: "2026-02-05", category: "Utilitas", description: "Internet", account: "BCA", amount: 300000 },
    { date: "2026-02-06", category: "Biaya Tempat Tinggal", description: "Kos Februari", account: "BCA", amount: 1500000 },
    { date: "2026-02-08", category: "Emoney", description: "Top up OVO", account: "Jago Online", amount: 150000 },
    { date: "2026-02-10", category: "Lifestyle", description: "Langganan Spotify", account: "BCA", amount: 55000 },
    { date: "2026-02-12", category: "Pacaran", description: "Valentine", account: "Jago", amount: 300000 },
    { date: "2026-02-14", category: "Konsumsi", description: "Dinner Valentine", account: "Jago", amount: 250000 },
    { date: "2026-02-16", category: "Parkir", description: "Parkir mall", account: "Jago", amount: 15000 },
    { date: "2026-02-18", category: "Konsumsi", description: "Groceries", account: "BCA", amount: 280000 },
    { date: "2026-02-20", category: "Transportasi", description: "Bensin", account: "Jago", amount: 50000 },
    { date: "2026-02-22", category: "Konsumsi", description: "Makan siang", account: "Jago", amount: 200000 },
    { date: "2026-02-25", category: "Admin", description: "Biaya admin", account: "BRI", amount: 15000 },
    { date: "2026-02-28", category: "Transportasi", description: "Gojek", account: "Jago Online", amount: 35000 },
    // March
    { date: "2026-03-01", category: "Konsumsi", description: "Makan", account: "Jago", amount: 35000 },
    { date: "2026-03-02", category: "Transportasi", description: "Bensin", account: "Jago", amount: 60000 },
    { date: "2026-03-03", category: "Rokok/Vape", description: "Vape pod", account: "Jago", amount: 80000 },
    { date: "2026-03-05", category: "Utilitas", description: "Listrik", account: "BCA", amount: 340000 },
    { date: "2026-03-05", category: "Utilitas", description: "Internet", account: "BCA", amount: 300000 },
    { date: "2026-03-06", category: "Biaya Tempat Tinggal", description: "Kos Maret", account: "BCA", amount: 1500000 },
    { date: "2026-03-08", category: "Emoney", description: "Top up Dana", account: "Jago Online", amount: 100000 },
    { date: "2026-03-10", category: "Lifestyle", description: "Langganan Spotify", account: "BCA", amount: 55000 },
    { date: "2026-03-12", category: "Pacaran", description: "Jalan-jalan", account: "Jago", amount: 200000 },
    { date: "2026-03-15", category: "Konsumsi", description: "Groceries", account: "BCA", amount: 300000 },
    { date: "2026-03-18", category: "Transportasi", description: "Bensin", account: "Jago", amount: 55000 },
    { date: "2026-03-20", category: "Perawatan Kendaraan", description: "Service motor", account: "BCA", amount: 250000 },
    { date: "2026-03-22", category: "Konsumsi", description: "Makan siang", account: "Jago", amount: 190000 },
    { date: "2026-03-25", category: "Parkir", description: "Parkir", account: "Jago", amount: 10000 },
    { date: "2026-03-28", category: "Admin", description: "Biaya admin", account: "BRI", amount: 15000 },
  ];
  for (const exp of expenses) {
    await prisma.expense.create({
      data: { date: new Date(exp.date), categoryId: expenseCats[exp.category], description: exp.description, accountId: accounts[exp.account], amount: exp.amount },
    });
  }

  // === TRANSFERS ===
  const transfers = [
    // January
    { date: "2026-01-01", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-01-01", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-01-01", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-01-01", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-01-01", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-01-01", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-01-15", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    // February
    { date: "2026-02-01", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-02-01", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-02-01", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-02-01", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-02-01", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-02-01", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-02-15", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    // March
    { date: "2026-03-01", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-03-01", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-03-01", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-03-01", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-03-01", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-03-01", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "Jago", amount: 2000000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "BCA", amount: 1500000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "Jago Dana Darurat", amount: 500000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "Jago Pendidikan", amount: 300000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "Jago Housing", amount: 500000, adminFee: 0 },
    { date: "2026-03-15", from: "BNI Gaji", to: "Jago Online", amount: 300000, adminFee: 0 },
    // Extra transfers
    { date: "2026-01-20", from: "BCA", to: "BRI", amount: 200000, adminFee: 2500 },
    { date: "2026-02-08", from: "Jago", to: "Jago Online", amount: 100000, adminFee: 0 },
  ];
  for (const tr of transfers) {
    await prisma.transfer.create({
      data: { date: new Date(tr.date), fromAccountId: accounts[tr.from], toAccountId: accounts[tr.to], amount: tr.amount, adminFee: tr.adminFee },
    });
  }

  // === DEBT SOURCES ===
  const debtSources = [
    { name: "Cicilan Motor", initialAmount: 15000000 },
    { name: "BRI CC", initialAmount: 0 },
    { name: "Orang Tua", initialAmount: 5000000 },
    { name: "Shopee Paylater", initialAmount: 0 },
  ];
  const debts: Record<string, number> = {};
  for (const ds of debtSources) {
    const d = await prisma.debtSource.upsert({ where: { name: ds.name }, update: {}, create: ds });
    debts[ds.name] = d.id;
  }

  // Debt loans
  const debtLoans = [
    { date: "2026-01-05", source: "BRI CC", account: "BRI", amount: 500000, description: "Belanja online" },
    { date: "2026-02-10", source: "BRI CC", account: "BRI", amount: 300000, description: "Belanja" },
    { date: "2026-01-10", source: "Shopee Paylater", account: "Jago Online", amount: 200000, description: "Belanja Shopee" },
    { date: "2026-02-15", source: "Shopee Paylater", account: "Jago Online", amount: 150000, description: "Belanja Shopee" },
  ];
  for (const dl of debtLoans) {
    await prisma.debtLoan.create({
      data: { date: new Date(dl.date), debtSourceId: debts[dl.source], accountId: accounts[dl.account], amount: dl.amount, description: dl.description },
    });
  }

  // Debt payments
  const debtPayments = [
    { date: "2026-01-10", source: "Cicilan Motor", account: "BNI Gaji", amount: 750000, description: "Cicilan Jan" },
    { date: "2026-02-10", source: "Cicilan Motor", account: "BNI Gaji", amount: 750000, description: "Cicilan Feb" },
    { date: "2026-03-10", source: "Cicilan Motor", account: "BNI Gaji", amount: 750000, description: "Cicilan Mar" },
    { date: "2026-01-25", source: "BRI CC", account: "BRI", amount: 500000, description: "Bayar CC Jan" },
    { date: "2026-02-25", source: "BRI CC", account: "BRI", amount: 300000, description: "Bayar CC Feb" },
    { date: "2026-01-15", source: "Orang Tua", account: "BNI Gaji", amount: 500000, description: "Bayar Jan" },
    { date: "2026-02-15", source: "Orang Tua", account: "BNI Gaji", amount: 500000, description: "Bayar Feb" },
    { date: "2026-03-15", source: "Orang Tua", account: "BNI Gaji", amount: 500000, description: "Bayar Mar" },
    { date: "2026-02-01", source: "Shopee Paylater", account: "Jago Online", amount: 200000, description: "Bayar SPL Jan" },
    { date: "2026-03-01", source: "Shopee Paylater", account: "Jago Online", amount: 150000, description: "Bayar SPL Feb" },
  ];
  for (const dp of debtPayments) {
    await prisma.debtPayment.create({
      data: { date: new Date(dp.date), debtSourceId: debts[dp.source], accountId: accounts[dp.account], amount: dp.amount, description: dp.description },
    });
  }

  // === RECEIVABLE PERSONS ===
  const receivablePersons = [
    { name: "Budi" },
    { name: "Andi" },
  ];
  const persons: Record<string, number> = {};
  for (const p of receivablePersons) {
    const per = await prisma.receivablePerson.upsert({ where: { name: p.name }, update: {}, create: p });
    persons[p.name] = per.id;
  }

  // Receivables
  const receivables = [
    { date: "2026-01-10", person: "Budi", account: "Jago", amount: 500000, type: "given" },
    { date: "2026-02-05", person: "Andi", account: "Jago", amount: 300000, type: "given" },
    { date: "2026-02-20", person: "Budi", account: "Jago", amount: 250000, type: "received" },
    { date: "2026-03-10", person: "Andi", account: "Jago", amount: 300000, type: "received" },
  ];
  for (const r of receivables) {
    await prisma.receivable.create({
      data: { date: new Date(r.date), personId: persons[r.person], accountId: accounts[r.account], amount: r.amount, type: r.type },
    });
  }

  // === INVESTMENT ASSETS ===
  const investmentAssets = [
    { name: "Emas Pegadaian", initialQty: 2, initialValue: 2000000 },
    { name: "Saham Gotrade", initialQty: 10, initialValue: 500000 },
    { name: "Reksadana Bibit", initialQty: 100, initialValue: 1000000 },
  ];
  const assets: Record<string, number> = {};
  for (const a of investmentAssets) {
    const asset = await prisma.investmentAsset.upsert({ where: { name: a.name }, update: {}, create: a });
    assets[a.name] = asset.id;
  }

  // Asset transactions
  const assetTxs = [
    { date: "2026-01-15", asset: "Emas Pegadaian", type: "buy", price: 1050000, quantity: 1, account: "BCA" },
    { date: "2026-02-10", asset: "Saham Gotrade", type: "buy", price: 55000, quantity: 5, account: "BCA" },
    { date: "2026-02-20", asset: "Reksadana Bibit", type: "buy", price: 10500, quantity: 50, account: "BCA" },
    { date: "2026-03-05", asset: "Emas Pegadaian", type: "buy", price: 1080000, quantity: 1, account: "BCA" },
    { date: "2026-03-15", asset: "Saham Gotrade", type: "sell", price: 60000, quantity: 3, account: "BCA" },
  ];
  for (const tx of assetTxs) {
    await prisma.assetTransaction.create({
      data: { date: new Date(tx.date), assetId: assets[tx.asset], type: tx.type, price: tx.price, quantity: tx.quantity, accountId: accounts[tx.account] },
    });
  }

  // === ITEMS ===
  const itemsList = [
    { name: "Efek Gitar Set", initialQty: 1, initialValue: 2500000 },
    { name: "Monitor LG 24\"", initialQty: 1, initialValue: 2000000 },
    { name: "Motor Beat", initialQty: 1, initialValue: 18000000 },
    { name: "Laptop Lenovo", initialQty: 1, initialValue: 8000000 },
    { name: "Keyboard Mechanical", initialQty: 1, initialValue: 750000 },
    { name: "Mouse Logitech", initialQty: 1, initialValue: 350000 },
    { name: "Headset Sony", initialQty: 1, initialValue: 1200000 },
    { name: "Smartphone Samsung", initialQty: 1, initialValue: 4500000 },
    { name: "Meja Kerja", initialQty: 1, initialValue: 800000 },
    { name: "Kursi Gaming", initialQty: 1, initialValue: 1500000 },
  ];
  const itemsMap: Record<string, number> = {};
  for (const item of itemsList) {
    const i = await prisma.item.upsert({ where: { name: item.name }, update: {}, create: item });
    itemsMap[item.name] = i.id;
  }

  // Item transactions
  const itemTxs = [
    { date: "2026-02-01", item: "Keyboard Mechanical", type: "buy", price: 800000, quantity: 1, account: "BCA" },
    { date: "2026-03-01", item: "Mouse Logitech", type: "buy", price: 400000, quantity: 1, account: "BCA" },
  ];
  for (const tx of itemTxs) {
    await prisma.itemTransaction.create({
      data: { date: new Date(tx.date), itemId: itemsMap[tx.item], type: tx.type, price: tx.price, quantity: tx.quantity, accountId: accounts[tx.account] },
    });
  }

  // === BUDGETS ===
  const budgetData = [
    { category: "Konsumsi", amount: 1500000 },
    { category: "Transportasi", amount: 400000 },
    { category: "Utilitas", amount: 700000 },
    { category: "Biaya Tempat Tinggal", amount: 1500000 },
    { category: "Lifestyle", amount: 200000 },
    { category: "Emoney", amount: 300000 },
    { category: "Parkir", amount: 50000 },
    { category: "Pacaran", amount: 300000 },
    { category: "Perawatan Kendaraan", amount: 200000 },
    { category: "Rokok/Vape", amount: 100000 },
    { category: "Admin", amount: 50000 },
    { category: "Bunga", amount: 0 },
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
      budgetKebutuhanPokok: 0.5,
      budgetBeliBarang: 0.05,
      budgetBeliAset: 0.06,
      budgetBayarUtang: 0.3,
    },
    create: {
      monthlyIncome: 11500000,
      monthlyExpense: 8000000,
      birthDate: new Date("1995-02-14"),
      retirementAge: 60,
      inheritanceAge: 80,
      budgetKebutuhanPokok: 0.5,
      budgetBeliBarang: 0.05,
      budgetBeliAset: 0.06,
      budgetBayarUtang: 0.3,
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
