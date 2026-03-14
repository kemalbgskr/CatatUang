import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const cat = await prisma.expenseCategory.create({ data: { name: body.name } });
  return NextResponse.json(cat);
}
