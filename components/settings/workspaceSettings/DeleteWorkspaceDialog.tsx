import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName: string;
}

export const DeleteWorkspaceDialog = ({
  isOpen,
  onClose,
  onConfirm,
  workspaceName,
}: DeleteWorkspaceDialogProps) => {
  const [nameInput, setNameInput] = useState("");
  const [phraseInput, setPhraseInput] = useState("");

  const isValid = 
    nameInput === workspaceName && 
    phraseInput === "delete my workspace";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increased width to 650px and set p-6 to reduce height */}
      <DialogContent className="sm:max-w-[650px] p-6 rounded-lg gap-0">
        <div className="flex gap-4 items-start">
          {/* Icon container remains proportional */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <DialogHeader className="p-0">
              <DialogTitle className="text-[18px] font-semibold text-[#1a1a1a]">
                Are you sure you want to delete this workspace?
              </DialogTitle>
            </DialogHeader>

            <p className="text-[13px] text-muted-foreground leading-snug">
              You are about to delete the workspace <span className="font-bold text-foreground">{workspaceName}</span>. 
              If you confirm, you will lose access to all your work data without any way to restore it.
            </p>

            {/* Inputs are grouped tightly to keep height low */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-gray-600">Type in this workspace's name to continue.</p>
                <Input
                  placeholder={workspaceName}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-9 bg-white border-gray-200 rounded-md focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-gray-600">
                  For final confirmation, type <span className="font-bold text-black">delete my workspace</span> below.
                </p>
                <Input
                  value={phraseInput}
                  onChange={(e) => setPhraseInput(e.target.value)}
                  className="h-9 bg-white border-gray-200 rounded-md focus-visible:ring-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-9 px-4 text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            disabled={!isValid} 
            onClick={() => {
                onConfirm();
                onClose();
            }}
            className={`h-9 px-6 font-medium rounded-md transition-colors ${
                isValid 
                ? "bg-[#ff9c9c] hover:bg-[#ff7a7a] text-white" 
                : "bg-[#ffdada] text-white cursor-not-allowed"
            }`}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};