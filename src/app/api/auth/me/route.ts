import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split("=")[1];

  return NextResponse.json({ authenticated: verifyAuthToken(token) });
}
