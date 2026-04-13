"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BlockedPeriodSchema } from "@/lib/validations";

export async function addBlockedPeriodAction(formData: FormData) {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  const validated = BlockedPeriodSchema.safeParse({
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    reason: formData.get("reason"),
  });

  if (!validated.success) return;

  // Convert datetime-local format to ISO
  const startAt = new Date(validated.data.startAt);
  const endAt = new Date(validated.data.endAt);

  await prisma.blockedPeriod.create({
    data: {
      merchantId: session.merchantId,
      startAt,
      endAt,
      reason: validated.data.reason,
    },
  });

  revalidatePath("/merchant/availability");
}

export async function removeBlockedPeriodAction(id: string) {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  await prisma.blockedPeriod.deleteMany({
    where: { id, merchantId: session.merchantId },
  });

  revalidatePath("/merchant/availability");
}
