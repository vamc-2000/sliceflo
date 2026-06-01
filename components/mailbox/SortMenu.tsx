"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { X, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SortOption = "showRead" | "showUnreadFirst" | "showSnoozed" | null;

interface SortMenuProps {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  iconColor?: string;
}

export default function SortMenu({
  sortOption,
  setSortOption,
  iconColor = "#8E8E93",
}: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const isActive = sortOption !== null;

  const renderMenuItem = (label: string, value: SortOption) => {
    const isSelected = sortOption === value;

    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-none cursor-pointer px-3 py-2 text-xs transition-colors",
          isSelected
            ? "border-l-4 border-primary bg-muted/40 text-primary"
            : "hover:bg-muted"
        )}
        onClick={() => {
          setSortOption(isSelected ? null : value);
          setOpen(false);
        }}
      >
        <span>{label}</span>

        {isSelected && (
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 ml-2 rounded-full bg-muted hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setSortOption(null);
              setOpen(false);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-8 w-8 rounded-md transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <ArrowUpDown className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom">
            <p>Sort</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-45 text-xs border-0 border-b-[5px] border-primary rounded shadow-xl shadow-primary/20 mt-1"
      >
        {renderMenuItem("Show read", "showRead")}
        {renderMenuItem("Show unread first", "showUnreadFirst")}
        {/* {renderMenuItem("Show snoozed", "showSnoozed")} */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}