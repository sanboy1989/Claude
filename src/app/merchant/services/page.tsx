import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deleteService } from "@/actions/merchant";
import { ServiceForm } from "@/components/merchant/ServiceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default async function MerchantServicesPage() {
  const session = await getSession();
  if (!session?.merchantId) redirect("/merchant/register");

  const services = await prisma.service.findMany({
    where: { merchantId: session.merchantId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">服務管理</h1>
        <Link href="/merchant/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add service form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新增服務</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceForm />
          </CardContent>
        </Card>

        {/* Existing services */}
        <div>
          <h2 className="text-base font-semibold mb-3">現有服務 ({services.length})</h2>
          {services.length === 0 ? (
            <p className="text-sm text-neutral-500">未有服務，請先新增</p>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{s.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-neutral-500">{s.durationMins} 分鐘</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(s.price.toString(), s.currency)}
                          </Badge>
                        </div>
                      </div>
                      <form action={deleteService.bind(null, s.id)}>
                        <button type="submit" className="text-neutral-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
