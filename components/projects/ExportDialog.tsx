// components/projects/ExportDialog.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Sheet, TableProperties } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import Image from "next/image";

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    onExportCSV?: (() => void) | null;
    onExportExcel?: (() => void) | null;
    onPrint?: (() => void) | null;
}

const EXPORT_OPTIONS = [
    {
        id: "pdf",
        label: "PDF",
        iconSrc: "/images/pdf.svg",      // ← update your path here
    },
    {
        id: "csv",
        label: "CSV",
        iconSrc: "/images/csv.svg",      // ← update your path here
    },
    {
        id: "excel",
        label: "Excel",
        iconSrc: "/images/excel.svg",    // ← update your path here
    },
] as const;

export function ExportDialog({
    open,
    onClose,
    onExportCSV,
    onExportExcel,
    onPrint,
}: ExportDialogProps) {

    const handleExport = (id: typeof EXPORT_OPTIONS[number]["id"]) => {
        switch (id) {
            case "pdf":
                onPrint?.();
                toast('success', { title: "Exporting as PDF..." });
                break;
            case "csv":
                onExportCSV?.();
                toast('success', { title: "Exporting as CSV..." });
                break;
            case "excel":
                onExportExcel?.();
                toast('success', { title: "Exporting as Excel..." });
                break;
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[280px] p-0 overflow-hidden border-b-[5px] border-b-primary gap-0">

                {/* Header */}
                <DialogHeader className="px-4 py-3">
                    <DialogTitle className="text-xs font-semibold">Export</DialogTitle>
                </DialogHeader>

                <Separator />

                {/* Options list — matches Image 3: icon + label rows */}
                <div className="py-1">
                    {EXPORT_OPTIONS.map((opt, idx) => (
                        <button
                            key={opt.id}
                            onClick={() => handleExport(opt.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-muted transition-colors text-left"
                        >
                            {/* Colored rounded square badge — matches Image 3 */}
                            <Image
                                src={opt.iconSrc}
                                alt={opt.label}
                                width={20}
                                height={20}
                                className="object-contain"
                            />

                            <span className="font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>

            </DialogContent>
        </Dialog>
    );
}