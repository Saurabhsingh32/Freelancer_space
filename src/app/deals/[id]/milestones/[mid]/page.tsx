import {
  addEvidenceAction,
  approveAction,
  disputeAction,
  refundAction,
  submitWorkAction,
} from "@/app/actions";
import { FundButton } from "@/components/fund-button";
import { HoldBanner } from "@/components/hold-banner";
import { MilestoneStepper } from "@/components/milestone-stepper";
import { StatusBadge } from "@/components/status-badge";
import { auth } from "@/auth";
import {
  applyAutoRelease,
  canClientRefund,
  getDealForUser,
  roleOnDeal,
} from "@/lib/milestones";
import { formatInr } from "@/lib/money";
import { razorpayConfigured } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function MilestonePage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id, mid } = await params;
  await applyAutoRelease(mid);
  const deal = await getDealForUser(id, session.user.id);
  if (!deal) notFound();
  const milestone = await prisma.milestone.findUnique({
    where: { id: mid },
    include: {
      evidence: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!milestone || milestone.dealId !== deal.id) notFound();
  const role = roleOnDeal(deal, session.user.id);
  const refundable = await canClientRefund(milestone);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/deals/${deal.id}`} className="text-sm text-[var(--muted)]">
        ← {deal.title}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display text-4xl">{milestone.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatInr(milestone.amountPaise)}
            {milestone.dueAt
              ? ` · due ${milestone.dueAt.toLocaleString("en-IN")}`
              : ""}
          </p>
        </div>
        <StatusBadge status={milestone.status} />
      </div>
      {milestone.description ? (
        <p className="mt-4 text-sm leading-6">{milestone.description}</p>
      ) : null}
      <div className="mt-6">
        <MilestoneStepper status={milestone.status} />
      </div>
      <div className="mt-6">
        <HoldBanner
          amountPaise={milestone.amountPaise}
          status={milestone.status}
          autoReleaseAt={milestone.autoReleaseAt}
        />
      </div>

      <div className="card mt-6 space-y-4 p-5">
        {role === "client" && milestone.status === "draft" ? (
          <div>
            <h2 className="display text-xl">Fund the hold</h2>
            <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
              Pays Holdroom, not the freelancer. Status should become Held.
            </p>
            <FundButton
              dealId={deal.id}
              milestoneId={milestone.id}
              configured={razorpayConfigured()}
            />
          </div>
        ) : null}

        {role === "freelancer" && milestone.status === "funded" ? (
          <form
            action={submitWorkAction.bind(null, milestone.id)}
            className="flex flex-col gap-3"
          >
            <h2 className="display text-xl">Deliver this milestone</h2>
            <textarea
              name="body"
              required
              placeholder="What is delivered"
              rows={4}
              className="field"
            />
            <button type="submit" className="btn btn-primary w-fit">
              Submit work and start review clock
            </button>
          </form>
        ) : null}

        {role === "client" && milestone.status === "submitted" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <form action={approveAction.bind(null, milestone.id)}>
              <h2 className="display text-xl">Looks good</h2>
              <p className="mt-1 mb-3 text-sm text-[var(--muted)]">
                Marks payout pending to the freelancer.
              </p>
              <button type="submit" className="btn btn-primary">
                Approve and release
              </button>
            </form>
            <form
              action={disputeAction.bind(null, milestone.id)}
              className="flex flex-col gap-3"
            >
              <h2 className="display text-xl">Not done</h2>
              <textarea
                name="reason"
                required
                placeholder="What is missing"
                className="field"
              />
              <button type="submit" className="btn btn-danger">
                Dispute (stops auto-release)
              </button>
            </form>
          </div>
        ) : null}

        {role === "client" && refundable ? (
          <form action={refundAction.bind(null, milestone.id)}>
            <h2 className="display text-xl">Freelancer no-show</h2>
            <p className="mt-1 mb-3 text-sm text-[var(--muted)]">
              Due date passed and nothing was submitted.
            </p>
            <button type="submit" className="btn btn-danger">
              Refund the hold
            </button>
          </form>
        ) : null}

        {role === "freelancer" && milestone.status === "draft" ? (
          <p className="text-sm text-[var(--muted)]">
            Waiting for the client to fund. Do not start unpaid work.
          </p>
        ) : null}
      </div>

      <section className="card mt-8 p-5">
        <h2 className="display text-xl">Evidence</h2>
        <ul className="mt-4 space-y-4">
          {milestone.evidence.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">Nothing attached yet.</li>
          ) : (
            milestone.evidence.map((item) => (
              <li key={item.id} className="border-b border-[var(--line)] pb-3 last:border-0">
                <div className="text-xs text-[var(--muted)]">
                  {item.user.name} · {item.createdAt.toLocaleString("en-IN")} ·{" "}
                  {item.kind}
                </div>
                {item.body ? <p className="mt-1 text-sm">{item.body}</p> : null}
                {item.filePath ? (
                  <a
                    className="mt-1 inline-block text-sm underline"
                    href={`/api/uploads/${item.filePath}`}
                  >
                    {item.fileName ?? "Download file"}
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
        <form
          action={addEvidenceAction.bind(null, milestone.id)}
          className="mt-4 flex flex-col gap-3"
        >
          <textarea name="body" placeholder="Comment" rows={3} className="field" />
          <input name="file" type="file" className="text-sm" />
          <button type="submit" className="btn btn-secondary w-fit">
            Attach evidence
          </button>
        </form>
      </section>
    </main>
  );
}
