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

    const loan = await prisma.debtLoan.create({
      data: {
        userId: user.userId,
        date: new Date(body.date),
        debtSourceId: sourceId,
        amount: Number(body.amount),
        description: String(body.description || ""),
      },
      include: { debtSource: true },
    });
    return NextResponse.json(loan);
  } catch (error: any) {
    console.error("POST /api/debts/loans error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pinjaman" }, { status: 500 });
  }
}
