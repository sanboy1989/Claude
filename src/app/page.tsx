import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Star, Users } from "lucide-react";

export default async function HomePage() {
  const merchantCount = await prisma.merchant.count({ where: { status: "ACTIVE" } });
  const bookingCount = await prisma.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } });

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            預約，簡單搞掂
          </h1>
          <p className="text-lg text-neutral-600 mb-8 max-w-xl mx-auto">
            瀏覽本地商戶，選擇服務，一步完成預約。無需下載App。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchants">
              <Button size="lg">立即瀏覽商戶</Button>
            </Link>
            <Link href="/merchant/register">
              <Button size="lg" variant="outline">登記商戶</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-900">{merchantCount}</p>
              <p className="text-sm text-neutral-600 mt-1">活躍商戶</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-900">{bookingCount}</p>
              <p className="text-sm text-neutral-600 mt-1">已完成預約</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-900">24/7</p>
              <p className="text-sm text-neutral-600 mt-1">隨時預約</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-900">0</p>
              <p className="text-sm text-neutral-600 mt-1">手續費</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-neutral-900 mb-10">
          點解揀 BookIt？
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: CalendarDays, title: "即時查看空檔", desc: "實時顯示可預約時間，唔怕撞期" },
            { icon: Clock, title: "隨時隨地預約", desc: "手機電腦都得，無需App，PWA技術" },
            { icon: Users, title: "多商戶平台", desc: "各行各業一站式預約，美容、醫療、教育" },
            { icon: Star, title: "商戶自主管理", desc: "商戶自設服務時段，彈性靈活" },
          ].map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-8 w-8 text-neutral-700 mb-2" />
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">你係商戶？立即免費登記</h2>
          <p className="text-neutral-400 mb-8">
            幾分鐘設定好你的服務和時間表，客人即可在線預約
          </p>
          <Link href="/merchant/register">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-neutral-900">
              免費登記商戶
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
