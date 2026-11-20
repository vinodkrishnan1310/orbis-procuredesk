import Link from "next/link";
import { getDb } from "@/lib/db";

export default async function VendorsPage() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, bank_account_masked, bank_last_changed
    FROM vendors ORDER BY name
  `;

  return (
    <>
      <h1>Vendors</h1>
      <table data-testid="vendors-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Bank account (masked)</th>
            <th>Bank details last changed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as number}>
              <td>
                <Link href={`/vendors/${r.id}`}>{r.name as string}</Link>
              </td>
              <td>{r.bank_account_masked as string}</td>
              <td>{String(r.bank_last_changed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}