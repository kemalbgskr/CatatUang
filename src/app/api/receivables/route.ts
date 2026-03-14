import { prisma } from "@/lib/prisma";
import { getDefaultAccountId } from "@/lib/default-account";
import { NextResponse } from "next/server";

export async function GET() {
  const persons = await prisma.receivablePerson.findMany({
    include: { receivables: { include: { account: true }, orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(persons);
}

export async function POST(req: Request) {
  const body = await req.json();
  let accountId = Number(body.accountId);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    accountId = await getDefaultAccountId();
  }

  const receivable = await prisma.receivable.create({
    data: {
      date: new Date(body.date),
      personId: body.personId,
      accountId,
      amount: body.amount,
      type: body.type,
    },
    include: { person: true, account: true },
  });
  return NextResponse.json(receivable);
}
