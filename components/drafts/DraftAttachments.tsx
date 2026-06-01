"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, Maximize2, Paperclip } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import AttachFileModal from "../disucssions/AttachFileModal";
import { uploadFile } from "@/lib/api/uploads-api";
import { useDraftsStore } from "@/stores/drafts-store";
import { TaskAttachment } from "@/types/task.types";

type DraftAttachmentsProps = {
    draftId: string;
    attachments?: any[]; // Using any because DraftResponse says string[] but TaskAttachments needs objects
    workspaceId: string;
};

// Helper for file type icons
const getFileImage = (mimeType: string) => {
    if (!mimeType) return "/images/default.png";

    if (mimeType.includes("pdf")) return "/images/discussions/pdf.svg";
    if (mimeType.includes("doc")) return "/images/discussions/word.svg";
    if (mimeType.includes("ppt")) return "/images/discussions/ppt.svg";
    if (mimeType.includes("png") || mimeType.includes("jpg") || mimeType.includes("jpeg"))
        return "/images/discussions/imgs.png";

    return "/images/default.png";
};

// Helper for readable file size
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const DraftAttachments: React.FC<DraftAttachmentsProps> = ({
    draftId,
    attachments = [],
    workspaceId,
}) => {
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { saveDraft } = useDraftsStore();

    // In Drafts, attachments are usually IDs (strings). 
    // But TaskAttachments UI needs objects. 
    // We'll treat the prop as objects if they are passed, otherwise IDs.
    const displayAttachments = attachments.filter(a => typeof a === 'object' && a !== null) as TaskAttachment[];
    const attachmentIds = attachments.map(a => typeof a === 'string' ? a : a.id);

    const hasFiles = displayAttachments.length > 0;

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAttach = async (files: File[]) => {
        try {
            setIsUploading(true);

            const uploaded = await Promise.all(files.map((f) => uploadFile(f)));
            const newIds = uploaded.map((u) => u.id);

            const mergedIds = Array.from(new Set([...attachmentIds, ...newIds]));

            await saveDraft({
                id: draftId,
                workspaceId,
                attachments: mergedIds
            });

            setIsAttachModalOpen(false);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleAttach(Array.from(files));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleAttach(Array.from(files));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDelete = async (idToDelete: string) => {
        const nextIds = attachmentIds.filter(id => id !== idToDelete);
        await saveDraft({
            id: draftId,
            workspaceId,
            attachments: nextIds
        });
    };

    return (
        <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Label className="font-semibold text-sm">Attachments</Label>
                    {displayAttachments.length > 0 && (
                        <span className="text-xs text-[#AEAEB2]">
                            {displayAttachments.length} items
                        </span>
                    )}
                </div>

                {hasFiles && (
                    <button
                        className="p-2 rounded-md bg-[#F2F2F7] hover:bg-gray-200 transition"
                        onClick={() => setIsAttachModalOpen(true)}
                        disabled={isUploading}
                    >
                        <Paperclip className="h-4 w-4 text-[#8E8E93]" />
                    </button>
                )}
            </div>

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
            />

            {!hasFiles ? (
                <div
                    className="rounded-lg p-6 text-center bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => setIsAttachModalOpen(true)}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Upload sources</p>
                            <p className="text-xs text-[#8E8E93]">
                                Drag & drop or{" "}
                                <span className="text-amber-600 cursor-pointer hover:underline">choose file</span>{" "}
                                to upload
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out`}>
                    {(showAll ? displayAttachments : displayAttachments.slice(0, 2)).map((file) => {
                        const isExpanded = !!expandedItems[file.id];

                        return (
                            <div
                                key={file.id}
                                className="flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg bg-white hover:shadow-sm transition"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Image
                                        src={getFileImage(file.mimeType)}
                                        alt={file.mimeType || "File"}
                                        width={24}
                                        height={24}
                                        className="object-contain"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p
                                                        onClick={() => toggleExpand(file.id)}
                                                        className={`text-sm font-medium cursor-pointer ${isExpanded ? "break-all" : "truncate"}`}
                                                    >
                                                        {file.fileName}
                                                    </p>
                                                </TooltipTrigger>
                                                {!isExpanded && (
                                                    <TooltipContent>
                                                        <p className="text-xs max-w-xs break-all">
                                                            {file.fileName}
                                                        </p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>

                                        <p className="text-[10px] text-[#8E8E93]">
                                            {formatFileSize(file.fileSize)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-gray-100"
                                        onClick={() => window.open(file.id, '_blank')} // Presigned URL should be here ideally
                                    >
                                        <Download className="h-3.5 w-3.5 text-[#8E8E93]" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-gray-100"
                                        onClick={() => toggleExpand(file.id)}
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-[#8E8E93]" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-red-50"
                                        onClick={() => handleDelete(file.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {displayAttachments.length > 2 && (
                        <div className="text-center">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-xs text-[#8E8E93] font-medium hover:underline"
                            >
                                {showAll ? "Show less" : `Show more (${displayAttachments.length - 2})`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AttachFileModal
                open={isAttachModalOpen}
                onClose={() => setIsAttachModalOpen(false)}
                onAttach={handleAttach}
            />

            {isUploading && (
                <p className="text-[10px] text-gray-500 animate-pulse">Uploading files...</p>
            )}
        </div>
    );
};
