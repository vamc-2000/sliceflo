"use client";

import { Share2, Trash2, Ellipsis, Pen, Shield, Archive, Users, ShieldUser, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface FileActionsDropdownProps {
    fileId: string;
    onShare?: (id: string) => void;
    onDelete?: (id: string) => void;
    onDownload?: (id: string) => void;
}

export function FileActionsDropdown({
    fileId,
    onShare,
    onDelete,
    onDownload,
}: FileActionsDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Ellipsis className="h-4 w-4 text-[#001F3F]" strokeWidth={2.8} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-58 border-0 border-b-[5px] border-[#001F3F] text-[#001F3F]">
                <DropdownMenuItem onClick={() => onDownload?.(fileId)}>
                    <Download className="h-4 w-4 mr-2 text-[#001F3F]" />
                    Download
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => console.log("Rename clicked")}>
                    <Pen className="h-4 w-4 mr-2 text-[#001F3F]" />
                    Rename
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-[#001F3F]">
                        <Shield className="h-4 w-4 mr-2 text-[#001F3F]" />
                        Attachment Privacy
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent className="w-44 text-[#001F3F] border-0 border-b-[5px] border-[#001F3F]">
                        <DropdownMenuItem onClick={() => console.log("Private")}>
                            <ShieldUser className="h-4 w-4 mr-2 text-[#001F3F]" />
                            Only me
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => console.log("Public")}>
                            <Users className="h-4 w-4 mr-2 text-[#001F3F]" />
                            Everyone
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <Separator />

                <DropdownMenuItem onClick={() => onShare?.(fileId)}>
                    <Archive className="h-4 w-4 mr-2 text-[#001F3F]" />
                    Archive Attachment
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="focus:text-destructive text-[#EC221F]"
                    onClick={() => onDelete?.(fileId)}
                >
                    <Trash2 className="h-4 w-4 mr-2 text-[#EC221F]" />
                    Delete Attachment
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
