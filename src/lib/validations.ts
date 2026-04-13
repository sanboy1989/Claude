import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.email("Please enter a valid email").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const SignInSchema = z.object({
  email: z.email("Please enter a valid email").trim(),
  password: z.string().min(1, "Password is required"),
});

export const MerchantSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").trim(),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().default("Asia/Hong_Kong"),
});

export const ServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").trim(),
  description: z.string().optional(),
  durationMins: z
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes")
    .multipleOf(15, "Duration must be in 15-minute increments"),
  price: z.number().min(0, "Price must be non-negative"),
  currency: z.string().default("HKD"),
  maxBookingsPerSlot: z.number().int().min(1).default(1),
});

export const AvailabilityRuleSchema = z.object({
  rules: z.array(
    z.object({
      dayOfWeek: z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
      endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
      isActive: z.boolean(),
    })
  ),
});

export const BlockedPeriodSchema = z.object({
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  reason: z.string().optional(),
});

export const BookingSchema = z.object({
  merchantId: z.string(),
  serviceId: z.string(),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const BookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  cancelReason: z.string().optional(),
});
