"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/events";
import {
  canClientRefund,
  disputeMilestone,
  getDealForUser,
  releaseMilestone,
  requireUser,
  roleOnDeal,
  submitMilestone,
} from "@/lib/milestones";
import { getRazorpay } from "@/lib/razorpay";
import { MILESTONE_STATUS, rupeesToPaise } from "@/lib/money";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function fail(message: string): never {
  throw new Error(message);
}

export async function registerAction(
  formData: FormData,
): Promise<{ error: string } | null> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) {
    return {
      error:
        "Name, email, and a password of at least 8 characters are required.",
    };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });
  await signIn("credentials", { email, password, redirectTo: "/deals" });
  return null;
}

export async function loginAction(
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/deals");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/deals",
    });
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return { error: "Invalid email or password." };
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createDealAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const milestoneTitle = String(formData.get("milestoneTitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRupees = String(formData.get("amountRupees") ?? "");
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  if (!title) fail("Deal title is required.");

  let amountPaise: number | null = null;
  if (milestoneTitle) {
    try {
      amountPaise = rupeesToPaise(amountRupees);
    } catch {
      fail("Enter a positive milestone amount in rupees.");
    }
  }

  const deal = await prisma.deal.create({
    data: {
      title,
      clientId: user.id,
    },
  });
  await logEvent({
    dealId: deal.id,
    actorId: user.id,
    type: "deal.created",
  });

  if (milestoneTitle && amountPaise !== null) {
    const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
    const milestone = await prisma.milestone.create({
      data: {
        dealId: deal.id,
        title: milestoneTitle,
        description,
        amountPaise,
        dueAt,
      },
    });
    await logEvent({
      dealId: deal.id,
      milestoneId: milestone.id,
      actorId: user.id,
      type: "milestone.created",
      payload: { title: milestoneTitle },
    });
  }

  redirect(`/deals/${deal.id}`);
}

export async function addMilestoneAction(dealId: string, formData: FormData) {
  const user = await requireUser();
  const deal = await getDealForUser(dealId, user.id);
  if (!deal) fail("Deal not found.");
  if (roleOnDeal(deal, user.id) !== "client") {
    fail("Only the client can add milestones.");
  }
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRupees = String(formData.get("amountRupees") ?? "");
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  if (!title) fail("Milestone title is required.");
  let amountPaise: number;
  try {
    amountPaise = rupeesToPaise(amountRupees);
  } catch {
    fail("Enter a positive amount in rupees.");
  }
  const milestone = await prisma.milestone.create({
    data: {
      dealId,
      title,
      description,
      amountPaise,
      dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
    },
  });
  await logEvent({
    dealId,
    milestoneId: milestone.id,
    actorId: user.id,
    type: "milestone.created",
  });
  revalidatePath(`/deals/${dealId}`);
}

export async function createInviteAction(dealId: string) {
  const user = await requireUser();
  const deal = await getDealForUser(dealId, user.id);
  if (!deal) return { error: "Deal not found." };
  if (roleOnDeal(deal, user.id) !== "client") {
    return { error: "Only the client can invite." };
  }
  const token = randomBytes(24).toString("hex");
  const invite = await prisma.dealInvite.create({
    data: {
      dealId,
      token,
      role: "freelancer",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  await logEvent({
    dealId,
    actorId: user.id,
    type: "invite.created",
  });
  revalidatePath(`/deals/${dealId}`);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return { url: `${appUrl}/invites/${invite.token}` };
}

export async function acceptInviteAction(token: string) {
  const user = await requireUser();
  const invite = await prisma.dealInvite.findUnique({
    where: { token },
    include: { deal: true },
  });
  if (!invite || invite.expiresAt.getTime() < Date.now()) {
    fail("This invite is invalid or expired.");
  }
  if (invite.deal.clientId === user.id) {
    fail("The client cannot join as the freelancer.");
  }
  if (invite.deal.freelancerId && invite.deal.freelancerId !== user.id) {
    fail("This deal already has a freelancer.");
  }
  await prisma.deal.update({
    where: { id: invite.dealId },
    data: { freelancerId: user.id },
  });
  await logEvent({
    dealId: invite.dealId,
    actorId: user.id,
    type: "invite.accepted",
  });
  redirect(`/deals/${invite.dealId}`);
}

export async function submitWorkAction(milestoneId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "");
  await submitMilestone({ milestoneId, userId: user.id, body });
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });
  if (milestone) revalidatePath(`/deals/${milestone.dealId}`);
}

export async function approveAction(milestoneId: string) {
  const user = await requireUser();
  await releaseMilestone({
    milestoneId,
    actorId: user.id,
    reason: "approved",
  });
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });
  if (milestone) revalidatePath(`/deals/${milestone.dealId}`);
}

export async function disputeAction(milestoneId: string, formData: FormData) {
  const user = await requireUser();
  const reason = String(formData.get("reason") ?? "");
  await disputeMilestone({ milestoneId, userId: user.id, reason });
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });
  if (milestone) revalidatePath(`/deals/${milestone.dealId}`);
}

export async function addEvidenceAction(milestoneId: string, formData: FormData) {
  const user = await requireUser();
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { deal: true },
  });
  if (!milestone) fail("Milestone not found.");
  if (
    milestone.deal.clientId !== user.id &&
    milestone.deal.freelancerId !== user.id
  ) {
    fail("Not a party on this deal.");
  }
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");
  let filePath: string | null = null;
  let fileName: string | null = null;
  if (file && file instanceof File && file.size > 0) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = path.join(process.cwd(), "uploads", milestone.id);
    await mkdir(dir, { recursive: true });
    const stored = `${Date.now()}-${safe}`;
    await writeFile(
      path.join(dir, stored),
      Buffer.from(await file.arrayBuffer()),
    );
    filePath = `${milestone.id}/${stored}`;
    fileName = file.name;
  }
  if (!body && !filePath) fail("Add a comment or a file.");
  await prisma.evidence.create({
    data: {
      milestoneId,
      userId: user.id,
      kind: filePath ? "file" : "comment",
      body,
      filePath,
      fileName,
    },
  });
  await logEvent({
    dealId: milestone.dealId,
    milestoneId,
    actorId: user.id,
    type: "evidence.added",
    payload: { kind: filePath ? "file" : "comment" },
  });
  revalidatePath(`/deals/${milestone.dealId}`);
  revalidatePath(`/deals/${milestone.dealId}/milestones/${milestoneId}`);
}

export async function refundAction(milestoneId: string) {
  const user = await requireUser();
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { deal: true },
  });
  if (!milestone) fail("Milestone not found.");
  if (milestone.deal.clientId !== user.id) {
    fail("Only the client can request a refund.");
  }
  if (!(await canClientRefund(milestone))) {
    fail(
      "Refund is only available after the due date if work was never submitted.",
    );
  }
  if (!milestone.razorpayPaymentId) {
    fail("No captured payment to refund.");
  }
  const razorpay = getRazorpay();
  if (!razorpay) {
    fail("Razorpay keys are not set.");
  }
  await razorpay.payments.refund(milestone.razorpayPaymentId, {
    amount: milestone.amountPaise,
  });
  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { status: MILESTONE_STATUS.refunded },
  });
  await logEvent({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    actorId: user.id,
    type: "milestone.refunded",
  });
  revalidatePath(`/deals/${milestone.dealId}`);
}

