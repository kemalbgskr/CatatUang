import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const personId = Number(id);
  if (!Number.isFinite(personId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.receivablePerson.findUnique({ where: { id: personId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.receivable.deleteMany({ where: { personId } });
    await tx.receivablePerson.delete({ where: { id: personId } });
  });

  return NextResponse.json({ ok: true });
}
