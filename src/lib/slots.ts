import { prisma } from "./prisma";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  parseISO,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
} from "date-fns";

export type Slot = {
  startAt: Date;
  endAt: Date;
};

type Interval = {
  start: Date;
  end: Date;
};

function parseTimeToDate(
  dateInTz: Date,
  timeStr: string,
  timezone: string
): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Build the time in merchant's timezone
  const zonedDate = toZonedTime(dateInTz, timezone);
  const adjusted = setMilliseconds(
    setSeconds(setMinutes(setHours(zonedDate, hours), minutes), 0),
    0
  );
  // Convert back to UTC
  return fromZonedTime(adjusted, timezone);
}

function subtractIntervals(
  available: Interval[],
  blocked: Interval[]
): Interval[] {
  let result = [...available];
  for (const block of blocked) {
    const newResult: Interval[] = [];
    for (const avail of result) {
      if (!areIntervalsOverlapping(avail, block, { inclusive: false })) {
        newResult.push(avail);
      } else {
        // Before the block
        if (isBefore(avail.start, block.start)) {
          newResult.push({ start: avail.start, end: block.start });
        }
        // After the block
        if (isAfter(avail.end, block.end)) {
          newResult.push({ start: block.end, end: avail.end });
        }
      }
    }
    result = newResult;
  }
  return result;
}

function chunkIntoSlots(
  intervals: Interval[],
  durationMins: number
): Slot[] {
  const slots: Slot[] = [];
  for (const interval of intervals) {
    let cursor = interval.start;
    while (true) {
      const slotEnd = addMinutes(cursor, durationMins);
      if (isAfter(slotEnd, interval.end)) break;
      slots.push({ startAt: cursor, endAt: slotEnd });
      cursor = slotEnd;
    }
  }
  return slots;
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export async function getAvailableSlots(params: {
  merchantId: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD" in merchant's local timezone
  merchantTimezone: string;
}): Promise<Slot[]> {
  const { merchantId, serviceId, date, merchantTimezone } = params;

  // Parse the date in the merchant's timezone
  const localDate = toZonedTime(parseISO(date), merchantTimezone);
  const dayOfWeekNum = localDate.getDay(); // 0=Sun, 1=Mon, ...

  // Find the day name
  const dayName = Object.entries(DAY_MAP).find(
    ([, num]) => num === dayOfWeekNum
  )?.[0];
  if (!dayName) return [];

  // Load service
  const service = await prisma.service.findUnique({
    where: { id: serviceId, merchantId, isActive: true },
  });
  if (!service) return [];

  // Load availability rule for this day
  const rule = await prisma.availabilityRule.findUnique({
    where: {
      merchantId_dayOfWeek: {
        merchantId,
        dayOfWeek: dayName as never,
      },
    },
  });
  if (!rule || !rule.isActive) return [];

  // Build availability window in UTC
  const windowStart = parseTimeToDate(localDate, rule.startTime, merchantTimezone);
  const windowEnd = parseTimeToDate(localDate, rule.endTime, merchantTimezone);

  if (!isBefore(windowStart, windowEnd)) return [];

  let freeIntervals: Interval[] = [{ start: windowStart, end: windowEnd }];

  // Load blocked periods overlapping this day
  const blockedPeriods = await prisma.blockedPeriod.findMany({
    where: {
      merchantId,
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
    },
  });

  const blockedIntervals: Interval[] = blockedPeriods.map((b) => ({
    start: b.startAt,
    end: b.endAt,
  }));
  freeIntervals = subtractIntervals(freeIntervals, blockedIntervals);

  // Load existing bookings (PENDING or CONFIRMED) overlapping this window
  const existingBookings = await prisma.booking.findMany({
    where: {
      merchantId,
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const bookingIntervals: Interval[] = existingBookings.map((b) => ({
    start: b.startAt,
    end: b.endAt,
  }));
  freeIntervals = subtractIntervals(freeIntervals, bookingIntervals);

  // Chunk into slots of durationMins
  return chunkIntoSlots(freeIntervals, service.durationMins);
}
