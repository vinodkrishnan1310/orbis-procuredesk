import { getDb } from "@/lib/db";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const params = await searchParams;
  const user = (params.user ?? "").trim();
  const sql = getDb();

  const rows = user
    ? await sql`
        SELECT id, ts, actor, role, action, entity, entity_id, details
        FROM audit_log
        WHERE actor ILIKE ${"%" + user + "%"}
        ORDER BY ts DESC
        LIMIT 500
      `
    : await sql`
        SELECT id, ts, actor, role, action, entity, entity_id, details
        FROM audit_log
        ORDER BY ts DESC
        LIMIT 500
      `;

  return (
    <>
      <h1>Portal audit log (system of record)</h1>
      <form method="get" className="my-4" data-testid="audit-filter-form">
        <label htmlFor="user">Filter by user</label>
        <input id="user" name="user" defaultValue={user} />
        <button type="submit">Filter</button>
      </form>
      <table data-testid="audit-table">
        <thead>
          <tr>
            <th>Time (UTC)</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Entity ID</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as number}>
              <td>{new Date(r.ts as string).toISOString().replace("T", " ").slice(0, 19)}</td>
              <td>{r.actor as string}</td>
              <td>{r.role as string}</td>
              <td>{r.action as string}</td>
              <td>{r.entity as string}</td>
              <td>{r.entity_id as string}</td>
              <td>{(r.details as string) ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}