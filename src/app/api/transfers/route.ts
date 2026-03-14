import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where = month
    ? {
        date: {
          gte: new Date(month + "-01"),
          lt: new Date(new Date(month + "-01").getFullYear(), new Date(month + "-01").getMonth() + 1, 1),
        },
      }
    : {};

  const transfers = await prisma.transfer.findMany({
    where,
    include: { fromAccount: true, toAccount: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transfers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const transfer = await prisma.transfer.create({
    data: {
      date: new Date(body.date),
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      amount: body.amount,
      adminFee: body.adminFee || 0,
    },
    include: { fromAccount: true, toAccount: true },
  });
  return NextResponse.json(transfer);
}
