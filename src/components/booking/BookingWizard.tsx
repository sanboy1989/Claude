"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { createBooking } from "@/actions/booking";
import { SlotPicker } from "./SlotPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDatetime } from "@/lib/utils";
import { CheckCircle, ChevronLeft } from "lucide-react";

type Service = {
  id: string;
  name: string;
  durationMins: number;
  price: string;
  currency: string;
  description?: string | null;
};

type Props = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  merchantTimezone: string;
  services: Service[];
  initialServiceId?: string;
};

type SlotData = { startAt: string; endAt: string };

type Step = "service" | "slot" | "confirm" | "done";

export function BookingWizard({
  merchantId,
  merchantSlug,
  merchantName,
  merchantTimezone,
  services,
  initialServiceId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialServiceId ? "slot" : "service");
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialServiceId ? (services.find((s) => s.id === initialServiceId) ?? null) : null
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [notes, setNotes] = useState("");

  const [state, action, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const result = await createBooking(prevState as never, formData);
      if (result?.bookingId) {
        setStep("done");
      }
      return result;
    },
    undefined
  );

  if (step === "done") {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold">預約成功！</h2>
        <p className="text-neutral-600">
          你的預約已提交，商戶確認後會通知你。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Button onClick={() => router.push("/dashboard")}>查看我的預約</Button>
          <Button variant="outline" onClick={() => router.push(`/merchants/${merchantSlug}`)}>
            返回商戶頁面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        {["service", "slot", "confirm"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <span>›</span>}
            <span className={step === s ? "font-semibold text-neutral-900" : ""}>
              {i === 0 ? "選服務" : i === 1 ? "選時間" : "確認"}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select service */}
      {step === "service" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">選擇服務</h2>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => { setSelectedService(service); setStep("slot"); }}
              className="w-full text-left border border-neutral-200 rounded-lg p-4 hover:border-neutral-900 transition-colors bg-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-neutral-600 mt-1">{service.description}</p>
                  )}
                  <p className="text-sm text-neutral-500 mt-1">{service.durationMins} 分鐘</p>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(service.price, service.currency)}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Pick slot */}
      {step === "slot" && selectedService && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("service")} className="text-neutral-500 hover:text-neutral-900">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {selectedService.name} — 選擇時間
            </h2>
          </div>
          <SlotPicker
            merchantId={merchantId}
            serviceId={selectedService.id}
            merchantTimezone={merchantTimezone}
            onSelect={(slot) => { setSelectedSlot(slot); setStep("confirm"); }}
          />
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedService && selectedSlot && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("slot")} className="text-neutral-500 hover:text-neutral-900">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">確認預約</h2>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-white">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">商戶</span>
              <span className="font-medium">{merchantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">服務</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">時間</span>
              <span className="font-medium">
                {formatDatetime(selectedSlot.startAt, merchantTimezone)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">時長</span>
              <span className="font-medium">{selectedService.durationMins} 分鐘</span>
            </div>
            <div className="border-t border-neutral-100 pt-3 flex justify-between">
              <span className="font-medium">總費用</span>
              <span className="font-bold">
                {formatCurrency(selectedService.price, selectedService.currency)}
              </span>
            </div>
          </div>

          <form action={action} className="space-y-4">
            <input type="hidden" name="merchantId" value={merchantId} />
            <input type="hidden" name="serviceId" value={selectedService.id} />
            <input type="hidden" name="startAt" value={selectedSlot.startAt} />

            <div className="space-y-2">
              <Label htmlFor="notes">備註（可選）</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="有咩特別要求？"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {state?.message && (
              <p className="text-sm text-red-600">{state.message}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? "提交中..." : "確認預約"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
