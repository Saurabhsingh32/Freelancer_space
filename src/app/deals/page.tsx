import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DealsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ clientId: session.user.id }, { freelancerId: session.user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { email: true, name: true } },
      freelancer: { select: { email: true, name: true } },
      milestones: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Your rooms</p>
          <h1 className="display text-4xl">Deals</h1>
        </div>
        <Link href="/deals/new" className="btn btn-primary">
          New deal
        </Link>
      </div>
      {deals.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="display text-2xl">No deals yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create one as the client, then invite someone you already know.
          </p>
          <Link href="/deals/new" className="btn btn-primary mt-6">
            Create a deal
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {deals.map((deal) => {
            const held = deal.milestones
              .filter((m) => m.status === "funded" || m.status === "submitted")
              .reduce((sum, m) => sum + m.amountPaise, 0);
            const role =
              deal.clientId === session.user.id ? "Client" : "Freelancer";
            return (
              <li key={deal.id}>
                <Link href={`/deals/${deal.id}`} className="card block p-5 hover:border-[var(--accent)]">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="display text-2xl">{deal.title}</h2>
                    <span className="text-xs tracking-wide text-[var(--muted)] uppercase">
                      {role}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {deal.client.name} · {deal.freelancer?.name ?? "awaiting invite"}
                  </p>
                  <p className="mt-4 text-sm">
                    {held > 0 ? `${formatInr(held)} currently held` : "Nothing held yet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {deal.milestones.map((m) => (
                      <StatusBadge key={m.id} status={m.status} />
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
