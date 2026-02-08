import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/queue", "/intake"];

// Routes that are only for patients
const PATIENT_ROUTES = ["/dashboard", "/intake"];

// Routes that are only for reviewers
const REVIEWER_ROUTES = ["/queue"];

// Public routes (no auth required)
const PUBLIC_ROUTES = ["/", "/signup"];

// API routes that don't need middleware protection (they handle their own auth)
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

  // Skip API routes - they handle their own authentication
  if (pathname.startsWith(API_ROUTES)) {
    return NextResponse.next();
  }

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Get session from cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const legacyUserId = request.cookies.get("userId")?.value;
  
  let session: { userId: string; role: string } | null = null;
  
  if (sessionToken) {
    session = await verifySessionToken(sessionToken);
  }

  // For backwards compatibility, also check the legacy userId cookie
  // In production, you might want to remove this after migration
  if (!session && legacyUserId) {
    // We can't verify the role from the legacy cookie, so we'll let the page handle it
    // This is a temporary measure during migration
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user is on login page, redirect to appropriate dashboard
  if (session && isPublicRoute && pathname === "/") {
    if (session.role === "PATIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else if (session.role === "REVIEWER") {
      return NextResponse.redirect(new URL("/queue", request.url));
    }
  }

  // Check role-based access
  if (session) {
    const isPatientRoute = PATIENT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    const isReviewerRoute = REVIEWER_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Patient trying to access reviewer routes
    if (session.role === "PATIENT" && isReviewerRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Reviewer trying to access patient-only routes
    if (session.role === "REVIEWER" && isPatientRoute && !isReviewerRoute) {
      return NextResponse.redirect(new URL("/queue", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
