import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const persons = await prisma.receivablePerson.findMany({
    include: { receivables: { orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(persons);
}

export async function POST(req: Request) {
  const body = await req.json();
  const receivable = await prisma.receivable.create({
    data: {
      date: new Date(body.date),
      personId: body.personId,
      amount: body.amount,
      type: body.type,
    },
    include: { person: true },
  });
  return NextResponse.json(receivable);
}
