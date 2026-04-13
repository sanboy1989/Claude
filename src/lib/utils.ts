import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency = "HKD"
): string {
  return new Intl.NumberFormat("zh-HK", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export function formatDatetime(date: Date | string, timezone?: string): string {
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone ?? "Asia/Hong_Kong",
  }).format(new Date(date));
}

export function formatTime(date: Date | string, timezone?: string): string {
  return new Intl.DateTimeFormat("zh-HK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone ?? "Asia/Hong_Kong",
  }).format(new Date(date));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
