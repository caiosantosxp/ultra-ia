import { auth } from '@/lib/auth'
import { getDailyUsage } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const usage = await getDailyUsage(session.user.id)

  return Response.json({
    success: true,
    data: {
      current: usage.current,
      limit: usage.limit,
      resetAt: 'midnight UTC',
    },
  })
}
