import { auth } from "@/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm tracking-[0.16em] text-[var(--muted)] uppercase">
            Two-party deal room
          </p>
          <h1 className="display mt-3 max-w-xl text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
            Money stays held until the work is real.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-[var(--muted)]">
            A deposit in a freelancer&apos;s account is already spent. Holdroom
            locks client funds until a milestone is submitted — then the client
            must approve, dispute, or let auto-release fire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={session ? "/deals/new" : "/register"}
              className="btn btn-primary"
            >
              {session ? "Open a deal" : "Start a deal"}
            </Link>
            <Link href="/how-to-test" className="btn btn-secondary">
              How to test it
            </Link>
          </div>
        </div>
        <aside className="card p-6">
          <p className="text-sm font-medium">Where the rupees sit</p>
          <ol className="mt-5 space-y-4">
            {[
              ["Fund", "Client pays Razorpay. Holdroom holds it."],
              ["Submit", "Freelancer posts work and files. Clock starts."],
              ["Decide", "Approve, dispute, auto-release, or refund."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs text-[#f7f3ea]"
                  style={{ background: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-[var(--muted)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="mt-16 grid gap-4 md:grid-cols-2">
        {[
          [
            "Freelancer cannot ghost the cash",
            "The deposit never lands in their pocket while work is still a promise.",
          ],
          [
            "Client cannot stall after delivery",
            "Silence after submit auto-releases when the review window ends.",
          ],
          [
            "Every move is on the record",
            "Funding, files, comments, disputes — append-only activity.",
          ],
          [
            "Refund if they never show",
            "Funded with no submission by the due date can be refunded.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="card p-5">
            <h2 className="display text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
          </div>
        ))}
      </section>
      <p className="mt-10 text-xs text-[var(--muted)]">
        Merchant of record, not a licensed escrow company. Released milestones
        are payout pending until you send money from Razorpay.
      </p>
    </main>
  );
}
