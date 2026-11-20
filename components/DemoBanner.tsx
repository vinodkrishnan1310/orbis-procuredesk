export function DemoBanner() {
  return (
    <div
      role="status"
      className="w-full bg-amber-400 text-black text-center text-sm font-semibold py-2 border-b border-amber-600"
      data-testid="demo-banner"
    >
      DEMO SYSTEM. All data is fictional.
    </div>
  );
}