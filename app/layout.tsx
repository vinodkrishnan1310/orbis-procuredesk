import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoBanner } from "@/components/DemoBanner";
import { Nav } from "@/components/Nav";
import { getSession } from "@/lib/auth";
import { BUYER_COMPANY } from "@/lib/seed-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbis ProcureDesk",
  description: "Fictional legacy procurement portal (demo)",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}
      >
        <DemoBanner />
        <header className="px-4 py-3 border-b border-gray-400">
          <p className="text-lg font-bold" data-testid="company-header">
            {BUYER_COMPANY} — ProcureDesk
          </p>
          {session && (
            <p className="text-sm text-gray-800">
              Signed in as {session.username} ({session.role})
            </p>
          )}
        </header>
        <main className="px-4 py-4 max-w-6xl">
          {session && <Nav />}
          {children}
        </main>
      </body>
    </html>
  );
}