import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, password, role } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, role: role || "USER" },
    });
    return NextResponse.json({ id: newUser.id, username: newUser.username, role: newUser.role });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
