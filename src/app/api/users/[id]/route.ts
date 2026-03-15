import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetId = parseInt(id);

  if (targetId === user.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: targetId } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetId = parseInt(id);
  const body = await req.json();

  const data: any = {};
  if (body.username) data.username = body.username;
  if (body.role) data.role = body.role;
  if (body.password) {
    data.password = await bcrypt.hash(body.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data,
  });

  return NextResponse.json({ id: updated.id, username: updated.username, role: updated.role });
}
