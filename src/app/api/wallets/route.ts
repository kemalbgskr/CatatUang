import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wallets = await prisma.wallet.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(wallets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, name, accountNumber, balance } = body;

    const newWallet = await prisma.wallet.create({
      data: {
        userId: user.userId,
        type,
        name,
        accountNumber,
        balance: parseFloat(balance) || 0
      }
    });

    return NextResponse.json(newWallet, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
