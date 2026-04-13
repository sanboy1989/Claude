"use client";

import { useState } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import type { Slot } from "@/lib/slots";

type SlotData = { startAt: string; endAt: string };

type Props = {
  merchantId: string;
  serviceId: string;
  merchantTimezone: string;
  onSelect: (slot: SlotData) => void;
};

export function SlotPicker({ merchantId, serviceId, merchantTimezone, onSelect }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async (date: Date) => {
    setLoading(true);
    setSlots([]);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(
        `/api/merchants/${merchantId}/slots?serviceId=${serviceId}&date=${dateStr}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  // Generate next 14 days
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <div className="space-y-4">
      {/* Date strip */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">選擇日期</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => {
            const isSelected = format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            return (
              <button
                key={d.toISOString()}
                onClick={() => handleDateChange(d)}
                className={`flex flex-col items-center min-w-[56px] rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <span className="text-xs">{format(d, "EEE", { locale: zhTW })}</span>
                <span className="font-semibold">{format(d, "d")}</span>
                <span className="text-xs">{format(d, "MMM", { locale: zhTW })}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">
          {format(selectedDate, "MM月dd日 (EEEE)", { locale: zhTW })} 可用時段
        </p>
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">
            此日無可用時段，請選擇其他日期
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.startAt}
                onClick={() => onSelect(slot)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                {formatTime(slot.startAt, merchantTimezone)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
