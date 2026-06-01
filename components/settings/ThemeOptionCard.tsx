import React from "react";
import Image from "next/image";

interface ThemeOptionCardProps {
    theme: string;
    label: string;
    imageSrc: string;
    isSelected: boolean;
    onClick: () => void;
    borderColor?: string;
}

export const ThemeOptionCard: React.FC<ThemeOptionCardProps> = ({
    label,
    imageSrc,
    isSelected,
    onClick,
}) => {
    return (
        <div className="flex flex-col items-center gap-2 p-1">
            {/* Outer white card with shadow and rounded corners */}
            <button
                onClick={onClick}
                className={`bg-card rounded-lg p-4 cursor-pointer transition-all duration-200 border-b-[3px] ${isSelected
                    ? "border-[var(--primary)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    : "border-border shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-border"
                    }`}
            >
                {/* Inner image box with border — square-ish */}
                <div
                    className="rounded-sm  overflow-hidden"
                    style={{ width: "150px", height: "100px" }}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={imageSrc}
                            alt={label}
                            fill
                            className="object-cover object-top"
                        />
                    </div>
                </div>
            </button>

            {/* Label — outside and below the card */}
            <span className="text-[12px] font-normal text-gray-700 text-center leading-tight">
                {label}
            </span>
        </div>
    );
};
