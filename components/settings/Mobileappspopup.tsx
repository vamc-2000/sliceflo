'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MobileAppPopup: React.FC<Props> = ({ open, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center w-full bg-black/50">
      <div className="bg-card dark:bg-gray-900 text-[var(--primary)] dark:text-white rounded-xl shadow-lg w-full max-w-4xl p-6 relative mx-4 border-b-4 border-[var(--primary)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-[var(--primary)] dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-semibold mb-6 text-[var(--primary)] dark:text-white">
          Download App
        </h2>

        {/* Grid Layout using Tailwind CSS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Mobile Preview Section */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative w-[280px] h-[350px] md:w-[320px] md:h-[420px]">
              <Image
                src="/images/Phones.png"
                alt="Mobile App Preview"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* QR Section */}
          <div className="text-center order-1 md:order-2">
            <p className="text-base font-bold text-[#FF9500]">
              Scan the QR to
            </p>
            <p className="text-lg font-bold text-[#FF9500] mb-4">
              Download the Mobile App
            </p>

            <div className="dark:bg-orange-200 rounded-xl inline-block mb-4">
              <Image
                src="/images/Mobilescanner.png"
                alt="Download QR Code"
                width={200}
                height={200}
                className="rounded-xl"
              />
            </div>

            <div className="my-4 text-sm font-semibold text-muted-foreground dark:text-gray-300">
              OR
            </div>

            <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white py-2 px-6 rounded-md text-sm transition-colors">
              Email me the download link
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MobileAppPopup;
