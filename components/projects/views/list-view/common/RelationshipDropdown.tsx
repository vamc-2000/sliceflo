// components/list-view/common/RelationshipDropdown.tsx

"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Link2,
  Copy,
  Ban,
  XOctagon,
  CircleArrowLeft,
  CircleArrowRight,
  SkipBack,
  SkipForward,
} from "lucide-react";

const RELATIONSHIP_TYPES = [
  {
    value: "relates-to",
    label: "Relates to",
    icon: Link2,
    color: "text-blue-500",
  },
  {
    value: "duplicate-of",
    label: "Duplicate of",
    icon: Copy,
    color: "text-purple-500",
  },
  {
    value: "blocked-by",
    label: "Blocked by",
    icon: Ban,
    color: "text-red-500",
  },
  {
    value: "blocking",
    label: "Blocking",
    icon: XOctagon,
    color: "text-orange-500",
  },
  {
    value: "starts-before",
    label: "Starts Before",
    icon: CircleArrowLeft,
    color: "text-green-500",
  },
  {
    value: "starts-after",
    label: "Starts After",
    icon: CircleArrowRight,
    color: "text-teal-500",
  },
  // { value: "finishes-before", label: "Finishes Before", icon: SkipBack, color: "text-yellow-600" },
  // { value: "finishes-after", label: "Finishes After", icon: SkipForward, color: "text-lime-600" },
];

interface RelationshipDropdownProps {
  onSelectType: (type: string) => void;
  variant?: "action" | "section";
  buttonText?: string;
  size?: "sm" | "default";
  className?: string;
  "data-testid"?: string;
}

export function RelationshipDropdown({
  onSelectType,
  variant = "section",
  buttonText,
  size = "sm",
  className,
  "data-testid": dataTestId,
}: RelationshipDropdownProps) {
  const isActionVariant = variant === "action";
  const defaultButtonText = isActionVariant
    ? "Relationship"
    : "Add Relationship";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size={size}
          className={
            isActionVariant
              ? `text-xs rounded h-8 ${className || ""}`
              : `text-xs h-8 ${className || ""}`
          }
          data-testid={dataTestId}
        >
          <Plus className="h-3 w-3 mr-1" />
          {buttonText || defaultButtonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 border-0 border-b-[5px] border-b-primary"
      >
        {RELATIONSHIP_TYPES.map(({ value, label, icon: Icon, color }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onSelectType(value)}
            data-testid={`task-detail-relation-option-${value}`}
          >
            <Icon className={`h-4 w-4 mr-2 shrink-0 ${color}`} />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
