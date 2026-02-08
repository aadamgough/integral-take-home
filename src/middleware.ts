import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_ROUTES = ["/dashboard", "/queue", "/intake"];

const PATIENT_ROUTES = ["/dashboard", "/intake"];

const REVIEWER_ROUTES = ["/queue"];

const PUBLIC_ROUTES = ["/", "/signup"];

const API_ROUTES = "/api/";

const SESSION_COOKIE_NAME = "session";

async function verifySessionToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "fallback-secret-key-change-in-production"
    );
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.expiresAt && (payload.expiresAt as number) < Date.now()) {
      return null;
    }
    
    return {
      userId: payload.userId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(API_ROUTES)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicRoute && pathname === "/") {
    if (session.role === "PATIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else if (session.role === "REVIEWER") {
      return NextResponse.redirect(new URL("/queue", request.url));
    }
  }

  if (session) {
    const isPatientRoute = PATIENT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    const isReviewerRoute = REVIEWER_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (session.role === "PATIENT" && isReviewerRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (session.role === "REVIEWER" && isPatientRoute && !isReviewerRoute) {
      return NextResponse.redirect(new URL("/queue", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
