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
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  description?: string;
  loading?: boolean;
  loadingLabel?: string;
  confirmClassName?: string;
  "data-testid"?: string;
}

export default function ConfirmationModal({
  open,
  onClose,
  title,
  confirmLabel,
  onConfirm,
  description,
  loading,
  loadingLabel,
  confirmClassName,
  "data-testid": testId,
}: ConfirmationModalProps) {

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        data-testid={testId ?? "modal-confirmation"}
        className="sm:max-w-md rounded-2xl border-0 border-b-[5px] border-primary p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center"
        >
          {/* Title */}
          <DialogHeader className="text-center pt-2">
            <DialogTitle asChild>
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </motion.h2>
            </DialogTitle>
          </DialogHeader>

          {/* Image */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 200,
            }}
            className="my-4"
          >
            <Image
              src="/images/illustration.svg"
              alt="Confirmation"
              width={100}
              height={100}
            />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {description ??
                "Deleting notifications is permanent and cannot be undone."}
            </DialogDescription>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full"
          >
            <DialogFooter className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                data-testid="btn-confirmation-cancel"
                className="flex-1 text-sm"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleConfirm}
                data-testid="btn-confirmation-confirm"
                disabled={loading}
                className={cn("flex-1 text-sm gap-2", confirmClassName)}
              >
                {loading ? (
                  <>
                    <Loader2
                      data-testid="spinner-confirmation-loading"
                      className="h-4 w-4 animate-spin"
                    />
                    {loadingLabel || "Removing..."}
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}