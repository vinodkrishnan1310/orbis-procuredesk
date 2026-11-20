import { timingSafeEqual, createHash } from "crypto";
import { truncateAndSeed } from "@/lib/seed";
import { writeAudit } from "@/lib/audit";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-reset-secret") ?? "";
  const expected = process.env.RESET_SECRET ?? "";
  if (!expected || !safeEqual(secret, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  await truncateAndSeed();
  await writeAudit({
    actor: "system",
    role: "system",
    action: "demo_reset",
    entity: "database",
    entityId: "-",
  });
  return Response.json({ ok: true });
}