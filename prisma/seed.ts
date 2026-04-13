// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // Create platform admin
  const passwordHash = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bookit.hk" },
    update: {},
    create: {
      email: "admin@bookit.hk",
      name: "Platform Admin",
      passwordHash,
      role: "PLATFORM_ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  // Create demo merchant
  const merchantUser = await prisma.user.upsert({
    where: { email: "demo@bookit.hk" },
    update: {},
    create: {
      email: "demo@bookit.hk",
      name: "Demo Merchant",
      passwordHash: await bcrypt.hash("demo123456", 12),
      role: "MERCHANT",
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      slug: "demo-beauty-salon",
      name: "Demo 美容院",
      description: "提供專業美容護理服務，包括護膚、美甲及美容諮詢。",
      phone: "2345 6789",
      address: "香港九龍旺角彌敦道123號2樓",
      timezone: "Asia/Hong_Kong",
      status: "ACTIVE",
    },
  });

  // Create services
  const services = [
    { name: "基本護膚", description: "60分鐘基本護膚療程", durationMins: 60, price: 350 },
    { name: "深層清潔", description: "90分鐘深層清潔療程", durationMins: 90, price: 580 },
    { name: "美容諮詢", description: "30分鐘個人美容諮詢", durationMins: 30, price: 150 },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: {
        id: (
          await prisma.service.findFirst({
            where: { merchantId: merchant.id, name: s.name },
          })
        )?.id ?? "new",
      },
      update: {},
      create: {
        merchantId: merchant.id,
        ...s,
        price: s.price,
        currency: "HKD",
      },
    });
  }

  // Create availability rules (Mon-Sat)
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
  for (const day of days) {
    await prisma.availabilityRule.upsert({
      where: {
        merchantId_dayOfWeek: { merchantId: merchant.id, dayOfWeek: day },
      },
      update: {},
      create: {
        merchantId: merchant.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "19:00",
        isActive: true,
      },
    });
  }

  console.log("Demo merchant created:", merchant.slug);
  console.log("\n=== Login credentials ===");
  console.log("Admin: admin@bookit.hk / admin123456");
  console.log("Demo Merchant: demo@bookit.hk / demo123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
