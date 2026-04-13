import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AvailabilityEditor } from "@/components/merchant/AvailabilityEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addBlockedPeriodAction, removeBlockedPeriodAction } from "@/actions/availabilityActions";
import { formatDatetime } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default async function MerchantAvailabilityPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const [rules, blockedPeriods, merchant] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { merchantId: session.merchantId } }),
    prisma.blockedPeriod.findMany({
      where: { merchantId: session.merchantId, endAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
    }),
    prisma.merchant.findUnique({ where: { id: session.merchantId }, select: { timezone: true } }),
  ]);

  const tz = merchant?.timezone ?? "Asia/Hong_Kong";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">時間表設定</h1>
        <Link href="/merchant/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {/* Weekly schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">每週服務時間</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityEditor
              initialRules={rules.map((r) => ({
                dayOfWeek: r.dayOfWeek as never,
                startTime: r.startTime,
                endTime: r.endTime,
                isActive: r.isActive,
              }))}
            />
          </CardContent>
        </Card>

        {/* Blocked periods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">封鎖時段（假期/臨時休息）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addBlockedPeriodAction} className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-600 block mb-1">開始時間</label>
                <input
                  type="datetime-local"
                  name="startAt"
                  required
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 block mb-1">結束時間</label>
                <input
                  type="datetime-local"
                  name="endAt"
                  required
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  name="reason"
                  placeholder="原因（可選）"
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                />
              </div>
              <Button type="submit" className="col-span-2" variant="outline">新增封鎖時段</Button>
            </form>

            {blockedPeriods.length > 0 && (
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                {blockedPeriods.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm border border-neutral-100 rounded-md px-3 py-2">
                    <div>
                      <p className="text-neutral-600">{formatDatetime(b.startAt, tz)} → {formatDatetime(b.endAt, tz)}</p>
                      {b.reason && <p className="text-xs text-neutral-400">{b.reason}</p>}
                    </div>
                    <form action={removeBlockedPeriodAction.bind(null, b.id)}>
                      <button type="submit" className="text-neutral-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
