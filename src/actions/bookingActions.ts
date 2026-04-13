"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { BookingStatus } from "@/generated/prisma";

export async function setBookingStatus(bookingId: string, status: BookingStatus, cancelReason?: string) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  const isOwner =
    (session.role === "MERCHANT" && booking.merchantId === session.merchantId) ||
    (session.role === "CUSTOMER" && booking.customerId === session.userId) ||
    session.role === "PLATFORM_ADMIN";

  if (!isOwner) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status, cancelReason },
  });

  revalidatePath("/merchant/bookings");
  revalidatePath("/dashboard");
}
