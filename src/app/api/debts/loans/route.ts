import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const loan = await prisma.debtLoan.create({
    data: {
      date: new Date(body.date),
      debtSourceId: body.debtSourceId,
      accountId: body.accountId,
      amount: body.amount,
      description: body.description || "",
    },
    include: { debtSource: true, account: true },
  });
  return NextResponse.json(loan);
}
