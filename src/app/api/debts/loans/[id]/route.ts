import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await prisma.debtLoan.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const loan = await prisma.debtLoan.update({
    where: { id: Number(id) },
    data: { date: new Date(body.date), amount: body.amount, description: body.description || "" },
    include: { debtSource: true },
  });
  return NextResponse.json(loan);
}
