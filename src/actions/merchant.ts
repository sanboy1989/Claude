"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, updateSession } from "@/lib/session";
import {
  MerchantSchema,
  ServiceSchema,
  AvailabilityRuleSchema,
  BlockedPeriodSchema,
} from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import type { FormState } from "./auth";

export async function createMerchant(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const validated = MerchantSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    timezone: formData.get("timezone") || "Asia/Hong_Kong",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, description, phone, address, timezone } = validated.data;

  // Check if user already has a merchant profile
  const existing = await prisma.merchant.findUnique({
    where: { userId: session.userId },
  });
  if (existing) {
    return { message: "You already have a merchant profile" };
  }

  let slug = generateSlug(name);
  // Ensure slug is unique
  const slugExists = await prisma.merchant.findUnique({ where: { slug } });
  if (slugExists) {
    slug = `${slug}-${Date.now()}`;
  }

  const merchant = await prisma.merchant.create({
    data: {
      userId: session.userId,
      slug,
      name,
      description,
      phone,
      address,
      timezone,
    },
  });

  // Update user role to MERCHANT
  await prisma.user.update({
    where: { id: session.userId },
    data: { role: "MERCHANT" },
  });

  // Update session with new role and merchantId
  await updateSession({ role: "MERCHANT", merchantId: merchant.id });

  redirect("/merchant/onboarding/services");
}

export async function createService(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  const validated = ServiceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMins: Number(formData.get("durationMins")),
    price: Number(formData.get("price")),
    currency: formData.get("currency") || "HKD",
    maxBookingsPerSlot: Number(formData.get("maxBookingsPerSlot") || 1),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.service.create({
    data: {
      merchantId: session.merchantId,
      ...validated.data,
      price: validated.data.price,
    },
  });

  revalidatePath("/merchant/services");
  return { message: "Service created successfully" };
}

export async function updateService(
  serviceId: string,
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  const validated = ServiceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMins: Number(formData.get("durationMins")),
    price: Number(formData.get("price")),
    currency: formData.get("currency") || "HKD",
    maxBookingsPerSlot: Number(formData.get("maxBookingsPerSlot") || 1),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.service.update({
    where: { id: serviceId, merchantId: session.merchantId },
    data: { ...validated.data, price: validated.data.price },
  });

  revalidatePath("/merchant/services");
  return { message: "Service updated successfully" };
}

export async function deleteService(serviceId: string) {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  await prisma.service.update({
    where: { id: serviceId, merchantId: session.merchantId },
    data: { isActive: false },
  });

  revalidatePath("/merchant/services");
}

export async function saveAvailabilityRules(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  const rulesJson = formData.get("rules");
  if (!rulesJson) return { message: "No rules provided" };

  let parsedRules;
  try {
    parsedRules = JSON.parse(rulesJson as string);
  } catch {
    return { message: "Invalid rules format" };
  }

  const validated = AvailabilityRuleSchema.safeParse({ rules: parsedRules });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // Upsert each rule
  await Promise.all(
    validated.data.rules.map((rule) =>
      prisma.availabilityRule.upsert({
        where: {
          merchantId_dayOfWeek: {
            merchantId: session.merchantId!,
            dayOfWeek: rule.dayOfWeek as never,
          },
        },
        create: {
          merchantId: session.merchantId!,
          dayOfWeek: rule.dayOfWeek as never,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        },
        update: {
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        },
      })
    )
  );

  revalidatePath("/merchant/availability");
  return { message: "Availability updated successfully" };
}

export async function addBlockedPeriod(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  const validated = BlockedPeriodSchema.safeParse({
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    reason: formData.get("reason"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.blockedPeriod.create({
    data: {
      merchantId: session.merchantId,
      startAt: new Date(validated.data.startAt),
      endAt: new Date(validated.data.endAt),
      reason: validated.data.reason,
    },
  });

  revalidatePath("/merchant/availability");
  return { message: "Blocked period added" };
}

export async function removeBlockedPeriod(id: string) {
  const session = await getSession();
  if (!session?.merchantId) redirect("/auth/signin");

  await prisma.blockedPeriod.deleteMany({
    where: { id, merchantId: session.merchantId },
  });

  revalidatePath("/merchant/availability");
}
