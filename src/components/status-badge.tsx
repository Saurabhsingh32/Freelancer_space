export function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Not funded";
    case "funded":
      return "Held";
    case "submitted":
      return "In review";
    case "released":
      return "Released";
    case "disputed":
      return "Disputed";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function eventLabel(type: string) {
  const map: Record<string, string> = {
    "deal.created": "Deal created",
    "milestone.created": "Milestone added",
    "invite.created": "Invite generated",
    "invite.accepted": "Freelancer joined",
    "order.created": "Payment order created",
    "milestone.funded": "Funds held",
    "milestone.submitted": "Work submitted",
    "milestone.approved": "Client approved",
    "milestone.auto_released": "Auto-released",
    "milestone.disputed": "Dispute opened",
    "milestone.refunded": "Refunded",
    "evidence.added": "Evidence added",
  };
  return map[type] ?? type;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: "var(--info-bg)", color: "var(--info)" },
    funded: { bg: "var(--held-bg)", color: "var(--held)" },
    submitted: { bg: "var(--info-bg)", color: "var(--info)" },
    released: { bg: "var(--ok-bg)", color: "var(--ok)" },
    disputed: { bg: "var(--warn-bg)", color: "var(--warn)" },
    refunded: { bg: "var(--warn-bg)", color: "var(--warn)" },
  };
  const tone = styles[status] ?? styles.draft;
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: tone.bg, color: tone.color }}
    >
      {statusLabel(status)}
    </span>
  );
}
