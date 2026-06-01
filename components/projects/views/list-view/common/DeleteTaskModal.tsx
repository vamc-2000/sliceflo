"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface DeleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count?: number;        // number of tasks being deleted
  loading?: boolean;
}

export default function DeleteTaskModal({
  open,
  onClose,
  onConfirm,
  count = 1,
  loading,
}: DeleteTaskModalProps) {
  const isSingle = count === 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[430px] rounded-2xl border-0 border-b-4 border-primary p-6">
        
        {/* Title */}
        <DialogHeader className="text-center pt-4">
          <DialogTitle className="text-center font-semibold text-sm">
            {isSingle
              ? "Are you sure want to delete this task?"
              : "Are you sure want to delete these tasks?"}
          </DialogTitle>
        </DialogHeader>

        {/* Trash illustration */}
        <div className="flex justify-center my-3">
          <Image
            src="/images/illustration.svg" // swap with your actual asset
            alt="Delete"
            width={90}
            height={90}
          />
        </div>

        {/* Description */}
        <DialogDescription className="text-center text-xs text-muted-foreground">
          We'll keep {isSingle ? "it" : "them"} in your trash for 30 days,
          and then permanently delete {isSingle ? "it" : "them"}.
        </DialogDescription>

        {/* Buttons */}
        <DialogFooter className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading
              ? "Deleting..."
              : isSingle ? "Delete Task" : "Delete Tasks"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}