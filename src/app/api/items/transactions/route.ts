import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const tx = await prisma.itemTransaction.create({
    data: {
      date: new Date(body.date),
      itemId: body.itemId,
      type: body.type,
      price: body.price,
      quantity: body.quantity,
      accountId: body.accountId,
    },
    include: { item: true, account: true },
  });
  return NextResponse.json(tx);
}
