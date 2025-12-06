'use client'

import dynamic from 'next/dynamic'

// Dynamically import analytics components on client side only
const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false }
)

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false }
)

const CookieConsent = dynamic(
  () => import('@/components/CookieConsent'),
  { ssr: false }
)

const ReferralTracker = dynamic(
  () => import('@/components/ReferralTracker').then((mod) => mod.ReferralTracker),
  { ssr: false }
)

export function AnalyticsWrapper() {
  return (
    <>
      <ReferralTracker />
      <CookieConsent />
      <Analytics />
      <SpeedInsights />
    </>
  )
}
