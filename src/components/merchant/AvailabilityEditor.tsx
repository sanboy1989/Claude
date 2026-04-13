"use client";

import { useState, useActionState } from "react";
import { saveAvailabilityRules } from "@/actions/merchant";
import { Button } from "@/components/ui/button";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

type Rule = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "週一" },
  { key: "TUESDAY", label: "週二" },
  { key: "WEDNESDAY", label: "週三" },
  { key: "THURSDAY", label: "週四" },
  { key: "FRIDAY", label: "週五" },
  { key: "SATURDAY", label: "週六" },
  { key: "SUNDAY", label: "週日" },
];

type Props = {
  initialRules?: Rule[];
};

export function AvailabilityEditor({ initialRules = [] }: Props) {
  const [rules, setRules] = useState<Rule[]>(
    DAYS.map((d) => {
      const existing = initialRules.find((r) => r.dayOfWeek === d.key);
      return existing ?? {
        dayOfWeek: d.key,
        startTime: "09:00",
        endTime: "18:00",
        isActive: d.key !== "SATURDAY" && d.key !== "SUNDAY",
      };
    })
  );

  const [state, action, isPending] = useActionState(saveAvailabilityRules, undefined);

  const updateRule = (dayOfWeek: DayOfWeek, changes: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => r.dayOfWeek === dayOfWeek ? { ...r, ...changes } : r));
  };

  const times = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, "0");
    const m = (i % 2 === 0 ? "00" : "30");
    return `${h}:${m}`;
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="rules" value={JSON.stringify(rules)} />

      <div className="space-y-3">
        {DAYS.map((day) => {
          const rule = rules.find((r) => r.dayOfWeek === day.key)!;
          return (
            <div key={day.key} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${rule.isActive ? "border-neutral-200 bg-white" : "border-neutral-100 bg-neutral-50"}`}>
              <div className="flex items-center gap-3 w-16">
                <input
                  type="checkbox"
                  id={day.key}
                  checked={rule.isActive}
                  onChange={(e) => updateRule(day.key, { isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label htmlFor={day.key} className={`text-sm font-medium ${rule.isActive ? "text-neutral-900" : "text-neutral-400"}`}>
                  {day.label}
                </label>
              </div>

              {rule.isActive ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={rule.startTime}
                    onChange={(e) => updateRule(day.key, { startTime: e.target.value })}
                    className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {times.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-neutral-500 text-sm">至</span>
                  <select
                    value={rule.endTime}
                    onChange={(e) => updateRule(day.key, { endTime: e.target.value })}
                    className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {times.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-neutral-400">休息</span>
              )}
            </div>
          );
        })}
      </div>

      {state?.message && (
        <p className={`text-sm ${state.message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {state.message === "Availability updated successfully" ? "✓ 時間表已儲存" : state.message}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "儲存中..." : "儲存時間表"}
      </Button>
    </form>
  );
}
