import { PlanType, PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const PLANS = [
  {
    name: PlanType.free,
    monthlyQuota: 1_000,
    minLimit: 1,
    maxlimit: 500,
  },
  {
    name: PlanType.starter,
    monthlyQuota: 100_000,
    minLimit: 1,
    maxlimit: 1_000,
  },
  {
    name: PlanType.pro,
    monthlyQuota: 1_000_000,
    minLimit: 1,
    maxlimit: 10_000,
  },
  {
    name: PlanType.enterprise,
    monthlyQuota: null, // unlimited
    minLimit: 1,
    maxlimit: 50_000,
  },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
