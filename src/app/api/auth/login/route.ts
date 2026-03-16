import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, validateLogin } from "@/lib/auth";
import fs from "fs";

export async function POST(req: Request) {
  try {
    fs.appendFileSync("/tmp/login.log", "Login attempt started\n");
    const body = await req.json();
    fs.appendFileSync("/tmp/login.log", `Body: ${JSON.stringify(body)}\n`);
    
    const username = String(body.username || "");
    const password = String(body.password || "");

    fs.appendFileSync("/tmp/login.log", "Validating login...\n");
    const user = await validateLogin(username, password);
    fs.appendFileSync("/tmp/login.log", `User found: ${!!user}\n`);
    
    if (!user) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    fs.appendFileSync("/tmp/login.log", "Creating token...\n");
    const res = NextResponse.json({ ok: true });
    const token = createAuthToken(user.id, user.username, user.role);
    fs.appendFileSync("/tmp/login.log", "Token created, setting cookie...\n");
    
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 5, // 5 menit
    });

    fs.appendFileSync("/tmp/login.log", "Login success\n");
    return res;
  } catch (err: any) {
    fs.appendFileSync("/tmp/login.log", `Login error: ${err.message}\n${err.stack}\n`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
