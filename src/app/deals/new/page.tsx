import { createDealAction } from "@/app/actions";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewDealPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link href="/deals" className="text-sm text-[var(--muted)]">
        ← Deals
      </Link>
      <div className="card mt-4 p-8">
        <h1 className="display text-3xl">New deal</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          You are the client. Invite the freelancer after this exists.
        </p>
        <form action={createDealAction} className="mt-8 flex flex-col gap-4">
          <label className="label">
            Deal title
            <input name="title" required className="field" placeholder="Landing page rebuild" />
          </label>
          <p className="display text-lg">First milestone</p>
          <label className="label">
            Milestone title
            <input name="milestoneTitle" className="field" placeholder="Wireframes" />
          </label>
          <label className="label">
            What “done” means
            <textarea name="description" rows={3} className="field" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              Amount (INR)
              <input
                name="amountRupees"
                type="number"
                min="1"
                step="0.01"
                className="field"
              />
            </label>
            <label className="label">
              Due
              <input name="dueAt" type="datetime-local" className="field" />
            </label>
          </div>
          <button type="submit" className="btn btn-primary mt-2">
            Create deal
          </button>
        </form>
      </div>
    </main>
  );
}
