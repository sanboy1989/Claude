import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone } from "lucide-react";

export default async function MerchantsPage() {
  const merchants = await prisma.merchant.findMany({
    where: { status: "ACTIVE" },
    include: { services: { where: { isActive: true }, take: 3 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">所有商戶</h1>
      <p className="text-neutral-600 mb-8">選擇服務商，開始預約</p>

      {merchants.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <p>暫時未有商戶，請稍後再來</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((m) => (
            <Link key={m.id} href={`/merchants/${m.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                {m.logoUrl && (
                  <div className="h-40 bg-neutral-100 rounded-t-xl overflow-hidden">
                    <img src={m.logoUrl} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{m.name}</CardTitle>
                  {m.description && (
                    <CardDescription className="line-clamp-2">{m.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {m.address && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{m.address}</span>
                    </div>
                  )}
                  {m.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="h-4 w-4 shrink-0" />
                      {m.phone}
                    </div>
                  )}
                  {m.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.services.map((s) => (
                        <Badge key={s.id} variant="secondary">{s.name}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
