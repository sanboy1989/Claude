import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminMerchantActions } from "./AdminMerchantActions";

export default async function AdminPage() {
  const session = await getSession();
  if (session?.role !== "PLATFORM_ADMIN") redirect("/");

  const [merchants, bookingStats] = await Promise.all([
    prisma.merchant.findMany({
      include: { user: { select: { email: true } }, _count: { select: { bookings: true, services: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusCount = Object.fromEntries(bookingStats.map((s) => [s.status, s._count]));

  const statusBadge: Record<string, "warning" | "success" | "destructive" | "secondary"> = {
    PENDING: "warning",
    ACTIVE: "success",
    SUSPENDED: "destructive",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">平台管理</h1>

      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "商戶總數", count: merchants.length },
          { label: "待審核商戶", count: merchants.filter((m) => m.status === "PENDING").length },
          { label: "今日預約", count: statusCount["PENDING"] ?? 0 },
          { label: "已完成預約", count: statusCount["COMPLETED"] ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold">{s.count}</p>
              <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Merchants table */}
      <Card>
        <CardHeader>
          <CardTitle>商戶列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-neutral-100">
            {merchants.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-neutral-500">{m.user.email}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {m._count.services} 服務 · {m._count.bookings} 預約
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge[m.status] ?? "secondary"}>
                    {m.status === "PENDING" ? "待審核" : m.status === "ACTIVE" ? "活躍" : "已暫停"}
                  </Badge>
                  <AdminMerchantActions merchantId={m.id} currentStatus={m.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
