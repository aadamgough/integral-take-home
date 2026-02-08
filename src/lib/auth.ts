import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const getSecretKey = () => {
  const secret = process.env.SESSION_SECRET || "fallback-secret-key-change-in-production";
  return new TextEncoder().encode(secret);
};

export interface SessionPayload {
  userId: string;
  email: string;
  role: "PATIENT" | "REVIEWER";
  expiresAt: number;
}

export async function createSession(user: { id: string; email: string; role: "PATIENT" | "REVIEWER" }): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt / 1000)
    .sign(getSecretKey());

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    
    if (payload.expiresAt && (payload.expiresAt as number) < Date.now()) {
      return null;
    }

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: Response, token: string): void {
  const cookieValue = `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  response.headers.append("Set-Cookie", cookieValue);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return null;
  }
  
  const session = await verifySession(sessionToken);
  if (!session) {
    return null;
  }
  
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return null;
  }
  
  return verifySession(sessionToken);
}

export function clearSessionCookie(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };
