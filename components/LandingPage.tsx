// components/LandingPage.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  title: string;
  description: string;
  extraText: string;
  imageSrc: string;
  imageAlt: string;
  buttonText: string;
  onButtonClick: () => void;
  imageHeight?: number;
}

export function LandingPage({
  title,
  description,
  extraText,
  imageSrc,
  imageAlt,
  buttonText,
  onButtonClick,
   imageHeight = 400,
}: LandingPageProps) {
  return (
    <div className="bg-background text-foreground p-4">
    {/* <div className="min-h-screen bg-background"> */}
      <div className="flex items-center justify-center px-4 py-1 ">
        <div className="w-full max-w-[1800px] mx-auto text-center px-5 space-y-1">
          {/* Hero section */}
          <div className="space-y-0">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-5xl font-bold text-foreground leading-tight">
              {title}
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-4xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Hero image */}
          <div className="flex justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={570}
              height={300}
              // className="w-full max-w-4xl"
              // className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl h-auto"
              priority
            />
          </div>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-base">
            {extraText}
          </p>

          {/* CTA Button */}
          <div className="py-2">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground px-5 py-4 rounded-lg font-semibold hover:bg-primary/90 
                       transition-all duration-200 text-base sm:text-lg shadow-lg hover:shadow-xl 
                       transform hover:-translate-y-0.5"
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
