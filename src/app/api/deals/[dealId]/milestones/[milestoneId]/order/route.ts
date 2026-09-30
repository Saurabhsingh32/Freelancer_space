import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { MILESTONE_STATUS } from "@/lib/money";
import { logEvent } from "@/lib/events";

export async function POST(
  _req: Request,
  context: { params: Promise<{ dealId: string; milestoneId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { dealId, milestoneId } = await context.params;
  if (!razorpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Razorpay keys are not set. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.",
      },
      { status: 400 },
    );
  }
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { deal: true },
  });
  if (!milestone || milestone.dealId !== dealId) {
    return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
  }
  if (milestone.deal.clientId !== session.user.id) {
    return NextResponse.json({ error: "Only the client can fund." }, { status: 403 });
  }
  if (milestone.status !== MILESTONE_STATUS.draft) {
    return NextResponse.json({ error: "This milestone is not awaiting funding." }, { status: 400 });
  }
  const razorpay = getRazorpay();
  if (!razorpay) {
    return NextResponse.json({ error: "Razorpay keys are not set." }, { status: 400 });
  }
  const order = await razorpay.orders.create({
    amount: milestone.amountPaise,
    currency: "INR",
    notes: {
      dealId,
      milestoneId,
    },
  });
  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { razorpayOrderId: order.id },
  });
  await logEvent({
    dealId,
    milestoneId,
    actorId: session.user.id,
    type: "order.created",
    payload: { orderId: order.id },
  });
  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    name: "Holdroom",
    description: milestone.title,
    prefill: {
      email: session.user.email,
      name: session.user.name,
    },
  });
}
