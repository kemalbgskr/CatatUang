import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  
  // Verify ownership of the debt source
  const source = await prisma.debtSource.findUnique({ where: { id: body.debtSourceId } });
  if (!source || source.userId !== user.userId) {
    return NextResponse.json({ error: "Debt source not found or unauthorized" }, { status: 404 });
  }

  const payment = await prisma.debtPayment.create({
    data: {
      userId: user.userId,
      date: new Date(body.date),
      debtSourceId: body.debtSourceId,
      amount: body.amount,
      description: body.description || "",
    },
    include: { debtSource: true },
  });
  return NextResponse.json(payment);
}
