import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const sourceId = Number(body.debtSourceId);
    
    // Verify ownership of the debt source
    const source = await prisma.debtSource.findUnique({ where: { id: sourceId } });
    if (!source || source.userId !== user.userId) {
      return NextResponse.json({ error: "Debt source not found or unauthorized" }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.debtPayment.create({
        data: {
          userId: user.userId,
          date: new Date(body.date),
          debtSourceId: sourceId,
          amount: Number(body.amount),
          description: String(body.description || ""),
        },
        include: { debtSource: true },
      });

      // Create a corresponding expense
      let category = await tx.expenseCategory.findFirst({
        where: { userId: user.userId, name: "Bayar Utang" },
      });

      if (!category) {
        category = await tx.expenseCategory.create({
          data: { userId: user.userId, name: "Bayar Utang" },
        });
      }

      await tx.expense.create({
        data: {
          userId: user.userId,
          date: new Date(body.date),
          categoryId: category.id,
          description: `Bayar Utang: ${p.debtSource.name}${body.description ? " - " + body.description : ""}`,
          amount: Number(body.amount),
          debtPaymentId: p.id,
        },
      });

      return p;
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("POST /api/debts/payments error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pembayaran utang" }, { status: 500 });
  }
}
