// components/list-view/customFields/ColorPalette.tsx

"use client";

import { useRef, useEffect } from "react";
import { Pencil, Ban } from "lucide-react";

export const PRESET_COLORS = [
    'transparent', '#800000', '#E50000', '#FF4081', '#FF7FAB', '#F900EA', '#EA80FC', '#BF55EC',
    '#9B59B6', '#7C4DFF', '#0231E8', '#81B1FF', '#3397DD', '#3082B7', '#04A9F4', '#02BCD4',
    '#1BBC9C', '#2ECD6F', '#F9D900', '#AF7E2E', '#E65100', '#FF7800', '#B5BCC2', '#667684',
];

export const DEFAULT_COLOR = '#800000';

interface ColorPaletteProps {
    currentColor: string;
    onSelect: (color: string) => void;
    onClose: () => void;
    excludeColors?: string[];
}

export function ColorPalette({ currentColor, onSelect, onClose, excludeColors = [] }: ColorPaletteProps) {
    const paletteRef = useRef<HTMLDivElement>(null);

    // Close on outside clickx
    useEffect(() => {
        if (!paletteRef.current) return;

        const handleOutside = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleOutside);
        };
    }, [onClose]);

    // Filter preset colors to exclude colors used by other options, but always show the currentColor
    const filteredColors = PRESET_COLORS.filter(
        (color) => color === currentColor || !excludeColors.includes(color)
    );

    return (
        <div
            ref={paletteRef}
            className="absolute inset-x-0 bottom-16 z-50 mx-4"
        >
            <div className="bg-card border border-border rounded-lg shadow-xl p-3">

                <p className="text-xs text-muted-foreground mb-2 font-medium">Color</p>

                {/* Color Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                    {filteredColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onSelect(color)}
                            className={`h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center
                                        ${color === 'transparent' ? 'border-0' : ''}
                                        ${currentColor === color && color !== 'transparent' ? 'ring-2 ring-offset-1 ring-ring' : ''}
                                        ${currentColor === color && color === 'transparent' ? 'ring-2 ring-offset-1 ring-ring' : ''}
                                    `}
                            style={{
                                backgroundColor: color === 'transparent' ? 'white' : color
                            }}
                        >
                            {color === 'transparent' ? (
                                <Ban className="h-6 w-6 text-muted-foreground" />   // ← Ban icon, no border
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Pencil — custom color picker */}
                <div className="mt-2 pt-2 border-t border-border">
                    <label className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                        <input
                            type="color"
                            className="sr-only"
                            value={currentColor === 'transparent' ? '#ffffff' : currentColor}
                            onChange={(e) => onSelect(e.target.value)}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}