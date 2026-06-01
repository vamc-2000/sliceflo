// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Loading Spinner */}
        <div role="status" aria-label="loading">
          <svg
            className="w-12 h-12 animate-spin text-[#001F3F]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
        
        {/* Optional loading text */}
        <p className="text-sm text-[#001F3F] font-medium">Loading SliceFlo...</p>
      </div>
    </div>
  );
}
