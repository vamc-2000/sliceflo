// components/portfolios/PortfolioIconAvatar.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iconComponentMap } from "@/components/ColorIconPicker";
import { Portfolio } from "@/stores/portfolios-store";

interface Props {
  portfolio: Partial<Portfolio> & { name: string };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

const iconSizeMap = {
  xs: 10,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export function PortfolioIconAvatar({
  portfolio,
  size = "md",
  className = "",
}: Props) {
  const renderIconContent = () => {
    // Case 1: Icon object from API exists
    if (portfolio.icon) {
      // Sub-case: Image type (uploaded image)
      if (portfolio.icon.type === "file") {
        const imageUrl = portfolio.icon.presignedUrl;
        if (!imageUrl) return null;
        return (
          <AvatarImage
            src={imageUrl}
            alt={portfolio.name}
            className="object-cover"
          />
        );
      }

      // Sub-case: Icon type (icon library)
      if (portfolio.icon.type === "icon" && portfolio.icon.name) {
        const IconComponent = iconComponentMap[portfolio.icon.name];
        if (IconComponent) {
          return (
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ backgroundColor: portfolio.icon.color || portfolio.color || "#9333ea" }}
            >
              <IconComponent
                size={iconSizeMap[size]}
                color="#FFFFFF"
              />
            </div>
          );
        }
      }
    }

    // Case 2: iconId reference
    if (portfolio.iconId && !portfolio.icon) {
        // This is a fallback for when data might be partial or loading
        const bgColor = portfolio.color || "#9333ea";
        return (
          <AvatarFallback
            className="rounded-md font-semibold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {portfolio.name?.charAt(0).toUpperCase() || "P"}
          </AvatarFallback>
        );
    }

    // Case 3: Default - show first letter of portfolio name
    const fallbackColor = portfolio.icon?.color || portfolio.color || "#9333ea";
    return (
      <AvatarFallback
        className="rounded-md font-semibold text-white"
        style={{ backgroundColor: fallbackColor }}
      >
        {portfolio.name?.charAt(0).toUpperCase() || "P"}
      </AvatarFallback>
    );
  };

  return (
    <Avatar className={`${sizeMap[size]} rounded-md ${className}`}>
      {renderIconContent()}
    </Avatar>
  );
}