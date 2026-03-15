import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await prisma.financialProfile.findUnique({ where: { userId: user.userId } });
  if (!profile) {
    profile = await prisma.financialProfile.create({ data: { userId: user.userId } });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const profile = await prisma.financialProfile.upsert({
    where: { userId: user.userId },
    update: {
      monthlyIncome: body.monthlyIncome,
      monthlyExpense: body.monthlyExpense,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      retirementAge: body.retirementAge,
      inheritanceAge: body.inheritanceAge,
    },
    create: {
      userId: user.userId,
      monthlyIncome: body.monthlyIncome || 0,
      monthlyExpense: body.monthlyExpense || 0,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      retirementAge: body.retirementAge || 60,
      inheritanceAge: body.inheritanceAge || 80,
    },
  });
  return NextResponse.json(profile);
}
