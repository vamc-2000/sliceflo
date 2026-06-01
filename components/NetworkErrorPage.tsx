'use client'

import { useEffect, useState } from 'react'
import { useNetworkStore } from '@/stores/network-store'

export default function NetworkErrorPage() {
  const [isOnline, setIsOnlineLocal] = useState(true)
  const setIsOnline = useNetworkStore((state) => state.setIsOnline)

  useEffect(() => {
    const onlineStatus = navigator.onLine
    setIsOnlineLocal(onlineStatus)
    setIsOnline(onlineStatus)

    const goOnline = () => {
      setIsOnlineLocal(true)
      setIsOnline(true)
    }
    const goOffline = () => {
      setIsOnlineLocal(false)
      setIsOnline(false)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center text-center px-6 max-w-md">

        {/* Network Icon */}
        <div className="relative mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top box */}
            <rect x="32" y="4" width="16" height="14" rx="2"
              stroke="#9CA3AF" strokeWidth="2.5" fill="white" />
            {/* Left box */}
            <rect x="8" y="54" width="16" height="14" rx="2"
              stroke="#9CA3AF" strokeWidth="2.5" fill="white" />
            {/* Right box */}
            <rect x="56" y="54" width="16" height="14" rx="2"
              stroke="#9CA3AF" strokeWidth="2.5" fill="white" />
            {/* Horizontal line */}
            <line x1="16" y1="61" x2="64" y2="61"
              stroke="#9CA3AF" strokeWidth="2.5" />
            {/* Vertical line */}
            <line x1="40" y1="18" x2="40" y2="61"
              stroke="#9CA3AF" strokeWidth="2.5" />
          </svg>

          {/* Red warning badge */}
          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full w-7 h-7 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm leading-none">!</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black tracking-tight mb-3 text-slate-900 dark:text-white"
          style={{ fontFamily: 'monospace' }}>
          Network error
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
          We're having trouble connecting right now. Please check your
          internet connection and try reloading the app. If the issue
          continues, feel free to contact us at:{' '}
          <a
            href="mailto:support@sliceflo.com"
            className="text-blue-600 underline hover:text-blue-700"
          >
            support@sliceflo.com
          </a>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Reload SliceFlo
          </button>
          <button
            onClick={() => {
             
            //  signOut({ callbackUrl: '/login' })
            }}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-md transition-colors"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  )
}