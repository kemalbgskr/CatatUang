import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const paymentId = Number(id);

  await prisma.$transaction(async (tx) => {
    // Delete linked expense first
    await tx.expense.deleteMany({ where: { debtPaymentId: paymentId } });
    await tx.debtPayment.delete({ where: { id: paymentId } });
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const paymentId = Number(id);
  const body = await req.json();

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.debtPayment.update({
      where: { id: paymentId },
      data: { date: new Date(body.date), amount: body.amount, description: body.description || "" },
      include: { debtSource: true },
    });

    // Update linked expense
    await tx.expense.updateMany({
      where: { debtPaymentId: paymentId },
      data: {
        date: new Date(body.date),
        amount: body.amount,
        description: `Bayar Utang: ${p.debtSource.name}${body.description ? " - " + body.description : ""}`,
      },
    });

    return p;
  });

  return NextResponse.json(payment);
}
