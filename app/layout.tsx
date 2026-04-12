import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Job Sim AI | 직무 역량 강화 플랫폼',
  description: 'AI와 함께하는 실전 직무 롤플레이 시뮬레이터',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
