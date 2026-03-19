import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await req.json();

    const existingWallet = await prisma.wallet.findUnique({ where: { id } });
    if (!existingWallet || existingWallet.userId !== user.userId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const { type, name, accountNumber, balance } = body;
    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data: {
        type: type !== undefined ? type : existingWallet.type,
        name: name !== undefined ? name : existingWallet.name,
        accountNumber: accountNumber !== undefined ? accountNumber : existingWallet.accountNumber,
        balance: balance !== undefined ? parseFloat(balance) : existingWallet.balance,
      }
    });

    return NextResponse.json(updatedWallet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const existingWallet = await prisma.wallet.findUnique({ where: { id } });
    if (!existingWallet || existingWallet.userId !== user.userId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    await prisma.wallet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
