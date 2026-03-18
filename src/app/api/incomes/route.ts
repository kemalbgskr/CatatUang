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

  const incomes = await prisma.income.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const income = await prisma.income.create({
      data: {
        userId: user.userId,
        date: new Date(body.date),
        categoryId: Number(body.categoryId),
        description: String(body.description || ""),
        amount: Number(body.amount),
      },
      include: { category: true },
    });
    return NextResponse.json(income);
  } catch (error: any) {
    console.error("POST /api/incomes error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pendapatan" }, { status: 500 });
  }
}
