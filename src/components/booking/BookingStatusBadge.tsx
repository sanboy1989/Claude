import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/generated/prisma";

const statusConfig: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" }> = {
  PENDING: { label: "待確認", variant: "warning" },
  CONFIRMED: { label: "已確認", variant: "success" },
  CANCELLED: { label: "已取消", variant: "destructive" },
  COMPLETED: { label: "已完成", variant: "secondary" },
  NO_SHOW: { label: "缺席", variant: "default" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
