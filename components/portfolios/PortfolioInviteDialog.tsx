// components/portfolios/PortfolioInviteDialog.tsx

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface PortfolioInviteDialogProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  onSendInvite: (emails: string[]) => Promise<void>;
}

const PortfolioInviteDialog: React.FC<PortfolioInviteDialogProps> = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  onSendInvite,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const sharableLink = `${window.location.origin}/portfolios/${portfolioId}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      const email = inviteEmail.trim();
      if (email && !emailList.includes(email)) {
        setEmailList([...emailList, email]);
        setInviteEmail("");
      }
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter((email) => email !== emailToRemove));
  };

  const handleSendInvite = async () => {
    if (emailList.length === 0) return;

    setInviteLoading(true);
    try {
      await onSendInvite(emailList);
      setEmailList([]);
      onClose();
    } finally {
      setInviteLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard
      .writeText(sharableLink)
      .then(() => toast('success', { title: "Shareable link copied to clipboard!" }))
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        toast('error', { title: "Failed to copy shareable link. Please try again." });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to {portfolioName}</DialogTitle>
        </DialogHeader>

        {/* Shareable Link Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Invite with Shareable link</Label>
          <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
            <Input
              value={sharableLink}
              readOnly
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={copyLinkToClipboard}
              className="shrink-0 cusror-pointer"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Invite with email</Label>
          <div className="border rounded-md p-3 space-y-2">
            {/* Email Chips */}
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emailList.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Email Input */}
            <Input
              placeholder="Enter one or more email addresses"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#8E8E93]"
            />
          </div>

          {/* Helper Text */}
          <p className="text-xs text-muted-foreground">
            Press Enter, comma, or semicolon to add an email
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSendInvite}
            disabled={emailList.length === 0 || inviteLoading}
            className="w-full bg-[#001F3F] hover:bg-[#001F3F]/90"
          >
            {inviteLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Invite"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioInviteDialog;