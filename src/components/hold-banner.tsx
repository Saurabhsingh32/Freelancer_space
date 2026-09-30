import { formatInr } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";

export function HoldBanner({
  amountPaise,
  status,
  autoReleaseAt,
}: {
  amountPaise: number;
  status: string;
  autoReleaseAt?: Date | null;
}) {
  const amount = formatInr(amountPaise);
  let title = "Not funded yet";
  let message = `${amount} is still a promise. Do not start unpaid work.`;
  if (status === "funded") {
    title = "Held by Holdroom";
    message = `${amount} is locked on the platform. The freelancer cannot spend this deposit.`;
  } else if (status === "submitted") {
    title = "In client review";
    const when = autoReleaseAt
      ? autoReleaseAt.toLocaleString("en-IN")
      : "the review window ends";
    message = `${amount} stays held until approve, dispute, or auto-release at ${when}.`;
  } else if (status === "released") {
    title = "Released · payout pending";
    message = `${amount} is due to the freelancer. Send it from Razorpay until RazorpayX is connected.`;
  } else if (status === "disputed") {
    title = "Frozen for dispute";
    message = `${amount} will not auto-release. Add evidence until you settle.`;
  } else if (status === "refunded") {
    title = "Returned to client";
    message = `${amount} was refunded.`;
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--held-bg)]/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{message}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
