import { addMilestoneAction } from "@/app/actions";
import { HoldBanner } from "@/components/hold-banner";
import { InviteForm } from "@/components/invite-form";
import { eventLabel, StatusBadge } from "@/components/status-badge";
import { auth } from "@/auth";
import { applyAutoRelease, getDealForUser, roleOnDeal } from "@/lib/milestones";
import { formatInr } from "@/lib/money";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  await applyAutoRelease();
  const deal = await getDealForUser(id, session.user.id);
  if (!deal) notFound();
  const role = roleOnDeal(deal, session.user.id);
  const held = deal.milestones
    .filter((m) => m.status === "funded" || m.status === "submitted" || m.status === "disputed")
    .reduce((sum, m) => sum + m.amountPaise, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/deals" className="text-sm text-[var(--muted)]">
        ← Deals
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">
            You are the {role} · {deal.client.name}
            {deal.freelancer ? ` / ${deal.freelancer.name}` : " / invite pending"}
          </p>
          <h1 className="display text-4xl">{deal.title}</h1>
        </div>
        <p className="text-sm">
          {held > 0 ? (
            <>
              <span className="text-[var(--held)]">{formatInr(held)}</span> held
            </>
          ) : (
            <span className="text-[var(--muted)]">Nothing held</span>
          )}
        </p>
      </div>

      {role === "client" && !deal.freelancerId ? (
        <div className="mt-8">
          <InviteForm dealId={deal.id} />
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="display text-2xl">Milestones</h2>
          <ul className="mt-4 space-y-4">
            {deal.milestones.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/deals/${deal.id}/milestones/${m.id}`}
                  className="card block p-5 hover:border-[var(--accent)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{m.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatInr(m.amountPaise)}</span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <HoldBanner
                      amountPaise={m.amountPaise}
                      status={m.status}
                      autoReleaseAt={m.autoReleaseAt}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          {role === "client" ? (
            <div className="card p-5">
              <h2 className="display text-xl">Add milestone</h2>
              <form
                action={addMilestoneAction.bind(null, deal.id)}
                className="mt-4 flex flex-col gap-3"
              >
                <input name="title" required placeholder="Title" className="field" />
                <textarea
                  name="description"
                  placeholder="Acceptance notes"
                  rows={2}
                  className="field"
                />
                <input
                  name="amountRupees"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="Amount INR"
                  className="field"
                />
                <input name="dueAt" type="datetime-local" className="field" />
                <button type="submit" className="btn btn-primary">
                  Add milestone
                </button>
              </form>
            </div>
          ) : null}

          <div className="card p-5">
            <h2 className="display text-xl">Activity</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {deal.events.map((event) => (
                <li key={event.id}>
                  <p>{eventLabel(event.type)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {event.createdAt.toLocaleString("en-IN")}
                    {event.actor ? ` · ${event.actor.name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}
