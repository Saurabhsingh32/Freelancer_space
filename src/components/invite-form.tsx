"use client";

import { useState } from "react";
import { createInviteAction } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";

export function InviteForm({ dealId }: { dealId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="card p-5">
      <h2 className="display text-xl">Invite the freelancer</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        They already know you. Share a one-time link — this is not a marketplace.
      </p>
      <form
        className="mt-4"
        action={async () => {
          setError(null);
          const result = await createInviteAction(dealId);
          if (result?.error) setError(result.error);
          if (result?.url) setUrl(result.url);
        }}
      >
        <button type="submit" className="btn btn-primary">
          Generate invite link
        </button>
      </form>
      {url ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all font-mono text-xs">{url}</p>
          <CopyButton value={url} />
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
