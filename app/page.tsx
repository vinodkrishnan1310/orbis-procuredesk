import { getDb } from "@/lib/db";
import { Flash } from "@/components/Flash";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();

  const openPos = await sql`
    SELECT COUNT(*)::int AS c FROM purchase_orders WHERE status = 'Open'
  `;
  const invStatuses = await sql`
    SELECT status, COUNT(*)::int AS c FROM invoices GROUP BY status
  `;
  const prStatuses = await sql`
    SELECT status, COUNT(*)::int AS c FROM payment_requests GROUP BY status
  `;

  return (
    <>
      <h1>Dashboard</h1>
      <Flash message={params.flash} />
      <section className="space-y-4 mt-4">
        <p data-testid="count-open-pos">
          Open purchase orders: <strong>{openPos[0].c}</strong>
        </p>
        <div>
          <h2 className="font-semibold">Invoices by status</h2>
          <ul>
            {invStatuses.map((r) => (
              <li key={r.status as string}>
                {r.status as string}: {r.c as number}
              </li>
            ))}
            {!invStatuses.length ? <li>None</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Payment requests by status</h2>
          <ul>
            {prStatuses.map((r) => (
              <li key={r.status as string}>
                {r.status as string}: {r.c as number}
              </li>
            ))}
            {!prStatuses.length ? <li>None</li> : null}
          </ul>
        </div>
      </section>
    </>
  );
}