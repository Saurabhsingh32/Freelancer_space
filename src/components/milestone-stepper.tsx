const STEPS = [
  { id: "draft", label: "Create" },
  { id: "funded", label: "Held" },
  { id: "submitted", label: "Review" },
  { id: "released", label: "Released" },
] as const;

export function MilestoneStepper({ status }: { status: string }) {
  const current =
    status === "disputed"
      ? 2
      : status === "refunded"
        ? 1
        : Math.max(
            0,
            STEPS.findIndex((s) => s.id === status),
          );

  return (
    <ol className="grid grid-cols-4 gap-2 text-xs">
      {STEPS.map((step, i) => {
        const done = i <= current && status !== "refunded";
        return (
          <li key={step.id} className="min-w-0">
            <div
              className="h-1.5 rounded-full"
              style={{
                background: done ? "var(--accent)" : "var(--line)",
              }}
            />
            <p
              className="mt-1.5"
              style={{ color: done ? "var(--foreground)" : "var(--muted)" }}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
