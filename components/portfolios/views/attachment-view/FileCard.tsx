"use client";

import { Download, MoreVertical, Share2, Trash2, FileText, Film, FileSpreadsheet, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileAttachment } from "@/types/attachment.types";
import { FileActionsDropdown } from "./FileActionsMenu";
import { Image as ImageIcon, TvMinimalPlay } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileCardProps {
    file: FileAttachment;
    checked?: boolean;
    onCheckedChange?: (id: string, checked: boolean) => void;
    onDownload?: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
    onView?: (id: string) => void;
}

const getFileIcon = (type: string) => {
    switch (type) {
        case 'jpg':
        case 'png':
            return <ImageIcon className="h-8 w-8" />;
        case 'mp4':
            return <TvMinimalPlay className="h-8 w-8" />;
        case 'pdf':
        case 'doc':
        case 'xlsx':
        default:
            return <FileText className="h-8 w-8" />;
    }
};

const getFileIconBg = (type: string) => {
    switch (type) {
        case 'pdf':
        case 'png':
        case 'jpg':
        case 'mp4':
        case 'xlsx':
        case 'doc': return 'text-[#8E8E93]';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export function FileCard({ file, checked, onCheckedChange, onDownload, onDelete, onShare, onView }: FileCardProps) {
    return (
        <div className="w-full flex items-center gap-4">
            <input
                type="checkbox"
                checked={checked ?? false}
                onChange={e => onCheckedChange?.(file.id, e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#8E8E93] accent-[#001F3F] text-[#001F3F] focus:ring-primary cursor-pointer"
            />
            <div className="w-full flex items-center gap-4 group border rounded-md px-3 py-2 hover:border-primary/30 hover:shadow-sm transition-all bg-background cursor-pointer"
                onClick={() => onView?.(file.id)}
            >
                <div className={cn(
                    "shrink-0 flex items-center justify-center w-10 h-10 rounded-md border",
                    getFileIconBg(file.type)
                )}>
                    {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex gap-2">
                                <h3 className="font-medium text-sm truncate">
                                    {file.name}
                                </h3>
                                {file.tags && file.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {file.tags.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs px-1 py-0.5"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                {file.attachedTo && (
                                    <span>Attached to {file.attachedTo}</span>
                                )}
                                <span>Uploaded by {file.uploadedBy.name}</span>
                                <span>{file.size}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex ">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={file.uploadedBy.avatar} />
                            <AvatarFallback className="text-xs">
                                {file.uploadedBy.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>

                        {file.shared && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-transparent pl-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload?.(file.id);
                            }}
                        >
                            <Download className="h-4 w-4 text-[#001F3F]" strokeWidth={2.8} />
                        </Button>

                        <div onClick={(e) => e.stopPropagation()}>
                            <FileActionsDropdown
                                fileId={file.id}
                                onShare={onShare}
                                onDelete={onDelete}
                                onDownload={onDownload}
                            />
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Uploaded on: {file.uploadedOn}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
