// components/projects/ProjectIconAvatar.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iconLibrary, iconComponentMap } from "@/components/ColorIconPicker";

interface ProjectIconAvatarProps {
  project: {
    name: string;
    icon?: {
      iconId: string;
      type: "icon" | "file";
      name?: string;
      color?: string;
      presignedUrl?: string;
    } | null;
    iconId?: string | null;
    color?: string;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
};

const iconSizeMap = {
  xs: 10,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export function ProjectIconAvatar({
  project,
  size = "md",
  className = "",
}: ProjectIconAvatarProps) {
  const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

  const renderIconContent = () => {
    // Case 1: Icon object from API exists
    if (project.icon) {
      // Sub-case: Image type (uploaded image)
      if (project.icon.type === "file") {
        const imageUrl = project.icon.presignedUrl; // ✅ use presignedUrl from API
        if (!imageUrl) return null;
        return (
          <AvatarImage
            src={imageUrl}
            alt={project.name}
            className="object-cover"
          />
        );
      }

      // Sub-case: Icon type (icon library)
      if (project.icon.type === "icon" && project.icon.name) {
        const IconComponent = iconComponentMap[project.icon.name];
        return (
          <div
            className="flex items-center justify-center w-full h-full"
            style={{ backgroundColor: project.icon.color }}
          >
            <IconComponent
              size={iconSizeMap[size]}
              className="text-primary-foreground"
              color="currentColor"
            />
          </div>
        );
      }
    }

    // Case 2: Fallback - show first letter of project name
    const fallbackColor = project.icon?.color || project.color;
    return (
      <AvatarFallback
        className={`rounded-md font-semibold text-primary-foreground ${!fallbackColor ? "bg-primary" : ""}`}
        style={fallbackColor ? { backgroundColor: fallbackColor } : undefined}
      >
        {project.name?.charAt(0).toUpperCase() || "P"}
      </AvatarFallback>
    );
  };

  return (
    <Avatar className={`${sizeMap[size]} rounded-md border border-border bg-muted ${className}`}>
      {renderIconContent()}
    </Avatar>
  );
}
