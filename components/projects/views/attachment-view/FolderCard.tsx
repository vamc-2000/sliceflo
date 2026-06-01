"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, Download, ChevronUp } from "lucide-react";
import { FileCard } from "./FileCard";
import { FileAttachment } from "@/types/attachment.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    taskName: string;
    files: FileAttachment[];
    selectedIds: string[];
    onFileCheck: (id: string, checked: boolean) => void;
    onFolderCheck: (ids: string[], checked: boolean) => void;
    onDownload?: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
    onView?: (id: string) => void;
}

export function FolderCard({
    taskName,
    files,
    selectedIds,
    onFileCheck,
    onFolderCheck,
    onDownload,
    onDelete,
    onShare,
    onView
}: Props) {
    const [open, setOpen] = useState(false);

    const allFileIds = files.map(f => f.id);
    const allChecked = allFileIds.length > 0 && allFileIds.every(id => selectedIds.includes(id));
    const someChecked = allFileIds.some(id => selectedIds.includes(id)) && !allChecked;

    // Folder checkbox toggles all children
    const handleFolderCheckbox = () => {
        const newChecked = !allChecked;
        onFolderCheck(allFileIds, newChecked);

        // ✅ Auto-open folder when checking, auto-close when unchecking
        if (newChecked) setOpen(true);
    };

    const uniqueUploaders = files.reduce((acc, file) => {
        if (!acc.find(u => u.name === file.uploadedBy.name)) {
            acc.push(file.uploadedBy);
        }
        return acc;
    }, [] as { name: string; avatar?: string }[]);

    return (
        <div className="space-y-2">
            <div className="w-full flex items-center gap-4">
                {/* ✅ Folder checkbox — controls all children */}
                <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => {
                        if (el) el.indeterminate = someChecked; // ✅ show dash when partially checked
                    }}
                    onChange={handleFolderCheckbox}
                    className="mt-1 h-4 w-4 rounded border-[#8E8E93] accent-[#001F3F] text-[#001F3F] focus:ring-primary cursor-pointer"
                />

                <div className="w-full flex items-center gap-3 border rounded-md px-3 py-2 hover:border-primary/30 hover:shadow-sm transition-all bg-background">
                    {/* Folder icon + name */}
                    <div
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                        {/* <Folder className="w-6 h-6 text-yellow-500 shrink-0" /> */}
                        <div className="shrink-0 flex items-center justify-center  rounded-full p-2 border border-[#E3EFFF] bg-[#F6FAFF]">
                            <Folder className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium text-xs truncate">{taskName}</span>
                            <span className="text-xs text-muted-foreground">
                                {files.length} {files.length === 1 ? 'file' : 'files'}
                            </span>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center">
                            <div className="flex -space-x-2 mr-2">
                                {uniqueUploaders.slice(0, 3).map((uploader, i) => (
                                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={uploader.avatar ?? ''} />
                                        <AvatarFallback className="text-xs">
                                            {uploader.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {uniqueUploaders.length > 3 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">
                                            +{uniqueUploaders.length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setOpen(!open)}
                                className="text-[#001F3F] hover:text-foreground transition-colors mr-1"
                            >
                                {open
                                    ? <ChevronDown className="w-4 h-4" strokeWidth={2.8} />
                                    : <ChevronUp className="w-4 h-4" strokeWidth={2.8} />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="ml-8 space-y-2 overflow-hidden"
                    >
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                checked={selectedIds.includes(file.id)}
                                onCheckedChange={onFileCheck}
                                onDownload={onDownload}
                                onDelete={onDelete}
                                onShare={onShare}
                                onView={onView}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
