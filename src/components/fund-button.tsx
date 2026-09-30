"use client";

import { useState } from "react";

type Props = {
  dealId: string;
  milestoneId: string;
  configured: boolean;
};

export function FundButton({ dealId, milestoneId, configured }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function fund() {
    setError(null);
    if (!configured) {
      setError(
        "Razorpay keys are not set. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.",
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/deals/${dealId}/milestones/${milestoneId}/order`,
        { method: "POST" },
      );
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        name?: string;
        description?: string;
        prefill?: { email?: string | null; name?: string | null };
      };
      if (!res.ok || !data.orderId || !data.keyId) {
        setError(data.error ?? "Could not create a Razorpay order.");
        return;
      }
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      const RazorpayCtor = (
        window as unknown as {
          Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
        }
      ).Razorpay;
      const rzp = new RazorpayCtor({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.orderId,
        prefill: data.prefill,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verify.ok) {
            const v = await verify.json();
            setError(v.error ?? "Payment verification failed.");
            return;
          }
          window.location.reload();
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={fund}
        disabled={busy}
        className="btn btn-primary disabled:opacity-50"
      >
        {busy ? "Opening checkout..." : "Fund this milestone"}
      </button>
      {error ? (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}
