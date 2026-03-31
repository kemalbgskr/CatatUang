import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const receivableId = Number(id);
  if (!Number.isFinite(receivableId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.receivable.findUnique({ where: { id: receivableId } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
  }

  await prisma.receivable.delete({ where: { id: receivableId } });
  return NextResponse.json({ ok: true });
}
