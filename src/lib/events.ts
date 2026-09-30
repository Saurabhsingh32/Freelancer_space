import { prisma } from "@/lib/prisma";

export async function logEvent(input: {
  dealId: string;
  milestoneId?: string | null;
  actorId?: string | null;
  type: string;
  payload?: Record<string, unknown>;
}) {
  await prisma.event.create({
    data: {
      dealId: input.dealId,
      milestoneId: input.milestoneId ?? null,
      actorId: input.actorId ?? null,
      type: input.type,
      payloadJson: JSON.stringify(input.payload ?? {}),
    },
  });
}
