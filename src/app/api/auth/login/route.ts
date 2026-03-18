import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, validateLogin } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body.username || "");
  const password = String(body.password || "");

  const user = await validateLogin(username, password);
  if (!user) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const token = createAuthToken(user.id, user.username, user.role);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // Set false for better stability when testing on localhost
    path: "/",
    maxAge: 60 * 60, // Temporarily increase to 1 hour to avoid logout during tests
  });

  return res;
}
