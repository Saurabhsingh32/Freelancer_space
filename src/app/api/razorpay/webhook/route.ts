import { NextResponse } from "next/server";
import { markFunded } from "@/lib/milestones";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/events";
import { MILESTONE_STATUS } from "@/lib/money";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  const event = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
        };
      };
      refund?: {
        entity?: {
          payment_id?: string;
        };
      };
    };
  };

  if (event.event === "payment.captured") {
    const orderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;
    if (orderId && paymentId) {
      await markFunded({ orderId, paymentId });
    }
  }

  if (event.event === "refund.processed") {
    const paymentId = event.payload?.refund?.entity?.payment_id;
    if (paymentId) {
      const milestone = await prisma.milestone.findFirst({
        where: { razorpayPaymentId: paymentId },
      });
      if (milestone && milestone.status !== MILESTONE_STATUS.refunded) {
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: MILESTONE_STATUS.refunded },
        });
        await logEvent({
          dealId: milestone.dealId,
          milestoneId: milestone.id,
          type: "milestone.refunded",
          payload: { source: "webhook" },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
