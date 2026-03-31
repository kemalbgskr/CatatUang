import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const expenseId = parseInt(id);

  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  if (existing.debtPaymentId) {
    await prisma.debtPayment.delete({ where: { id: existing.debtPaymentId } });
  }
  await prisma.expense.delete({ where: { id: expenseId } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const expenseId = parseInt(id);
    const body = await req.json();
    const categoryId = Number(body.categoryId);
    const amount = Number(body.amount);
    const debtSourceId = body.debtSourceId ? Number(body.debtSourceId) : null;

    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.userId !== user.userId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
    const isDebtPayment = category?.name.toLowerCase().includes("utang") || category?.name.toLowerCase().includes("hutang");

    let debtPaymentId = existing.debtPaymentId;

    if (isDebtPayment && debtSourceId) {
      if (debtPaymentId) {
        // Update existing
        await prisma.debtPayment.update({
          where: { id: debtPaymentId },
          data: {
            date: new Date(body.date),
            debtSourceId: debtSourceId,
            amount: amount,
            description: `Pembayaran via Pengeluaran (Edit): ${body.description || ""}`,
          },
        });
      } else {
        // Create new
        const dp = await prisma.debtPayment.create({
          data: {
            userId: user.userId,
            date: new Date(body.date),
            debtSourceId: debtSourceId,
            amount: amount,
            description: `Pembayaran via Pengeluaran: ${body.description || ""}`,
          },
        });
        debtPaymentId = dp.id;
      }
    } else if (debtPaymentId) {
      // Remove link if it's no longer a debt payment
      await prisma.debtPayment.delete({ where: { id: debtPaymentId } });
      debtPaymentId = null;
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        date: new Date(body.date),
        categoryId: categoryId,
        description: String(body.description || ""),
        amount: amount,
        debtPaymentId: debtPaymentId,
      },
      include: { category: true, debtPayment: true },
    });
    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("PUT /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengupdate pengeluaran" }, { status: 500 });
  }
}
