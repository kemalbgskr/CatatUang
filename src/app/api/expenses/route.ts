import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where: any = { userId: user.userId };
  if (month && month !== "all") {
    try {
      const year = parseInt(month.split("-")[0]);
      const monthIdx = parseInt(month.split("-")[1]) - 1;
      const startDate = new Date(year, monthIdx, 1);
      const endDate = new Date(year, monthIdx + 1, 1);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        where.date = {
          gte: startDate,
          lt: endDate,
        };
      }
    } catch (e) {
      console.error("Invalid month filter:", month);
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true, debtPayment: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const categoryId = Number(body.categoryId);
    const amount = Number(body.amount);
    const debtSourceId = body.debtSourceId ? Number(body.debtSourceId) : null;

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    }
    if (isNaN(amount)) {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }

    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
    const isDebtPayment = category?.name.toLowerCase().includes("utang") || category?.name.toLowerCase().includes("hutang");

    let debtPaymentId = null;
    if (isDebtPayment && debtSourceId) {
      const debtPayment = await prisma.debtPayment.create({
        data: {
          userId: user.userId,
          date: new Date(body.date || new Date()),
          debtSourceId: debtSourceId,
          amount: amount,
          description: `Pembayaran via Pengeluaran: ${body.description || ""}`,
        },
      });
      debtPaymentId = debtPayment.id;
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.userId,
        date: new Date(body.date || new Date()),
        categoryId: categoryId,
        description: String(body.description || ""),
        amount: amount,
        debtPaymentId: debtPaymentId,
      },
      include: { category: true, debtPayment: true },
    });
    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pengeluaran" }, { status: 500 });
  }
}
