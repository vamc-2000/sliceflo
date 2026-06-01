// components/portfolios/ArchivePortfolioModal.tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  // Pass mode="restore" to reuse for unarchiving
  mode?: "archive" | "restore";
  portfolioName?: string;
  // Override title/description/confirmLabel if needed
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function ArchivePortfolioModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  mode = "archive",
  portfolioName,
  title,
  description,
  confirmLabel,
}: Props) {
  const isArchive = mode === "archive";

  const resolvedTitle =
    title ?? (isArchive ? "Archive Portfolio" : "Restore Portfolio");

  const resolvedDescription =
    description ??
    (isArchive
      ? `Archive "${portfolioName ?? "this portfolio"}"? It will be hidden from the active list but can be restored at any time.`
      : `Restore "${portfolioName ?? "this portfolio"}"? It will reappear in the active portfolios list.`);

  const resolvedLabel =
    confirmLabel ?? (isArchive ? "Archive" : "Restore");

  const Icon = isArchive ? Archive : RotateCcw;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-b-[5px] border-b-[#001F3F] rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isArchive ? "bg-orange-100" : "bg-green-100"
              )}>
              <Icon
                className={cn(
                  "h-5 w-5",
                  isArchive ? "text-orange-600" : "text-green-600"
                )}
              />
            </div>
            <DialogTitle className="text-base font-semibold">
              {resolvedTitle}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
            {resolvedDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 gap-2",
              isArchive
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            )}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {loading ? (isArchive ? "Archiving..." : "Restoring...") : resolvedLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}