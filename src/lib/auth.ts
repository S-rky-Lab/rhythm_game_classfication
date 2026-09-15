import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "rgc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type Role = "admin" | "editor" | "viewer";

interface SessionPayload {
  userId: number;
  role: Role;
  expiresAt: number;
}

export interface CurrentUser {
  id: number;
  name: string;
  role: Role;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function verifySignature(value: string, signature: string) {
  const expected = sign(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

function encodeSession(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${value}.${sign(value)}`;
}

function decodeSession(token?: string): SessionPayload | null {
  if (!token) return null;

  const [value, signature] = token.split(".");
  if (!value || !signature || !verifySignature(value, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== "number" ||
      (payload.role !== "admin" &&
        payload.role !== "editor" &&
        payload.role !== "viewer") ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

function isAllowedRole(role: Role, allowedRoles: Role[]) {
  return allowedRoles.includes(role);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, role: true },
  });

  if (
    !user ||
    (user.role !== "admin" && user.role !== "editor" && user.role !== "viewer") ||
    user.role !== session.role
  ) {
    return null;
  }

  return user as CurrentUser;
}

export async function requireRole(allowedRoles: Role[], redirectTo = "/games") {
  const user = await getCurrentUser();
  if (!user || !isAllowedRole(user.role, allowedRoles)) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

export async function createSession(user: CurrentUser) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodeSession({
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    }
  );
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getSafeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/games";
  }
  return value;
}
