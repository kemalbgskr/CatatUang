import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.debtSource.findMany({
    where: { userId: user.userId },
    include: {
      loans: true,
      payments: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const source = await prisma.debtSource.create({
    data: { userId: user.userId, name: body.name, initialAmount: body.initialAmount || 0 },
  });
  return NextResponse.json(source);
}
