import { createHmac, timingSafeEqual } from "crypto";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";

export { AUTH_COOKIE_NAME };

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

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

export function createAuthToken(username: string) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const payload = `${username}.${exp}`;
  const signature = sign(payload);
  return toBase64Url(`${payload}.${signature}`);
}

export function verifyAuthToken(token?: string) {
  if (!token) return false;

  try {
    const decoded = fromBase64Url(token);
    const [username, expRaw, providedSignature] = decoded.split(".");
    if (!username || !expRaw || !providedSignature) return false;

    const payload = `${username}.${expRaw}`;
    const expectedSignature = sign(payload);

    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

    const exp = Number(expRaw);
    if (!Number.isFinite(exp)) return false;

    return exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function getLoginCredentials() {
  return {
    username: process.env.APP_LOGIN_USERNAME || "admin",
    password: process.env.APP_LOGIN_PASSWORD || "admin123",
  };
}
