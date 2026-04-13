import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ServiceForm } from "@/components/merchant/ServiceForm";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function OnboardingServicesPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const services = await prisma.service.findMany({
    where: { merchantId: session.merchantId, isActive: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Progress */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <span className="font-semibold text-neutral-900">步驟 2/3</span>
        <span>›</span>
        <span>新增服務</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新增服務</CardTitle>
          <CardDescription>設定你提供的服務、時長和價格</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ServiceForm />

          {services.length > 0 && (
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <p className="text-sm font-medium text-neutral-700">已新增服務：</p>
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border border-neutral-100 rounded-md px-3 py-2">
                  <span>{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">{s.durationMins}分鐘</span>
                    <Badge variant="secondary">{formatCurrency(s.price.toString(), s.currency)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {services.length > 0 && (
            <Link href="/merchant/onboarding/availability">
              <Button className="w-full">繼續 → 設定時間表</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
