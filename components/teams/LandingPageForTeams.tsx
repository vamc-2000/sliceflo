// components/LandingPage.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

export function LandingPageForTeams({
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
        <div className="bg-white px-4 py-3">
            {/* <div className="min-h-screen bg-white"> */}
            <div className="flex items-center justify-center px-4 py-1 ">
                <div className="w-full max-w-[1800px] mx-auto text-center px-5 space-y-1">
                    {/* Hero section */}
                    <div className="space-y-0">
                        <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-5xl font-bold text-gray-900 leading-tight">
                            {title}
                        </h1>

                        <p className="text-[#6E6E6E] text-base sm:text-lg lg:text-xl max-w-4xl mx-auto leading-snug whitespace-pre-line">
                            {description}
                        </p>
                    </div>

                    {/* Hero image */}
                    <div className="flex justify-center">
                        <Image
                            src={imageSrc}
                            alt={imageAlt}
                            width={530}
                            height={260}
                            // className="w-full max-w-4xl"
                            // className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl h-auto"
                            priority
                        />
                    </div>

                    {/* Subtitle */}
                    <p className="text-gray-500 text-sm sm:text-base">
                        {extraText}
                    </p>

                    {/* CTA Button */}
                    <div className="py-2">
                        <Button
                            size="lg"
                            className="bg-[#001F3F] text-white px-5 py-4 rounded-lg font-medium hover:bg-[#002B5C] 
                       transition-all duration-200 text-base sm:text-lg shadow-lg hover:shadow-xl 
                       transform hover:-translate-y-0.5"
                            onClick={onButtonClick}
                        >
                            <Plus className="mr-1 h-5 w-5" strokeWidth={2.5} />{buttonText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
