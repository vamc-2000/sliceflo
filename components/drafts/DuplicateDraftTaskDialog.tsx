"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface DuplicateDraftTaskDialogProps {
    open: boolean;
    onClose: () => void;
    originalTaskName: string;
    title?: string;
    onDuplicate: (newName: string) => Promise<void>;
}

const DuplicateDraftTaskDialog: React.FC<DuplicateDraftTaskDialogProps> = ({
    open, onClose, originalTaskName, title, onDuplicate,
}) => {
    const [newName, setNewName] = useState(originalTaskName);
    const [hasNameChanged, setHasNameChanged] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setNewName(originalTaskName);
            setHasNameChanged(false);
            setLoading(false);
        }
    }, [open, originalTaskName]);

    const handleDuplicate = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            await onDuplicate(newName.trim());
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[480px] border-b-4 border-b-[#001F3F] p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            {title ?? "Duplicate Draft"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">New draft name</Label>
                            <Input
                                placeholder="Draft name"
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value);
                                    setHasNameChanged(e.target.value !== originalTaskName);
                                }}
                                className="h-10"
                            />
                        </div>

                        {/* System description */}
                        <p className="mt-2 px-1 text-xs text-muted-foreground">
                            All fields will be duplicated exactly as is.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between px-6 py-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleDuplicate}
                        disabled={!newName.trim() || loading || !hasNameChanged}
                        className="text-white bg-[#001F3F] hover:bg-muted hover:text-[#001F3F] font-medium min-w-[110px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Duplicate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DuplicateDraftTaskDialog;
