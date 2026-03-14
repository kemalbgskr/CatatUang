import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const tx = await prisma.assetTransaction.create({
    data: {
      date: new Date(body.date),
      assetId: body.assetId,
      type: body.type,
      price: body.price,
      quantity: body.quantity,
      accountId: body.accountId,
    },
    include: { asset: true, account: true },
  });
  return NextResponse.json(tx);
}
