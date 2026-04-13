"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BookingSchema, BookingStatusSchema } from "@/lib/validations";
import type { FormState } from "./auth";

export async function createBooking(
  state: FormState,
  formData: FormData
): Promise<FormState & { bookingId?: string }> {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const validated = BookingSchema.safeParse({
    merchantId: formData.get("merchantId"),
    serviceId: formData.get("serviceId"),
    startAt: formData.get("startAt"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { merchantId, serviceId, startAt: startAtStr, notes } = validated.data;
  const startAt = new Date(startAtStr);

  // Load the service to get duration and price
  const service = await prisma.service.findUnique({
    where: { id: serviceId, merchantId, isActive: true },
  });
  if (!service) {
    return { message: "Service not found" };
  }

  const endAt = addMinutes(startAt, service.durationMins);

  // Create booking in a transaction with conflict check
  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Check for conflicts
      const conflict = await tx.booking.findFirst({
        where: {
          merchantId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (conflict) {
        throw new Error("Time slot is no longer available");
      }

      return tx.booking.create({
        data: {
          merchantId,
          serviceId,
          customerId: session.userId,
          startAt,
          endAt,
          notes,
          totalPrice: service.price,
          currency: service.currency,
          status: "PENDING",
        },
      });
    });

    revalidatePath("/dashboard");
    return { message: "Booking created successfully", bookingId: booking.id };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const validated = BookingStatusSchema.safeParse({
    status: formData.get("status"),
    cancelReason: formData.get("cancelReason"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { message: "Booking not found" };

  // Only merchant can confirm/complete/no-show; customer can cancel their own
  if (
    session.role === "MERCHANT" &&
    booking.merchantId !== session.merchantId
  ) {
    return { message: "Unauthorized" };
  }
  if (session.role === "CUSTOMER" && booking.customerId !== session.userId) {
    return { message: "Unauthorized" };
  }
  if (
    session.role === "CUSTOMER" &&
    validated.data.status !== "CANCELLED"
  ) {
    return { message: "Customers can only cancel bookings" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: validated.data.status,
      cancelReason: validated.data.cancelReason,
    },
  });

  revalidatePath("/merchant/bookings");
  revalidatePath("/dashboard");
  return { message: "Booking updated" };
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  // Verify ownership
  const isOwner =
    (session.role === "CUSTOMER" && booking.customerId === session.userId) ||
    (session.role === "MERCHANT" && booking.merchantId === session.merchantId) ||
    session.role === "PLATFORM_ADMIN";

  if (!isOwner) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelReason: reason },
  });

  revalidatePath("/merchant/bookings");
  revalidatePath("/dashboard");
}
