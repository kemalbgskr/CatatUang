import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where = month
    ? {
        date: {
          gte: new Date(month + "-01"),
          lt: new Date(new Date(month + "-01").getFullYear(), new Date(month + "-01").getMonth() + 1, 1),
        },
      }
    : {};

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      categoryId: body.categoryId,
      description: body.description,
      accountId: body.accountId,
      amount: body.amount,
    },
    include: { category: true, account: true },
  });
  return NextResponse.json(expense);
}
