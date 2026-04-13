"use client";

import { useActionState } from "react";
import { createService } from "@/actions/merchant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
};

export function ServiceForm({ onSuccess }: Props) {
  const [state, action, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createService(prev as never, formData);
      if (!result?.errors && result?.message === "Service created successfully") {
        onSuccess?.();
      }
      return result;
    },
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">服務名稱 *</Label>
        <Input id="name" name="name" placeholder="例：剪髮" required />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">服務描述</Label>
        <Textarea id="description" name="description" placeholder="詳細描述此服務..." rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationMins">時長（分鐘）*</Label>
          <select
            id="durationMins"
            name="durationMins"
            defaultValue="60"
            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            {[15, 30, 45, 60, 90, 120].map((d) => (
              <option key={d} value={d}>{d} 分鐘</option>
            ))}
          </select>
          {state?.errors?.durationMins && (
            <p className="text-sm text-red-600">{state.errors.durationMins[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">價格 (HKD) *</Label>
          <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="0.00" required />
          {state?.errors?.price && (
            <p className="text-sm text-red-600">{state.errors.price[0]}</p>
          )}
        </div>
      </div>

      <input type="hidden" name="currency" value="HKD" />
      <input type="hidden" name="maxBookingsPerSlot" value="1" />

      {state?.message && state.message !== "Service created successfully" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state?.message === "Service created successfully" && (
        <p className="text-sm text-green-600">✓ 服務已新增</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "新增中..." : "新增服務"}
      </Button>
    </form>
  );
}
