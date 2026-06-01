"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";

interface DashboardSectionProps {
  title: string;
  onViewAll?: () => void;
  children: ReactNode;
  emptyMessage?: string;
  showViewAll?: boolean;
  // New props for dropdown
  viewAllType?: "link" | "dropdown";
  allItems?: any[];
  onItemClick?: (item: any) => void;
  onItemDelete?: (item: any) => void;
}

export const DashboardSection = ({
  title,
  onViewAll,
  children,
  emptyMessage = "No items available",
  showViewAll = true,
  viewAllType = "link",
  allItems = [],
  onItemClick,
  onItemDelete,
}: DashboardSectionProps) => {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-2 border-l-4 border-l-primary">
      {/* Header */}
      <div className="flex items-center px-2  justify-between mb-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        
        {showViewAll && (
          <>
            {viewAllType === "link" && onViewAll && (
              <Button
                variant="link"
                onClick={onViewAll}
                className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto hover:no-underline"
              >
                View All
              </Button>
            )}

            {viewAllType === "dropdown" && allItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-sm text-muted-foreground hover:text-foreground h-auto p-0 hover:bg-transparent gap-1"
                  >
                    View All
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0 bg-popover text-popover-foreground">
                  {/* Header */}
                  <div className="px-3 py-3 bg-muted border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {title}
                    </span>
                    <span className="text-xs px-6 font-semibold text-foreground">
                      Action
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {allItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="px-3 py-2 hover:bg-muted flex items-center justify-between border-b border-border last:border-b-0 cursor-pointer"
                      >
                        {/* Item Name */}
                        <span className="text-xs text-foreground truncate flex-1 pr-2">
                          {item.title || item.name}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onItemClick) {
                                onItemClick(item);
                              }
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          {onItemDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemDelete(item);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* Cards Container */}
      <div className="overflow-x-auto pb-1 -mx-0 py-1">
        <div className="flex gap-4 min-w-min">
          {children || (
            <div className="w-full py-8 text-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
