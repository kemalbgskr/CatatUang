import { prisma } from "@/lib/prisma";
import { getDefaultAccountId } from "@/lib/default-account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  let accountId = Number(body.accountId);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    accountId = await getDefaultAccountId();
  }

  const loan = await prisma.debtLoan.create({
    data: {
      date: new Date(body.date),
      debtSourceId: body.debtSourceId,
      accountId,
      amount: body.amount,
      description: body.description || "",
    },
    include: { debtSource: true, account: true },
  });
  return NextResponse.json(loan);
}
