import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    const { slug } = await params;
    redirect(`/auth/signin?redirect=/merchants/${slug}/book`);
  }

  const { slug } = await params;
  const { serviceId } = await searchParams;

  const merchant = await prisma.merchant.findUnique({
    where: { slug, status: "ACTIVE" },
    include: { services: { where: { isActive: true } } },
  });

  if (!merchant) notFound();
  if (merchant.services.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>無可用服務</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600">此商戶暫時未有服務。</p>
            <Link href={`/merchants/${slug}`} className="text-sm underline mt-4 block">
              返回商戶頁面
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = merchant.services.map((s) => ({
    ...s,
    price: s.price.toString(),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <Link href={`/merchants/${slug}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 返回 {merchant.name}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>預約 {merchant.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingWizard
            merchantId={merchant.id}
            merchantSlug={slug}
            merchantName={merchant.name}
            merchantTimezone={merchant.timezone}
            services={services}
            initialServiceId={serviceId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
