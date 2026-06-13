// components/reports/ReportsDetails/ReportMoreMenu.tsx
"use client";

import { MoreHorizontal, Trash2, Settings, Pen, Copy, Save, Star, SlidersVertical, RotateCcw, Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface ReportMoreMenuProps {
    onRename?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onToggleFavorite?: () => void;
    isFavorite?: boolean;
}

export default function ReportMoreMenu({
    onRename,
    onDelete,
    onDuplicate,
    onToggleFavorite,
    isFavorite,
}: ReportMoreMenuProps) {
    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button className="text-[#001F3F] dark:text-foreground hover:text-gray-800 dark:hover:text-muted-foreground">
                                <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>

                    <TooltipContent>
                        More options
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={6}
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-50 border-0 border-b-[5px] border-[#001F3F] dark:border-b-brand text-[#001F3F] dark:text-foreground bg-popover"
            >
                <div className="px-2 py-1.5 text-sm text-center text-white dark:text-brand-foreground bg-[#001F3F] dark:bg-brand rounded-sm">
                    Sharing & Permissions
                </div>

                <DropdownMenuItem onClick={onRename}>
                    <Pen className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Rename
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Duplicate
                </DropdownMenuItem>

                <Separator className="bg-[#D1D1D6] dark:bg-border" />

                <DropdownMenuItem onClick={onToggleFavorite}>
                    <Star className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    {isFavorite ? "Remove from favourites" : "Add To favourites"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onRename}>
                    <Save className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Save as Template
                </DropdownMenuItem>

                <Separator className="bg-[#D1D1D6] dark:bg-border" />

                <DropdownMenuItem onClick={onRename}>
                    <SlidersVertical className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Auto layout
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onRename}>
                    <RotateCcw className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Auto refresh
                </DropdownMenuItem>

                <Separator className="bg-[#D1D1D6] dark:bg-border" />

                <DropdownMenuItem onClick={onRename}>
                    <Download className="w-4 h-4 mr-2 text-[#001F3F] dark:text-foreground" />
                    Download PDF
                </DropdownMenuItem>

                <Separator className="bg-[#D1D1D6] dark:bg-border" />

                <DropdownMenuItem
                    onClick={onDelete}
                    className="text-[#EC221F] focus:text-[#EC221F]"
                >
                    <Trash2 className="w-4 h-4 mr-2 text-[#EC221F]" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}