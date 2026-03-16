import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const persons = await prisma.receivablePerson.findMany({
    where: { userId: user.userId },
    include: { receivables: { orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(persons);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const receivable = await prisma.receivable.create({
      data: {
        userId: user.userId,
        date: new Date(body.date),
        personId: Number(body.personId),
        amount: Number(body.amount),
        type: String(body.type),
      },
      include: { person: true },
    });
    return NextResponse.json(receivable);
  } catch (error: any) {
    console.error("POST /api/receivables error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat piutang" }, { status: 500 });
  }
}
