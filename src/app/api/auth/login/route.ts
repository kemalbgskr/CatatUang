import { NextResponse } from "next/server";
import { validateLogin, createAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "");
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const user = await validateLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const token = createAuthToken(user.id, user.username, user.role);

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
