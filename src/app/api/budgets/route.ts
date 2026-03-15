import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.budget.findMany({
    where: { userId: user.userId },
    include: { category: true },
  });
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const budget = await prisma.budget.upsert({
    where: { categoryId: body.categoryId },
    update: { monthlyAmount: body.monthlyAmount },
    create: { userId: user.userId, categoryId: body.categoryId, monthlyAmount: body.monthlyAmount },
    include: { category: true },
  });
  return NextResponse.json(budget);
}
