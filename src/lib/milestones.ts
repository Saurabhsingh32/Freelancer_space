import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { autoReleaseMs, MILESTONE_STATUS } from "@/lib/money";
import { logEvent } from "@/lib/events";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }
  return session.user;
}

export async function getDealForUser(dealId: string, userId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      freelancer: { select: { id: true, name: true, email: true } },
      milestones: { orderBy: { createdAt: "asc" } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { name: true, email: true } } },
      },
    },
  });
  if (!deal) return null;
  if (deal.clientId !== userId && deal.freelancerId !== userId) return null;
  return deal;
}

export function roleOnDeal(
  deal: { clientId: string; freelancerId: string | null },
  userId: string,
) {
  if (deal.clientId === userId) return "client" as const;
  if (deal.freelancerId === userId) return "freelancer" as const;
  return null;
}

export async function applyAutoRelease(milestoneId?: string) {
  const now = Date.now();
  const candidates = await prisma.milestone.findMany({
    where: {
      status: MILESTONE_STATUS.submitted,
      autoReleaseAt: { not: null },
      ...(milestoneId ? { id: milestoneId } : {}),
    },
  });
  const due = candidates.filter(
    (milestone) =>
      milestone.autoReleaseAt !== null &&
      milestone.autoReleaseAt.getTime() <= now,
  );
  for (const milestone of due) {
    await releaseMilestone({
      milestoneId: milestone.id,
      actorId: null,
      reason: "auto_release",
    });
  }
  return due.length;
}

export async function markFunded(input: {
  orderId: string;
  paymentId: string;
}) {
  const milestone = await prisma.milestone.findFirst({
    where: { razorpayOrderId: input.orderId },
  });
  if (!milestone) {
    throw new Error("No milestone matches this Razorpay order.");
  }
  if (milestone.status !== MILESTONE_STATUS.draft) {
    return milestone;
  }
  const updated = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: MILESTONE_STATUS.funded,
      razorpayPaymentId: input.paymentId,
    },
  });
  await logEvent({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    type: "milestone.funded",
    payload: { paymentId: input.paymentId, orderId: input.orderId },
  });
  return updated;
}

export async function submitMilestone(input: {
  milestoneId: string;
  userId: string;
  body: string;
}) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: { deal: true },
  });
  if (!milestone) throw new Error("Milestone not found.");
  if (milestone.deal.freelancerId !== input.userId) {
    throw new Error("Only the freelancer can submit work.");
  }
  if (milestone.status !== MILESTONE_STATUS.funded) {
    throw new Error("Work can only be submitted on a funded milestone.");
  }
  const now = new Date();
  const updated = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: MILESTONE_STATUS.submitted,
      submittedAt: now,
      autoReleaseAt: new Date(now.getTime() + autoReleaseMs()),
    },
  });
  if (input.body.trim()) {
    await prisma.evidence.create({
      data: {
        milestoneId: milestone.id,
        userId: input.userId,
        kind: "comment",
        body: input.body.trim(),
      },
    });
  }
  await logEvent({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    actorId: input.userId,
    type: "milestone.submitted",
    payload: { autoReleaseAt: updated.autoReleaseAt?.toISOString() },
  });
  return updated;
}

export async function releaseMilestone(input: {
  milestoneId: string;
  actorId: string | null;
  reason: "approved" | "auto_release";
}) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: { deal: true },
  });
  if (!milestone) throw new Error("Milestone not found.");
  if (milestone.status !== MILESTONE_STATUS.submitted) {
    return milestone;
  }
  if (input.reason === "approved") {
    if (!input.actorId || milestone.deal.clientId !== input.actorId) {
      throw new Error("Only the client can approve.");
    }
  }
  const updated = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: MILESTONE_STATUS.released,
      releasedAt: new Date(),
      payoutPending: true,
      autoReleaseAt: null,
    },
  });
  await logEvent({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    actorId: input.actorId,
    type:
      input.reason === "approved"
        ? "milestone.approved"
        : "milestone.auto_released",
    payload: { payoutPending: true },
  });
  return updated;
}

export async function disputeMilestone(input: {
  milestoneId: string;
  userId: string;
  reason: string;
}) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: { deal: true },
  });
  if (!milestone) throw new Error("Milestone not found.");
  if (milestone.deal.clientId !== input.userId) {
    throw new Error("Only the client can open a dispute.");
  }
  if (milestone.status !== MILESTONE_STATUS.submitted) {
    throw new Error("You can only dispute a submitted milestone.");
  }
  const updated = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: MILESTONE_STATUS.disputed,
      autoReleaseAt: null,
    },
  });
  if (input.reason.trim()) {
    await prisma.evidence.create({
      data: {
        milestoneId: milestone.id,
        userId: input.userId,
        kind: "comment",
        body: input.reason.trim(),
      },
    });
  }
  await logEvent({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    actorId: input.userId,
    type: "milestone.disputed",
  });
  return updated;
}

export async function canClientRefund(milestone: {
  status: string;
  dueAt: Date | null;
}) {
  if (milestone.status !== MILESTONE_STATUS.funded) return false;
  if (!milestone.dueAt) return false;
  return milestone.dueAt.getTime() <= Date.now();
}
