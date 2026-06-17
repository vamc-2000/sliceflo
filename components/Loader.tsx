'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader = ({
  message = "Loader...",
  size = 'md'
}: LoaderProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    sm: { width: 60, height: 15 },
    md: { width: 80, height: 20 },
    lg: { width: 100, height: 25 },
  };

  const gifSrc = mounted && theme === 'dark' ? '/Variant1.gif' : '/interchanging.gif';

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        key={gifSrc}
        src={gifSrc}
        alt="Loader"
        width={sizes[size].width}
        height={sizes[size].height}
        unoptimized
      />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
