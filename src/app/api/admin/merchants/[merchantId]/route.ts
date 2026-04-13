import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const session = await getSession();
  if (session?.role !== "PLATFORM_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { merchantId } = await params;
  const { status } = await request.json();

  if (!["ACTIVE", "SUSPENDED", "PENDING"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { status },
  });

  return Response.json({ merchant });
}
