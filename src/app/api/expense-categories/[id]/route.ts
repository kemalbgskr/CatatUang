import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "ID kategori tidak valid" }, { status: 400 });
  }

  const [expenseUsage, budgetUsage] = await Promise.all([
    prisma.expense.count({ where: { categoryId } }),
    prisma.budget.count({ where: { categoryId } }),
  ]);

  if (expenseUsage > 0 || budgetUsage > 0) {
    return NextResponse.json(
      { error: "Kategori pengeluaran tidak bisa dihapus karena masih dipakai transaksi atau budget." },
      { status: 409 },
    );
  }

  await prisma.expenseCategory.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
