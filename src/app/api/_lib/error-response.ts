import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Maps every known error type to a safe, generic client-facing response.
 * Full error details (including stack traces) go to the server log only —
 * clients never see internals, matching the "no overexposing internal
 * errors" requirement.
 *
 * Discrimination is by `error.name` (a plain string), not `instanceof`.
 * Next.js's dev-mode per-route bundling can end up embedding the same
 * source module more than once across separate route chunks, which makes
 * `instanceof` unreliable across that boundary even for classes defined in
 * a single shared file — `name` survives that because it's just data, not
 * a prototype-chain check.
 */
const STATUS_BY_ERROR_NAME: Record<string, number> = {
  InvalidValueError: 400,
  IllegalStateTransitionError: 400,
  FlightNotFoundByIdError: 404,
  UnknownReferenceEntityError: 400,
  UnauthorizedError: 401,
};

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError || (error as { name?: string })?.name === "ZodError") {
    const details = error instanceof ZodError ? error.flatten() : undefined;
    return NextResponse.json({ error: "Invalid request", details }, { status: 400 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const name = error instanceof Error ? error.name : undefined;
  const status = name ? STATUS_BY_ERROR_NAME[name] : undefined;
  if (status) {
    return NextResponse.json({ error: (error as Error).message }, { status });
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
