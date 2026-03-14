import { prisma } from "@/lib/prisma";
import { getDefaultAccountId } from "@/lib/default-account";
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
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const body = await req.json();
  let accountId = Number(body.accountId);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    accountId = await getDefaultAccountId();
  }

  const income = await prisma.income.create({
    data: {
      date: new Date(body.date),
      categoryId: body.categoryId,
      description: body.description,
      accountId,
      amount: body.amount,
    },
    include: { category: true, account: true },
  });
  return NextResponse.json(income);
}
