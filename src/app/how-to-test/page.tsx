import Link from "next/link";

export default function HowToTestPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm tracking-[0.16em] text-[var(--muted)] uppercase">
        QA
      </p>
      <h1 className="display mt-2 text-4xl">How to know it is working</h1>
      <p className="mt-3 text-[var(--muted)]">
        Use two browsers or two profiles (Chrome + Safari, or a private window).
        One person is the client, the other is the freelancer.
      </p>

      <section className="card mt-8 p-6">
        <h2 className="display text-2xl">Setup</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            <code className="rounded bg-[var(--held-bg)] px-1">npm run dev</code>{" "}
            → http://localhost:3000
          </li>
          <li>
            Copy <code className="rounded bg-[var(--held-bg)] px-1">.env.example</code>{" "}
            to <code className="rounded bg-[var(--held-bg)] px-1">.env</code> if
            needed. Restart after changing env.
          </li>
          <li>
            Optional Razorpay test keys:{" "}
            <code className="rounded bg-[var(--held-bg)] px-1">RAZORPAY_KEY_ID</code>{" "}
            and{" "}
            <code className="rounded bg-[var(--held-bg)] px-1">RAZORPAY_KEY_SECRET</code>
            . Without them, Fund must show a keys error — that still counts as
            passing.
          </li>
        </ol>
      </section>

      <section className="mt-6 space-y-4">
        <Check
          n="1"
          title="Two accounts and an invite"
          pass="Deal room shows both emails. Activity lists Deal created and Freelancer joined."
        >
          Register client, New deal + first milestone, Generate invite, copy
          link. In the other browser register freelancer and accept.
        </Check>
        <Check
          n="2"
          title="Fund (or the honest error)"
          pass="Status becomes Held, banner says funds are locked. Or Fund prints the Razorpay keys message — never a fake success."
        >
          As client, open the milestone and click Fund milestone. Razorpay test
          card is usually 4111 1111 1111 1111, any future expiry, any CVV.
        </Check>
        <Check
          n="3"
          title="Submit starts the clock"
          pass="Status is In review. Banner shows an auto-release date ~7 days out (or sooner if AUTO_RELEASE_MS is small)."
        >
          As freelancer, submit notes (and a file). You should not be able to
          submit while status is still Not funded.
        </Check>
        <Check
          n="4"
          title="Approve vs dispute"
          pass="Approve → Released · payout pending. Dispute → Disputed, clock gone, both can still add evidence."
        >
          As client, either Approve and release, or Dispute with a reason.
        </Check>
        <Check
          n="5"
          title="Auto-release if the client ghosts"
          pass="Status flips to Released without anyone clicking Approve. Activity shows Auto-released."
        >
          Set AUTO_RELEASE_MS=15000 in .env, restart, submit again on a new
          funded milestone, wait 15+ seconds, refresh the deal (or open{" "}
          <code className="rounded bg-[var(--held-bg)] px-1">
            /api/cron/auto-release
          </code>
          ).
        </Check>
        <Check
          n="6"
          title="Refund if the freelancer ghosts"
          pass="Refund button appears only after due date, while still Held and never submitted. After refund, status is Refunded."
        >
          Fund a milestone whose due date is in the past. Do not submit. Client
          should see Refund hold. Needs a real captured payment id (Razorpay
          keys) for the API call to succeed.
        </Check>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/register" className="btn btn-primary">
          Run it now
        </Link>
      </p>
    </main>
  );
}

function Check({
  n,
  title,
  children,
  pass,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  pass: string;
}) {
  return (
    <article className="card p-5">
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-[var(--muted)]">{n}</span>
        <h2 className="display text-xl">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{children}</p>
      <p className="mt-3 text-sm">
        <span className="font-medium">Pass if: </span>
        {pass}
      </p>
    </article>
  );
}
