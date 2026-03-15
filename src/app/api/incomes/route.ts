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

  const incomes = await prisma.income.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const income = await prisma.income.create({
    data: {
      date: new Date(body.date),
      categoryId: body.categoryId,
      description: body.description,
      amount: body.amount,
    },
    include: { category: true },
  });
  return NextResponse.json(income);
}
