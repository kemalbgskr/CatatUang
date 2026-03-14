import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isFinite(personId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.receivable.deleteMany({ where: { personId } });
    await tx.receivablePerson.delete({ where: { id: personId } });
  });

  return NextResponse.json({ ok: true });
}
