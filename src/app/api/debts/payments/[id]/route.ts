import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  await prisma.debtPayment.delete({ where: { id: paymentId } });
  return NextResponse.json({ ok: true });
}
