import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "ID kategori tidak valid" }, { status: 400 });
  }

  const usage = await prisma.income.count({ where: { categoryId } });
  if (usage > 0) {
    return NextResponse.json(
      { error: "Kategori pendapatan tidak bisa dihapus karena masih dipakai transaksi." },
      { status: 409 },
    );
  }

  await prisma.incomeCategory.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
