import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const receivableId = Number(id);
  if (!Number.isFinite(receivableId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  await prisma.receivable.delete({ where: { id: receivableId } });
  return NextResponse.json({ ok: true });
}
