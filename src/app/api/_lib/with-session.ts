import { NextRequest, NextResponse } from "next/server";
import { resolveSessionUserId, SESSION_COOKIE_NAME } from "../../../infrastructure/auth/dev-session";
import { toErrorResponse } from "./error-response";

/**
 * Wraps a route handler with session resolution: derives userId from the
 * signed session cookie (minting a new dev-mode user if none exists), calls
 * the handler with that userId, and attaches the session cookie to the
 * response when a new one was minted. Handlers never see raw client input
 * for userId — this is the only place it's established.
 */
export async function withSession(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const session = await resolveSessionUserId(request);
    const response = await handler(session.userId);

    if (session.cookieToSet) {
      response.cookies.set(SESSION_COOKIE_NAME, session.cookieToSet.value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: session.cookieToSet.maxAge,
      });
    }

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
