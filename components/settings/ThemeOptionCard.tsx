import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface ThemeOptionCardProps {
    theme: string;
    label: string;
    imageSrc: string;
    isSelected: boolean;
    onClick: () => void;
    borderColor?: string;
    "data-testid"?: string;
}

export const ThemeOptionCard: React.FC<ThemeOptionCardProps> = ({
    theme,
    label,
    imageSrc,
    isSelected,
    onClick,
    "data-testid": dataTestId,
}) => {
     const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    let displayImageSrc = imageSrc;
    let displayLabel = label;

    if (mounted && theme === "system" && resolvedTheme) {
        const isDark = resolvedTheme === "dark" || resolvedTheme === "dark-contrast";
        displayImageSrc = isDark ? "/themes/dark.svg" : "/themes/light.svg";
        displayLabel = `System Default (${isDark ? "Dark" : "Light"})`;
    }
    return (
        <div className="flex flex-col items-center gap-2 p-1">
            {/* Outer white card with shadow and rounded corners */}
            <button
                onClick={onClick}
                className={`bg-card rounded-lg p-4 cursor-pointer transition-all duration-200 border-b-[3px] ${isSelected
                    ? "border-[var(--brand)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    : "border-border shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-border"
                    }`}
                data-testid={dataTestId}
            >
                {/* Inner image box with border — square-ish */}
                <div
                    className="rounded-sm  overflow-hidden"
                    style={{ width: "150px", height: "100px" }}
                >
                    <div className="relative w-full h-full">
                        <Image
                      src={displayImageSrc}
                            alt={displayLabel}
                            fill
                            className="object-cover object-top"
                        />
                    </div>
                </div>
            </button>

            {/* Label — outside and below the card */}
            <span className="text-[12px] font-normal text-foreground text-center leading-tight">
                {displayLabel}
            </span>
        </div>
    );
};
