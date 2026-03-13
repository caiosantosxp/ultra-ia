import { prisma } from '@/lib/prisma'

export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

export async function checkAndIncrementDailyUsage(
  userId: string,
  limit = 100,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const date = getTodayUTC()

  // Use a transaction to ensure the read-check-increment is atomic.
  // This prevents the race condition where two concurrent requests both read
  // count < limit and both increment past the limit.
  return prisma.$transaction(async (tx) => {
    await tx.dailyUsage.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, count: 0 },
      update: {},
    })

    const usage = await tx.dailyUsage.findUniqueOrThrow({
      where: { userId_date: { userId, date } },
    })

    if (usage.count >= limit) {
      return { allowed: false, current: usage.count, limit }
    }

    const updated = await tx.dailyUsage.update({
      where: { userId_date: { userId, date } },
      data: { count: { increment: 1 } },
    })

    return { allowed: true, current: updated.count, limit }
  })
}

export async function getDailyUsage(
  userId: string,
): Promise<{ current: number; limit: number }> {
  const date = getTodayUTC()

  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId, date } },
  })

  return { current: usage?.count ?? 0, limit: 100 }
}
