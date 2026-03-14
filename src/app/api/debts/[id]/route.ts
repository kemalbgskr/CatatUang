import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const debtSourceId = Number(id);
  if (!Number.isFinite(debtSourceId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.debtLoan.deleteMany({ where: { debtSourceId } });
    await tx.debtPayment.deleteMany({ where: { debtSourceId } });
    await tx.debtSource.delete({ where: { id: debtSourceId } });
  });

  return NextResponse.json({ ok: true });
}
