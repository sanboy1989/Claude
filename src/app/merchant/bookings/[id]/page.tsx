import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { setBookingStatus } from "@/actions/bookingActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatDatetime, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function MerchantBookingDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id, merchantId: session.merchantId },
    include: { service: true, customer: true, merchant: true },
  });

  if (!booking) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/merchant/bookings" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 返回所有預約
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>預約詳情</CardTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">客戶</p>
              <p className="font-medium">{booking.customer.name ?? "未設名稱"}</p>
              <p className="text-neutral-600">{booking.customer.email}</p>
            </div>
            <div>
              <p className="text-neutral-500">服務</p>
              <p className="font-medium">{booking.service.name}</p>
              <p className="text-neutral-600">{booking.service.durationMins} 分鐘</p>
            </div>
            <div>
              <p className="text-neutral-500">預約時間</p>
              <p className="font-medium">{formatDatetime(booking.startAt, booking.merchant.timezone)}</p>
            </div>
            <div>
              <p className="text-neutral-500">費用</p>
              <p className="font-medium">{formatCurrency(booking.totalPrice.toString(), booking.currency)}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="text-sm border-t border-neutral-100 pt-4">
              <p className="text-neutral-500">客戶備註</p>
              <p className="mt-1">{booking.notes}</p>
            </div>
          )}

          {booking.cancelReason && (
            <div className="text-sm border-t border-neutral-100 pt-4">
              <p className="text-neutral-500">取消原因</p>
              <p className="mt-1 text-red-600">{booking.cancelReason}</p>
            </div>
          )}

          {booking.status === "PENDING" && (
            <div className="border-t border-neutral-100 pt-4 flex gap-3">
              <form action={setBookingStatus.bind(null, booking.id, "CONFIRMED", undefined)}>
                <Button type="submit">確認預約</Button>
              </form>
              <form action={setBookingStatus.bind(null, booking.id, "CANCELLED", "商戶拒絕")}>
                <Button type="submit" variant="destructive">拒絕</Button>
              </form>
            </div>
          )}

          {booking.status === "CONFIRMED" && (
            <div className="border-t border-neutral-100 pt-4 flex gap-3">
              <form action={setBookingStatus.bind(null, booking.id, "COMPLETED", undefined)}>
                <Button type="submit" variant="secondary">標記完成</Button>
              </form>
              <form action={setBookingStatus.bind(null, booking.id, "NO_SHOW", undefined)}>
                <Button type="submit" variant="outline">缺席</Button>
              </form>
              <form action={setBookingStatus.bind(null, booking.id, "CANCELLED", "商戶取消")}>
                <Button type="submit" variant="destructive">取消</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
