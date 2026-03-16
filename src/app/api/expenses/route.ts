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
    where.date = {
      gte: new Date(month + "-01"),
      lt: new Date(new Date(month + "-01").getFullYear(), new Date(month + "-01").getMonth() + 1, 1),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        userId: user.userId,
        date: new Date(body.date),
        categoryId: Number(body.categoryId),
        description: String(body.description || ""),
        amount: Number(body.amount),
      },
      include: { category: true },
    });
    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pengeluaran" }, { status: 500 });
  }
}
