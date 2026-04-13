"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { MerchantStatus } from "@/generated/prisma";

type Props = {
  merchantId: string;
  currentStatus: MerchantStatus;
};

export function AdminMerchantActions({ merchantId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const updateStatus = async (status: MerchantStatus) => {
    startTransition(async () => {
      await fetch(`/api/admin/merchants/${merchantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      window.location.reload();
    });
  };

  return (
    <div className="flex gap-2">
      {currentStatus === "PENDING" && (
        <Button size="sm" onClick={() => updateStatus("ACTIVE")} disabled={isPending}>
          審核通過
        </Button>
      )}
      {currentStatus === "ACTIVE" && (
        <Button size="sm" variant="destructive" onClick={() => updateStatus("SUSPENDED")} disabled={isPending}>
          暫停
        </Button>
      )}
      {currentStatus === "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("ACTIVE")} disabled={isPending}>
          恢復
        </Button>
      )}
    </div>
  );
}
