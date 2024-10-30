'use client'

import { ThemeProvider } from '@/lib/theme-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background antialiased">
        {children}
      </div>
    </ThemeProvider>
  )
} 