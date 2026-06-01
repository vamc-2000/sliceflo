// app/components/layout/AuthPageLayout.tsx
'use client';

import React, { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FinalLogo from '@/public/images/FinalLogo';

type LayoutProps = {
  children: ReactNode;
  footerContent?: ReactNode; 
  showTopRightCTA?: boolean;
  showTopRightReg?: boolean;
};

const AuthPageLayout: React.FC<LayoutProps> = ({
  children,
  footerContent,
  showTopRightCTA = false,
  showTopRightReg = false,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      {/* Background Image */}
      <Image
        src="/images/loginbackground.jpeg"
        alt="Background"
        fill
        priority
        quality={100}
        className="object-cover pointer-events-none"
      />

      {/* Responsive Header Container (Logo + CTA) */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 z-30 flex items-center justify-between">
        {/* Logo */}
        <FinalLogo className="h-8 md:h-[40px] lg:h-[50px] w-auto" />

        {/* Top-right CTA */}
        {showTopRightCTA && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-[#001F3F] hidden sm:inline">New to SliceFlo?</span>
            <Link
              href="/signup"
              className="bg-[#001F3F] text-white text-xs md:text-sm px-3 md:px-4 py-1.5 rounded-md hover:bg-[#0a274f] font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}

        {showTopRightReg && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-[#001F3F] hidden sm:inline">Already have an Account?</span>
            <Link
              href="/login"
              className="bg-[#001F3F] text-white text-xs md:text-sm px-3 md:px-4 py-1.5 rounded-md hover:bg-[#0a274f] font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Centered Content Container */}
      <div className="relative z-20 min-h-screen w-full flex flex-col items-center justify-center px-4 py-20 md:py-28">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
          {/* Top & side borders with padding and rounded top */}
          <div className="p-4 border-b-4 border-[#001F3F] rounded-xl">{children}</div>
        </div>

        {/* Footer content displayed outside the card */}
        {footerContent && (
          <div className="mt-4 text-center text-[10px] font-normal text-black px-2 max-w-md">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPageLayout;