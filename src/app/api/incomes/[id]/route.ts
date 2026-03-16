import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const incomeId = parseInt(id);

  const existing = await prisma.income.findUnique({ where: { id: incomeId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  await prisma.income.delete({ where: { id: incomeId } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const incomeId = parseInt(id);
    const body = await req.json();

    const existing = await prisma.income.findUnique({ where: { id: incomeId } });
    if (!existing || existing.userId !== user.userId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const income = await prisma.income.update({
      where: { id: incomeId },
      data: {
        date: new Date(body.date),
        categoryId: Number(body.categoryId),
        description: String(body.description || ""),
        amount: Number(body.amount),
      },
      include: { category: true },
    });
    return NextResponse.json(income);
  } catch (error: any) {
    console.error("PUT /api/incomes error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengupdate pendapatan" }, { status: 500 });
  }
}
