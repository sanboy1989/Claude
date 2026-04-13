import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AvailabilityEditor } from "@/components/merchant/AvailabilityEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OnboardingAvailabilityPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const rules = await prisma.availabilityRule.findMany({
    where: { merchantId: session.merchantId },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <span className="font-semibold text-neutral-900">步驟 3/3</span>
        <span>›</span>
        <span>設定時間表</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>設定服務時間</CardTitle>
          <CardDescription>選擇每星期哪幾天提供服務，以及開始和結束時間</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvailabilityEditor
            initialRules={rules.map((r) => ({
              dayOfWeek: r.dayOfWeek as never,
              startTime: r.startTime,
              endTime: r.endTime,
              isActive: r.isActive,
            }))}
          />

          <div className="border-t border-neutral-100 pt-4">
            <Link href="/merchant/dashboard">
              <Button variant="outline" className="w-full">完成設定，進入 Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
