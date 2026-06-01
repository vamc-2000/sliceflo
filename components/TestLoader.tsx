'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TestLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  gifSrc: string;
}

export const TestLoader = ({
  message = "Loading...",
  size = 'md',
  gifSrc
}: TestLoaderProps) => {
  const sizes = {
    sm: { width: 60, height: 15 },
    md: { width: 80, height: 20 },
    lg: { width: 100, height: 25 },
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src={gifSrc}
        alt="Loader"
        width={sizes[size].width}
        height={sizes[size].height}
        unoptimized
      />
      {message && (
        <p className="text-xs text-muted-foreground animate-pulse font-medium">
          {message}
        </p>
      )}

    </div>
  );
};

// Component with DropdownMenuItem and Large Dialog
export const TestLoaderDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      {/* Dropdown Menu Item */}
      <DropdownMenuItem
        className="px-2 py-1.5 my-1 justify-center text-xs font-medium border border-primary text-primary rounded-md cursor-pointer hover:bg-muted"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        Test loader
      </DropdownMenuItem>

      {/* Dialog with Loaders - LARGE SIZE */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Loader Testing</DialogTitle>
          </DialogHeader>

          {/* Two Loaders - Left and Right with More Spacing */}
          <div className="grid grid-cols-2 gap-6 py-6">
            {/* Left Loader */}
            <div className="border border-border rounded-lg p-6 bg-muted">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">
                Loader 1
              </h3>
              <TestLoader
                message="Processing..."
                size="lg"
                // gifSrc="/interchanging.gif"
                gifSrc={theme === 'dark' ? '/Variant1.gif' : '/interchanging.gif'}
              />
            </div>

            {/* Right Loader */}
            <div className="border border-border rounded-lg p-6 bg-muted">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">
                Loader 2
              </h3>
              <TestLoader
                message="Loading data..."
                size="lg"
                gifSrc={theme === 'dark' ? '/Variant1.gif' : '/interchanging-final.gif'}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
