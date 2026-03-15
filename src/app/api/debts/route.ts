import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const sources = await prisma.debtSource.findMany({
    include: {
      loans: true,
      payments: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const body = await req.json();
  const source = await prisma.debtSource.create({
    data: { name: body.name, initialAmount: body.initialAmount || 0 },
  });
  return NextResponse.json(source);
}
