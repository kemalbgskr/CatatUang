import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  let profile = await prisma.financialProfile.findFirst();
  if (!profile) {
    profile = await prisma.financialProfile.create({ data: {} });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const body = await req.json();
  let profile = await prisma.financialProfile.findFirst();
  if (!profile) {
    profile = await prisma.financialProfile.create({ data: {} });
  }
  const updated = await prisma.financialProfile.update({
    where: { id: profile.id },
    data: {
      monthlyIncome: body.monthlyIncome ?? profile.monthlyIncome,
      monthlyExpense: body.monthlyExpense ?? profile.monthlyExpense,
      birthDate: body.birthDate ? new Date(body.birthDate) : profile.birthDate,
      retirementAge: body.retirementAge ?? profile.retirementAge,
      inheritanceAge: body.inheritanceAge ?? profile.inheritanceAge,
    },
  });
  return NextResponse.json(updated);
}
