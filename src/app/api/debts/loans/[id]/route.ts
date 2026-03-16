import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loanId = Number(id);

  const existing = await prisma.debtLoan.findUnique({ where: { id: loanId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  await prisma.debtLoan.delete({ where: { id: loanId } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loanId = Number(id);
  const body = await req.json();

  const existing = await prisma.debtLoan.findUnique({ where: { id: loanId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  const loan = await prisma.debtLoan.update({
    where: { id: loanId },
    data: { date: new Date(body.date), amount: body.amount, description: body.description || "" },
    include: { debtSource: true },
  });
  return NextResponse.json(loan);
}
