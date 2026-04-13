import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cancelBooking } from "@/actions/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatDatetime, formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export default async function CustomerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.userId },
    include: { service: true, merchant: true },
    orderBy: { startAt: "desc" },
    take: 30,
  });

  const upcoming = bookings.filter(
    (b) => b.startAt > new Date() && b.status !== "CANCELLED"
  );
  const past = bookings.filter(
    (b) => b.startAt <= new Date() || b.status === "CANCELLED"
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">我的預約</h1>
      <p className="text-neutral-600 mb-8">管理你的所有預約</p>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          即將到來 ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-neutral-500">
              <p>暫無即將到來的預約</p>
              <Link href="/merchants" className="mt-4 inline-block">
                <Button variant="outline">瀏覽商戶</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcoming.map((b) => (
              <Card key={b.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{b.merchant.name}</p>
                      <p className="text-neutral-600 text-sm">{b.service.name}</p>
                      <p className="text-neutral-500 text-sm mt-1">
                        {formatDatetime(b.startAt, b.merchant.timezone)}
                      </p>
                      <p className="text-neutral-500 text-sm">
                        {formatCurrency(b.totalPrice.toString(), b.currency)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <BookingStatusBadge status={b.status} />
                      {b.status === "PENDING" || b.status === "CONFIRMED" ? (
                        <form action={cancelBooking.bind(null, b.id, "客戶取消")}>
                          <Button type="submit" size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            取消
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  {b.notes && (
                    <p className="text-xs text-neutral-400 mt-2 border-t border-neutral-50 pt-2">
                      備註: {b.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">過往記錄</h2>
          <div className="space-y-3">
            {past.map((b) => (
              <Card key={b.id} className="opacity-70">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{b.merchant.name} — {b.service.name}</p>
                      <p className="text-neutral-500">{formatDatetime(b.startAt, b.merchant.timezone)}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
