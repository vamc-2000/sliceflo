// components/projects/ArchiveProjectModal.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ArchiveProjectModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    confirmLabel: string;
    onConfirm: () => void;
    description?: string;
    loading?: boolean;
}

export default function ArchiveProjectModal({
    open,
    onClose,
    title,
    confirmLabel,
    onConfirm,
    description,
    loading,
}: ArchiveProjectModalProps) {

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[430px] rounded-2xl border-0 border-b-5 border-primary p-3 [&>button]:hidden">

                {/* Title */}
                <DialogHeader className="text-center pt-10">
                    <DialogTitle className="text-center font-semibold">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Image */}
                <div className="flex justify-center my-1">
                    <Image
                        src="/images/archive.svg"
                        alt="Archive project"
                        width={100}
                        height={100}
                    />
                </div>

                {/* Description */}
                <DialogDescription className="text-center text-xs text-muted-foreground">
                    {description ??
                        "Archiving this project is permanent and it will be moved to cleanup."}
                </DialogDescription>

                {/* Footer Buttons */}
                <DialogFooter className="mt-6 flex gap-2">
                    <Button className="flex-1 text-xs" variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn("bg-primary hover:bg-primary/90 text-primary-foreground flex-1 text-xs")}
                    >
                        {loading ? "Archiving..." : confirmLabel}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
