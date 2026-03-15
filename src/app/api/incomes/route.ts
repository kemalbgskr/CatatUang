import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where: any = { userId: user.userId };
  if (month) {
    where.date = {
      gte: new Date(month + "-01"),
      lt: new Date(new Date(month + "-01").getFullYear(), new Date(month + "-01").getMonth() + 1, 1),
    };
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

  const body = await req.json();
  const income = await prisma.income.create({
    data: {
      userId: user.userId,
      date: new Date(body.date),
      categoryId: body.categoryId,
      description: body.description,
      amount: body.amount,
    },
    include: { category: true },
  });
  return NextResponse.json(income);
}
