'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, FilePlus2, Link as LinkIcon } from 'lucide-react';
import { FileText, FileImage, FileAudio, FileType, Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator'
// import { Progress } from '@/components/ui/progress';

interface AttachFileModalProps {
    open: boolean;
    onClose: () => void;
    onAttach: (files: File[]) => void;
}

type UploadFile = {
    file: File;
    status: 'uploading' | 'done';
};

const MAX_FILES = 50;

export default function AttachFileModal({ open, onClose, onAttach }: AttachFileModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
    const [isAttaching, setIsAttaching] = useState(false);

    useEffect(() => {
        if (!open) {
            setSelectedFiles([]);
            setIsAttaching(false);
        }
    }, [open]);

    function getFileIcon(name: string) {
        const ext = name.split(".").pop()?.toLowerCase();

        if (!ext) return <FileType className="h-4 w-4" />;

        if (["pdf"].includes(ext)) return <FileText className="h-4 w-4 text-red-500" />;
        if (["doc", "docx"].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
        if (["ppt", "pptx"].includes(ext)) return <FileText className="h-4 w-4 text-orange-500" />;
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
            return <FileImage className="h-4 w-4 text-green-500" />;

        return <FileType className="h-4 w-4" />;
    }

    function formatFileSize(bytes: number) {
        if (bytes === 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const value = bytes / Math.pow(1024, i);
        return `${value.toFixed(1)} ${units[i]}`;
    }

    const simulateUpload = (index: number) => {
        setTimeout(() => {
            setSelectedFiles((prev) =>
                prev.map((item, i) =>
                    i === index ? { ...item, status: 'done' } : item
                )
            );
        }, 1500); // simulate API delay
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles: UploadFile[] = Array.from(e.target.files).map((file) => ({
            file,
            status: 'uploading',
        }));

        setSelectedFiles((prev) => [...prev, ...newFiles]);

        // simulate upload
        newFiles.forEach((_, index) => {
            simulateUpload(selectedFiles.length + index);
        });
        e.target.value = '';
    };

    const handleAttach = async () => {
        if (isAttaching || !hasFiles) return;
        setIsAttaching(true);
        await onAttach(selectedFiles.map(f => f.file));
        setIsAttaching(false);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const droppedFiles: UploadFile[] = Array.from(e.dataTransfer.files).map(
            (file) => ({
                file,
                status: 'uploading',
            })
        );

        if (selectedFiles.length + droppedFiles.length > MAX_FILES) {
            alert('You can upload up to 50 files only.');
            return;
        }

        setSelectedFiles((prev) => [...prev, ...droppedFiles]);

        // simulate upload (or trigger real upload)
        droppedFiles.forEach((_, index) => {
            simulateUpload(selectedFiles.length + index);
        });
    };

    const hasUploading = selectedFiles.some(f => f.status === 'uploading');
    const hasFiles = selectedFiles.length > 0 && !hasUploading;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="w-[53vw]! max-w-none! rounded-xl p-0! gap-0 overflow-hidden flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between p-4 pb-3">
                    <DialogTitle>Attach Files</DialogTitle>
                </DialogHeader>
                <Separator className='text-muted-foreground' />

                {/* Upload Area */}
                <div className="flex w-full justify-center p-4">
                    <div className="w-[50vw] flex flex-col gap-4">
                        {/* Upload area – full width of this column */}
                        <div
                            data-testid="dropzone-file-upload"
                            className="flex h-[300px] w-full flex-col items-center justify-center
                                rounded-lg border-2 border-dashed border-border p-6
                                text-center transition hover:bg-muted shrink-0"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                                    <Upload className="h-6 w-6 text-orange-500" />
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    data-testid="input-file-upload"
                                    onChange={handleFileChange}
                                />
                                <p className="text-lg font-semibold">Upload Sources</p>
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop or choose file to upload
                                </p>
                                <p className="mt-4 text-xs text-muted-foreground">
                                    Supported file types: PDF, txt, markdown, audio
                                </p>
                            </label>
                        </div>

                        {/* Selected files */}
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto pr-1">
                                {selectedFiles.map((item, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="flex w-48 items-center justify-between rounded-sm border-border px-2 py-1"
                                    >
                                        {/* left */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            {getFileIcon(item.file.name)}
                                            <div className="flex flex-col min-w-0">
                                                <span className="truncate text-xs">{item.file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatFileSize(item.file.size)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* right */}
                                        {item.status === 'uploading' ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            <button
                                                data-testid={`btn-remove-file-${idx}`}
                                                onClick={() => handleRemoveFile(idx)}
                                            >
                                                <X className="h-4 w-4 text-[#8E8E93] hover:text-foreground" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Attach Button */}
                        <div className="flex justify-end mt-2">
                            <Button
                                disabled={!hasFiles || isAttaching}
                                className={`min-w-[120px] h-10 flex items-center justify-center gap-2 transition-all
                                    ${!hasFiles || isAttaching
                                        ? 'bg-primary/30 text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }`}
                                onClick={handleAttach}
                                data-testid="btn-attaching-submit"
                            >
                                {isAttaching ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Attaching Files...</span>
                                    </>
                                ) : (
                                    'Attach'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------- helper components ---------------- */
function SourceCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode | string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border p-4 hover:bg-muted/50 gap-2">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {typeof icon === 'string' ? (
                    <Image src={icon} alt={title} width={16} height={16} />
                ) : (
                    icon
                )}
                {title}
            </div>
            <div className="flex gap-3">{children}</div>
        </div>
    );
}

function SourceMini({
    icon,
    label,
}: {
    icon: React.ReactNode | string;
    label: string;
}) {
    return (
        <div className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background">
            {typeof icon === 'string' ? (
                <Image src={icon} alt={label} width={16} height={16} />
            ) : (
                icon
            )}
            {label}
        </div>
    );
}
