import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markFunded } from "@/lib/milestones";
import { verifyCheckoutSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  const orderId = body.razorpay_order_id ?? "";
  const paymentId = body.razorpay_payment_id ?? "";
  const signature = body.razorpay_signature ?? "";
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }
  const milestone = await prisma.milestone.findFirst({
    where: { razorpayOrderId: orderId },
    include: { deal: true },
  });
  if (!milestone || milestone.deal.clientId !== session.user.id) {
    return NextResponse.json({ error: "Order not found for this client." }, { status: 404 });
  }
  await markFunded({ orderId, paymentId });
  return NextResponse.json({ ok: true, dealId: milestone.dealId });
}
