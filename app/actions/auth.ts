"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession, verifyLogin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = verifyLogin(username, password);
  if (!user) {
    await writeAudit({
      actor: username || "unknown",
      role: "system",
      action: "login_failure",
      entity: "session",
      entityId: "-",
      details: "Invalid credentials",
    });
    redirect("/login?error=1");
  }
  await createSession(user);
  await writeAudit({
    actor: user.username,
    role: user.role,
    action: "login_success",
    entity: "session",
    entityId: user.username,
  });
  redirect("/");
}

export async function logoutAction() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (session) {
    await writeAudit({
      actor: session.username,
      role: session.role,
      action: "logout",
      entity: "session",
      entityId: session.username,
    });
  }
  await clearSession();
  redirect("/login");
}