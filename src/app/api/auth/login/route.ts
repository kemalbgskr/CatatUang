import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, getLoginCredentials } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body.username || "");
  const password = String(body.password || "");

  const creds = getLoginCredentials();
  if (username !== creds.username || password !== creds.password) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const token = createAuthToken(username);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
