import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.budget.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
