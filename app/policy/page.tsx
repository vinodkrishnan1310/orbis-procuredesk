import { loadSettings, AP_RULES_TEXT } from "@/lib/settings";
import { formatUsd } from "@/lib/format";

export default async function PolicyPage() {
  const settings = await loadSettings();

  return (
    <>
      <h1>Accounts payable policy</h1>
      <dl className="my-4 space-y-2">
        <div>
          <dt className="font-semibold">Price tolerance</dt>
          <dd>{settings.price_tolerance_pct}%</dd>
        </div>
        <div>
          <dt className="font-semibold">Senior approval threshold</dt>
          <dd>${formatUsd(settings.senior_approval_threshold)}</dd>
        </div>
      </dl>
      <section className="whitespace-pre-wrap border border-gray-600 p-3 mt-4">
        {AP_RULES_TEXT}
      </section>
    </>
  );
}