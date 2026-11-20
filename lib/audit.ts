import { getDb } from "./db";
import type { UserRole } from "./auth";

export async function writeAudit(params: {
  actor: string;
  role: UserRole | "system" | string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
}): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO audit_log (actor, role, action, entity, entity_id, details)
    VALUES (
      ${params.actor},
      ${params.role},
      ${params.action},
      ${params.entity},
      ${params.entityId},
      ${params.details ?? null}
    )
  `;
}