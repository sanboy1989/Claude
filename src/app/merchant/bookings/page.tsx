import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatDatetime } from "@/lib/utils";

export default async function MerchantBookingsPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const bookings = await prisma.booking.findMany({
    where: { merchantId: session.merchantId },
    include: { service: true, customer: true },
    orderBy: { startAt: "desc" },
    take: 50,
  });

  const merchant = await prisma.merchant.findUnique({
    where: { id: session.merchantId },
    select: { timezone: true },
  });

  const tz = merchant?.timezone ?? "Asia/Hong_Kong";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">所有預約</h1>
        <Link href="/merchant/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 返回 Dashboard
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          {bookings.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">暫無預約記錄</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {bookings.map((b) => (
                <Link key={b.id} href={`/merchant/bookings/${b.id}`}>
                  <div className="flex items-center justify-between py-4 hover:bg-neutral-50 -mx-6 px-6 cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">{b.customer.name ?? b.customer.email}</p>
                      <p className="text-sm text-neutral-500">{b.service.name}</p>
                      <p className="text-xs text-neutral-400">{formatDatetime(b.startAt, tz)}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
