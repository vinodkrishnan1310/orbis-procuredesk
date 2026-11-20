import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payment Requests" },
  { href: "/vendors", label: "Vendors" },
  { href: "/policy", label: "Policy" },
  { href: "/audit", label: "Audit Log" },
];

export function Nav() {
  return (
    <nav
      className="flex flex-wrap gap-3 text-sm border-b border-gray-300 pb-3 mb-4"
      data-testid="main-nav"
      aria-label="Main"
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-blue-800 underline hover:text-blue-950"
        >
          {l.label}
        </Link>
      ))}
      <form action={logoutAction} className="inline">
        <button
          type="submit"
          className="text-blue-800 underline hover:text-blue-950"
          data-testid="sign-out"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}