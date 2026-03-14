import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isFinite(loanId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  await prisma.debtLoan.delete({ where: { id: loanId } });
  return NextResponse.json({ ok: true });
}
