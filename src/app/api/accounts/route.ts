import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { initialBalance: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const account = await prisma.account.create({
    data: {
      name: body.name,
      type: body.type || "cash",
      ...(body.initialBalance !== undefined && {
        initialBalance: {
          create: {
            balance: body.initialBalance,
            date: new Date(body.date || new Date()),
          },
        },
      }),
    },
    include: { initialBalance: true },
  });
  return NextResponse.json(account);
}
