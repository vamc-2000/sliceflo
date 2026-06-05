import React, { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, Maximize2, Paperclip, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import AttachFileModal from "../disucssions/AttachFileModal";
import { uploadFile } from "@/lib/api/uploads-api"; // use your real path
import { useTasksStore } from "@/stores/tasks-store";
import { TaskAttachment } from "@/types/task.types";

type TaskAttachmentsProps = {
    taskId: string;
    attachments?: TaskAttachment[]; // pass current attachments if you have them
};

// Helper for file type icons (matching ProjectAttachments)
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

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({
    taskId,
    attachments = [],
}) => {
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { updateTask, fetchTaskById } = useTasksStore();

    const hasFiles = attachments.length > 0;

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleAttach = async (files: File[]) => {
        try {
            setIsUploading(true);

            const uploaded = await Promise.all(files.map((f) => uploadFile(f)));
            const newIds = uploaded.map((u) => u.id);

            const existingIds = attachments.map((a) => a.id);
            const merged = Array.from(new Set([...existingIds, ...newIds]));

            await updateTask(taskId, { attachmentIds: merged });
            await fetchTaskById(taskId);

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

    return (
        <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label className="font-semibold">Attachments</Label>

                    {attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {attachments.length} items
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* Render Attach button if files already exist so users can add more */}
                    {hasFiles && (
                        <button
                            className="p-2 rounded-md bg-muted hover:bg-muted transition"
                            onClick={() => setIsAttachModalOpen(true)}
                            disabled={isUploading}
                            data-testid="task-attachments-add-more-btn"
                        >
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
                    >
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAttachmentsExpanded ? "rotate-180" : "rotate-0")} />
                    </Button>
                </div>
            </div>

            <div className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden space-y-3",
                isAttachmentsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
            )}>
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                />

                {!hasFiles ? (
                    <div
                        className="rounded-lg p-6 text-center bg-muted border-2 border-transparent hover:border-border transition-colors cursor-pointer"
                        onClick={() => setIsAttachModalOpen(true)}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        data-testid="task-attachments-upload-zone"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-brand-orange" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Upload sources</p>
                                <p className="text-xs text-muted-foreground">
                                    Drag & drop or{" "}
                                    <span
                                        className="text-brand-orange cursor-pointer hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent triggering the outer div click
                                            // handleFileClick();
                                            setIsAttachModalOpen(true)
                                        }}
                                        data-testid="task-attachments-choose-file-btn"
                                    >
                                        choose file
                                    </span>{" "}
                                    to upload
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${showAll ? "max-h-250 opacity-100" : "max-h-50 opacity-100"
                        }`}>
                        {(showAll ? attachments : attachments.slice(0, 2)).map((file) => {
                            const isExpanded = !!expandedItems[file.id];

                            return (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between gap-3 p-3 border border-input rounded-md bg-card hover:shadow-sm transition"
                                >
                                    {/* LEFT SECTION */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Image
                                            src={getFileImage(file.mimeType)}
                                            alt={file.mimeType || "File"}
                                            width={20}
                                            height={20}
                                            className="object-contain"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p
                                                            onClick={() => toggleExpand(file.id)}
                                                            className={`text-xs font-medium cursor-pointer ${isExpanded ? "break-all" : "truncate"
                                                                }`}
                                                        >
                                                            {file.fileName.length > 15 && !isExpanded
                                                                ? file.fileName.substring(0, 15) + "..."
                                                                : file.fileName}
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

                                            <p className="text-[10px] text-muted-foreground">
                                                {formatFileSize(file.fileSize)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* RIGHT SECTION - ACTION ICONS */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => console.log("Download", file.id)}
                                            className="bg-muted rounded-full h-6 w-6"
                                            data-testid={`task-attachment-download-${file.id}`}
                                        >
                                            <Download className="h-2 w-2 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleExpand(file.id)}
                                            className="bg-muted rounded-full h-6 w-6"
                                            data-testid={`task-attachment-maximize-${file.id}`}
                                        >
                                            <Maximize2 className="h-2 w-2 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => console.log("Delete", file.id)}
                                            className="bg-muted rounded-full h-6 w-6"
                                            data-testid={`task-attachment-delete-${file.id}`}
                                        >
                                            <Trash2 className="h-2 w-2 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {attachments.length > 2 && (
                            <div className="text-center">
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="text-xs text-muted-foreground text-center font-medium hover:underline"
                                    data-testid="task-attachments-show-all-btn"
                                >
                                    {showAll
                                        ? "Show less"
                                        : `Show more (${attachments.length - 2})`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isUploading ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Uploading files...</p>
                ) : null}
            </div>

            <AttachFileModal
                open={isAttachModalOpen}
                onClose={() => setIsAttachModalOpen(false)}
                onAttach={handleAttach}
            />
        </div>
    );
};
