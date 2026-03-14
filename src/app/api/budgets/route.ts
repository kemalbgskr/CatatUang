import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const budgets = await prisma.budget.findMany({ include: { category: true } });
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const body = await req.json();
  const budget = await prisma.budget.upsert({
    where: { categoryId: body.categoryId },
    update: { monthlyAmount: body.monthlyAmount },
    create: { categoryId: body.categoryId, monthlyAmount: body.monthlyAmount },
    include: { category: true },
  });
  return NextResponse.json(budget);
}
