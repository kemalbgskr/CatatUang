import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const person = await prisma.receivablePerson.create({ data: { name: body.name } });
  return NextResponse.json(person);
}
