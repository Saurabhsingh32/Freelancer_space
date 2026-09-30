import { acceptInviteAction } from "@/app/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { token } = await params;
  const invite = await prisma.dealInvite.findUnique({
    where: { token },
    include: { deal: true },
  });
  if (!invite) notFound();

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="card p-8">
        <p className="text-sm text-[var(--muted)]">You&apos;ve been invited as freelancer</p>
        <h1 className="display mt-1 text-3xl">{invite.deal.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Accepting joins this deal room. Work only after a milestone is Held.
        </p>
        <form action={acceptInviteAction.bind(null, token)} className="mt-6">
          <button type="submit" className="btn btn-primary">
            Accept invite
          </button>
        </form>
      </div>
    </main>
  );
}
