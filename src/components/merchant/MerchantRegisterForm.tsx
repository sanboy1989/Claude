"use client";

import { useActionState } from "react";
import { createMerchant } from "@/actions/merchant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIMEZONES = [
  { value: "Asia/Hong_Kong", label: "香港 (HKT)" },
  { value: "Asia/Taipei", label: "台北 (CST)" },
  { value: "Asia/Shanghai", label: "上海 (CST)" },
  { value: "Asia/Tokyo", label: "東京 (JST)" },
  { value: "UTC", label: "UTC" },
];

export function MerchantRegisterForm() {
  const [state, action, isPending] = useActionState(createMerchant, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">商業名稱 *</Label>
        <Input id="name" name="name" placeholder="例：陳記美髮" required />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">業務簡介</Label>
        <Textarea id="description" name="description" placeholder="介紹你的業務..." rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">聯絡電話</Label>
        <Input id="phone" name="phone" type="tel" placeholder="例：2345 6789" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">地址</Label>
        <Input id="address" name="address" placeholder="例：九龍旺角彌敦道123號" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">時區</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue="Asia/Hong_Kong"
          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "提交中..." : "繼續 →"}
      </Button>
    </form>
  );
}
