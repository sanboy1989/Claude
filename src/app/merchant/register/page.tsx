import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MerchantRegisterForm } from "@/components/merchant/MerchantRegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MerchantRegisterPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (session.role === "MERCHANT") redirect("/merchant/dashboard");
  if (session.role === "PLATFORM_ADMIN") redirect("/admin");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">登記成為商戶</CardTitle>
          <CardDescription>
            填寫你的商業資料，開始接受預約
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantRegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
