import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const assets = await prisma.investmentAsset.findMany({
    include: { transactions: { include: { account: true }, orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  const body = await req.json();
  const asset = await prisma.investmentAsset.create({
    data: { name: body.name, initialQty: body.initialQty || 0, initialValue: body.initialValue || 0 },
  });
  return NextResponse.json(asset);
}
