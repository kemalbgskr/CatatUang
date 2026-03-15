import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.income.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const income = await prisma.income.update({
    where: { id: parseInt(id) },
    data: {
      date: new Date(body.date),
      categoryId: body.categoryId,
      description: body.description,
      amount: body.amount,
    },
    include: { category: true },
  });
  return NextResponse.json(income);
}
