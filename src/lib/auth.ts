import { createHmac, timingSafeEqual } from "crypto";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export { AUTH_COOKIE_NAME };

const TOKEN_LIFETIME_SECONDS = 5 * 60; // 5 menit

function getAuthSecret() {
  return process.env.APP_AUTH_SECRET || "dev-secret-change-me";
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createAuthToken(userId: number, username: string, role: string) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const payload = `${userId}.${username}.${role}.${exp}`;
  const signature = sign(payload);
  return toBase64Url(`${payload}.${signature}`);
}

export function decodeAuthToken(token?: string) {
  if (!token) return null;
  try {
    const decoded = fromBase64Url(token);
    const [userId, username, role, expRaw, providedSignature] = decoded.split(".");
    if (!userId || !username || !role || !expRaw || !providedSignature) return null;

    const payload = `${userId}.${username}.${role}.${expRaw}`;
    const expectedSignature = sign(payload);

    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const exp = Number(expRaw);
    if (exp <= Math.floor(Date.now() / 1000)) return null;

    return { userId: Number(userId), username, role };
  } catch {
    return null;
  }
}

export function verifyAuthToken(token?: string) {
  return !!decodeAuthToken(token);
}

export async function validateLogin(username: string, password: unknown) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;

  const valid = await bcrypt.compare(String(password), user.password);
  if (!valid) return null;

  return { id: user.id, username: user.username, role: user.role };
}

export function getAuthenticatedUser(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split("=")[1];

  return decodeAuthToken(token);
}
