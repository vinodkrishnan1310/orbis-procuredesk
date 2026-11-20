import { redirect } from "next/navigation";
import { timingSafeEqual, createHash } from "crypto";
import {
  getSession,
  type SessionUser,
  type UserRole,
} from "./session";

export type { SessionUser, UserRole };

export { createSession, clearSession, getSession, getSessionFromRequest } from "./session";

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

function envPassword(role: UserRole): string {
  switch (role) {
    case "ap.clerk":
      return process.env.CLERK_PASSWORD ?? "";
    case "finance.approver":
      return process.env.APPROVER_PASSWORD ?? "";
    case "senior.approver":
      return process.env.SENIOR_PASSWORD ?? "";
  }
}

function secureCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyLogin(username: string, password: string): SessionUser | null {
  const roleMap: Record<string, UserRole> = {
    "ap.clerk": "ap.clerk",
    "finance.approver": "finance.approver",
    "senior.approver": "senior.approver",
  };
  const role = roleMap[username];
  if (!role) return null;
  const expected = envPassword(role);
  if (!expected || !secureCompare(password, expected)) return null;
  return { username, role };
}

export function canApprovePayment(
  role: UserRole,
  amount: number,
  threshold: number,
  requiresSenior: boolean
): boolean {
  if (role === "ap.clerk") return false;
  if (role === "senior.approver") return true;
  if (role === "finance.approver") {
    if (requiresSenior || amount > threshold) return false;
    return true;
  }
  return false;
}