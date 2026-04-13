import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatDatetime } from "@/lib/utils";
import { CalendarDays, Settings, Package, Clock } from "lucide-react";

export default async function MerchantDashboardPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const merchantId = session.merchantId;

  const [merchant, pendingBookings, todayBookings, totalStats] = await Promise.all([
    prisma.merchant.findUnique({ where: { id: merchantId } }),
    prisma.booking.findMany({
      where: { merchantId, status: "PENDING" },
      include: { service: true, customer: true },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.booking.findMany({
      where: {
        merchantId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: { service: true, customer: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { merchantId },
      _count: true,
    }),
  ]);

  if (!merchant) redirect("/merchant/register");

  const statusCount = Object.fromEntries(totalStats.map((s) => [s.status, s._count]));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{merchant.name}</h1>
          {merchant.status === "PENDING" && (
            <p className="text-sm text-yellow-600 mt-1">
              ⚠ 你的商戶正等待平台審核，審核後客人才可預約
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/merchant/services">
            <Button variant="outline" size="sm"><Package className="h-4 w-4 mr-1" />服務</Button>
          </Link>
          <Link href="/merchant/availability">
            <Button variant="outline" size="sm"><Clock className="h-4 w-4 mr-1" />時間表</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "待確認", count: statusCount["PENDING"] ?? 0, color: "text-yellow-600" },
          { label: "已確認", count: statusCount["CONFIRMED"] ?? 0, color: "text-green-600" },
          { label: "已完成", count: statusCount["COMPLETED"] ?? 0, color: "text-neutral-600" },
          { label: "已取消", count: statusCount["CANCELLED"] ?? 0, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                今日預約 ({todayBookings.length})
              </CardTitle>
              <Link href="/merchant/bookings" className="text-sm text-neutral-500 hover:text-neutral-900">
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-sm text-neutral-500">今日無預約</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm border-b border-neutral-50 pb-3">
                    <div>
                      <p className="font-medium">{b.customer.name ?? b.customer.email}</p>
                      <p className="text-neutral-500">{b.service.name} · {formatDatetime(b.startAt, merchant.timezone)}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">待確認預約 ({pendingBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-sm text-neutral-500">暫無待確認預約</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((b) => (
                  <Link key={b.id} href={`/merchant/bookings/${b.id}`}>
                    <div className="flex items-center justify-between text-sm border border-neutral-100 rounded-lg p-3 hover:bg-neutral-50 cursor-pointer">
                      <div>
                        <p className="font-medium">{b.customer.name ?? b.customer.email}</p>
                        <p className="text-neutral-500">{b.service.name} · {formatDatetime(b.startAt, merchant.timezone)}</p>
                      </div>
                      <Button size="sm" variant="outline">查看</Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
