// components/projects/CreateTaskByEmailDialog.tsx
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface CreateTaskByEmailDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
}

// Generates a deterministic-looking project email from the projectId
function generateProjectEmail(projectId: string): string {
    // Simulate the format shown in screenshot: a.t.{numbers}.u-{numbers}...@tasks.sliceflo.com
    const numericHash = projectId
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const timestamp = 901605342500 + numericHash;
    const suffix = 15856 + (numericHash % 1000);
    return `a.t.${timestamp}.u-${suffix}@tasks.sliceflo.com`;
}

export function CreateTaskByEmailDialog({
    open,
    onClose,
    projectId,
}: CreateTaskByEmailDialogProps) {
    const email = generateProjectEmail(projectId);

    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [skipModal, setSkipModal] = useState(false);
    // In a real app this would be stored in project settings
    const [currentEmail, setCurrentEmail] = useState(email);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentEmail);
            setCopied(true);
            toast('success', { title: "Email address copied!" });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast('error', { title: "Failed to copy email" });
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        // Simulate regeneration — in real app call an API
        await new Promise(r => setTimeout(r, 800));
        const newSuffix = Math.floor(Math.random() * 90000) + 10000;
        const newTimestamp = Math.floor(Date.now() / 1000);
        setCurrentEmail(`a.t.${newTimestamp}.u-${newSuffix}@tasks.sliceflo.com`);
        setRegenerating(false);
        toast('success', { title: "Email address regenerated!" });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-b-[5px] border-b-primary">
                {/* Header */}
                <div className="px-6 pt-6 pb-5">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">
                            Create tasks by email
                        </DialogTitle>
                    </DialogHeader>

                    {/* Description */}
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                        You can send or forward emails to this address to create tasks and
                        attach the email to them:
                    </p>

                    {/* Email address row */}
                    <div className="mt-4 flex items-center gap-2">
                        {/* Email pill */}
                        <div className="flex-1 flex items-center px-3 py-2 rounded-lg bg-muted border text-xs text-foreground overflow-hidden">
                            <span className="truncate">{currentEmail}</span>
                        </div>

                        {/* Regenerate button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0"
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            title="Regenerate email address"
                        >
                            <RefreshCw
                                className={cn("h-4 w-4", regenerating && "animate-spin")}
                            />
                        </Button>

                        {/* Copy button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0"
                            onClick={handleCopy}
                            title="Copy email address"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Skip modal checkbox */}
                    <div className="mt-4 flex items-center gap-2.5">
                        <Checkbox
                            id="skip-modal"
                            checked={skipModal}
                            onCheckedChange={(checked) => setSkipModal(!!checked)}
                            className="h-4 w-4"
                        />
                        <label
                            htmlFor="skip-modal"
                            className="text-xs text-muted-foreground cursor-pointer select-none"
                        >
                            Skip this modal and copy email every time
                        </label>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}