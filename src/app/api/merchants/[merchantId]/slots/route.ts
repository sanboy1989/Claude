import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;
  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!serviceId || !date) {
    return Response.json({ error: "Missing serviceId or date" }, { status: 400 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId, status: "ACTIVE" },
    select: { timezone: true },
  });

  if (!merchant) {
    return Response.json({ error: "Merchant not found" }, { status: 404 });
  }

  const slots = await getAvailableSlots({
    merchantId,
    serviceId,
    date,
    merchantTimezone: merchant.timezone,
  });

  return Response.json({
    slots: slots.map((s) => ({
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
    })),
  });
}
