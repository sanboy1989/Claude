import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) return {};
  return {
    title: `${merchant.name} | BookIt`,
    description: merchant.description ?? undefined,
  };
}

export default async function MerchantPage({ params }: Props) {
  const { slug } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      services: { where: { isActive: true } },
      availabilityRules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!merchant) notFound();

  const dayLabels: Record<string, string> = {
    MONDAY: "週一", TUESDAY: "週二", WEDNESDAY: "週三",
    THURSDAY: "週四", FRIDAY: "週五", SATURDAY: "週六", SUNDAY: "週日",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{merchant.name}</h1>
        {merchant.description && (
          <p className="text-neutral-600 mt-2">{merchant.description}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4">
          {merchant.address && (
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <MapPin className="h-4 w-4" />{merchant.address}
            </div>
          )}
          {merchant.phone && (
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <Phone className="h-4 w-4" />{merchant.phone}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Services */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">服務</h2>
          {merchant.services.length === 0 ? (
            <p className="text-neutral-500">暫時未有服務</p>
          ) : (
            <div className="space-y-4">
              {merchant.services.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        {service.description && (
                          <CardDescription className="mt-1">{service.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-4 shrink-0">
                        {formatCurrency(service.price.toString(), service.currency)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-neutral-600">
                        <Clock className="h-4 w-4" />
                        {service.durationMins} 分鐘
                      </span>
                      <Link href={`/merchants/${merchant.slug}/book?serviceId=${service.id}`}>
                        <Button size="sm">立即預約</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Availability */}
        <div>
          <h2 className="text-xl font-semibold mb-4">服務時間</h2>
          {merchant.availabilityRules.length === 0 ? (
            <p className="text-neutral-500 text-sm">未設定時間</p>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {merchant.availabilityRules.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600">{dayLabels[r.dayOfWeek]}</span>
                      <span className="font-medium">{r.startTime} – {r.endTime}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
