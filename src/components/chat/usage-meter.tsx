'use client'

import useSWR from 'swr'

interface UsageData {
  current: number
  limit: number
  resetAt: string
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((r) => r.data as UsageData)

export function UsageMeter() {
  const { data, isLoading } = useSWR<UsageData>('/api/user/usage', fetcher, { refreshInterval: 30_000 })

  if (isLoading) {
    return <div className="h-4 w-16 animate-pulse rounded bg-muted" aria-busy="true" />
  }

  const current = data?.current ?? 0
  const limit = data?.limit ?? 100

  const colorClass =
    current >= limit
      ? 'text-destructive'
      : current >= limit * 0.9
        ? 'text-amber-500'
        : 'text-muted-foreground'

  return (
    <div
      role="status"
      aria-label={`${current} sur ${limit} messages aujourd'hui`}
      className={`flex items-center gap-1 text-xs ${colorClass}`}
    >
      <span>
        {current}/{limit}
      </span>
      <span className="hidden sm:inline">messages</span>
    </div>
  )
}

export function useUsageLimit(): { isLimitReached: boolean; current: number; limit: number } {
  const { data } = useSWR<UsageData>('/api/user/usage', fetcher, { refreshInterval: 30_000 })
  return {
    isLimitReached: (data?.current ?? 0) >= (data?.limit ?? 100),
    current: data?.current ?? 0,
    limit: data?.limit ?? 100,
  }
}
