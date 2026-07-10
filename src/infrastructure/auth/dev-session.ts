import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "../persistence/prisma-client";

const SESSION_COOKIE_NAME = "flight_ritual_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

/**
 * Dev-mode single-user "auth": a signed cookie carrying a userId, verified
 * with an HMAC so it can't be trivially forged even though there's no real
 * identity provider behind it yet. Every application service still takes an
 * explicit userId parameter derived here — never from client-supplied
 * input — so swapping this module for real auth (NextAuth, Clerk, ...)
 * later requires no changes above this boundary.
 */
export interface SessionCookie {
  value: string;
  maxAge: number;
}

function getSessionSecret(): string {
  const secret = process.env.DEV_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "DEV_SESSION_SECRET is missing or too short. Set a random 32+ byte value in your environment.",
    );
  }
  return secret;
}

function sign(userId: string): string {
  const signature = createHmac("sha256", getSessionSecret()).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

function verify(token: string): string | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const userId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  const expected = createHmac("sha256", getSessionSecret()).update(userId).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  return userId;
}

export interface ResolvedSession {
  userId: string;
  /** Set on the response only when a new session was minted; omit otherwise. */
  cookieToSet?: SessionCookie;
}

/** Resolves the current session's userId from the request, minting a new dev user if none exists yet. */
export async function resolveSessionUserId(request: NextRequest): Promise<ResolvedSession> {
  const existingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verifiedUserId = existingToken ? verify(existingToken) : null;

  if (verifiedUserId) {
    return { userId: verifiedUserId };
  }

  const userId = randomUUID();
  await prisma.user.create({ data: { id: userId } });

  return {
    userId,
    cookieToSet: { value: sign(userId), maxAge: SESSION_MAX_AGE_SECONDS },
  };
}

export { SESSION_COOKIE_NAME };
