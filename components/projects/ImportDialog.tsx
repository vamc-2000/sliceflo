// components/projects/ImportDialog.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, X, ArrowLeft, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
}

type ImportFile = {
    file: File;
    status: "uploading" | "done";
};

const ACCEPTED = [".csv", ".xls", ".xlsx"];

export function ImportDialog({ open, onClose, projectId }: ImportDialogProps) {
    const [files, setFiles] = useState<ImportFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const simulateUpload = (index: number) => {
        setTimeout(() => {
            setFiles(prev =>
                prev.map((item, i) =>
                    i === index ? { ...item, status: "done" } : item
                )
            );
        }, 1200);
    };

    const addFiles = (incoming: File[]) => {
        const valid = incoming.filter(f => {
            const ext = "." + f.name.split(".").pop()?.toLowerCase();
            return ACCEPTED.includes(ext);
        });

        if (valid.length !== incoming.length) {
            toast('error', { title: "Only CSV, XLS, or XLSX files are supported." });
        }

        const newItems: ImportFile[] = valid.map(file => ({
            file,
            status: "uploading",
        }));

        setFiles(prev => {
            const startIdx = prev.length;
            newItems.forEach((_, i) => simulateUpload(startIdx + i));
            return [...prev, ...newItems];
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const handleRemove = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleImport = () => {
        toast('success', { title: "Import started!" });
        setFiles([]);
        onClose();
    };

    const allDone = files.length > 0 && files.every(f => f.status === "done");

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-b-[5px] border-b-primary gap-0">

                {/* Header */}
                <DialogHeader className="flex flex-row items-center gap-3 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <DialogTitle className="text-sm font-semibold">Import</DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="p-5 space-y-4">

                    {/* Drop zone — matches Image 2 exactly */}
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`
                            relative flex flex-col items-center justify-center
                            rounded-xl border-2 border-dashed py-12 px-6 text-center
                            transition-colors
                            ${isDragging
                                ? "border-green-400 bg-green-50"
                                : "border-border bg-card hover:bg-muted"
                            }
                        `}
                    >
                        <label htmlFor="import-file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                            {/* Green circle upload icon — matches Image 2 */}
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <Download className="h-6 w-6 text-green-600" />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-foreground">Import files</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Drag & drop or{" "}
                                    <span className="text-green-600 font-medium underline underline-offset-2">
                                        choose file
                                    </span>{" "}
                                    to import
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Make sure its a CSV, XLS, or XLSX file.
                            </p>

                            <input
                                id="import-file-upload"
                                type="file"
                                multiple
                                accept=".csv,.xls,.xlsx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {/* Selected files list */}
                    {files.length > 0 && (
                        <div className="space-y-1.5">
                            {files.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                                >
                                    <span className="truncate text-xs">{item.file.name}</span>
                                    {item.status === "uploading" ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <button onClick={() => handleRemove(idx)}>
                                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Source cards — Google Drive + OneDrive, matches Image 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Google Drive */}
                        <SourceCard title="Google Drive" iconSrc="/images/teams/slide.svg">
                            <SourceChip iconSrc="/images/teams/slide.svg" label="Google Sheets" />
                        </SourceCard>

                        {/* OneDrive */}
                        <SourceCard title="One Drive" iconSrc="/images/teams/word.svg">
                            <SourceChip iconSrc="/images/teams/excel.svg" label="Excel" />
                        </SourceCard>
                    </div>

                </div>

                {/* Footer */}
                {/* <Separator />
                <div className="flex justify-end px-5 py-3">
                    <Button
                        onClick={handleImport}
                        disabled={!allDone}
                        className={`px-6 ${allDone
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                    >
                        Import
                    </Button>
                </div> */}

            </DialogContent>
        </Dialog>
    );
}

/* ── helper components ── */
function SourceCard({
    title,
    iconSrc,
    children,
}: {
    title: string;
    iconSrc: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border p-4 space-y-3 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Image src={iconSrc} alt={title} width={16} height={16} />
                {title}
            </div>
            <div className="flex gap-2">{children}</div>
        </div>
    );
}

function SourceChip({
    iconSrc,
    label,
}: {
    iconSrc: string;
    label: string;
}) {
    return (
        <button className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background transition-colors">
            <Image src={iconSrc} alt={label} width={14} height={14} />
            {label}
        </button>
    );
}