// components/projects/ProjectInviteDialog.tsx

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

interface ProjectInviteDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSendInvite: (emails: string[]) => Promise<void>;
}

const ProjectInviteDialog: React.FC<ProjectInviteDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  onSendInvite,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const sharableLink = `${window.location.origin}/project/${projectId}`;

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
          <DialogTitle className="text-sm font-bold text-foreground">Invite to {projectName}</DialogTitle>
        </DialogHeader>

        {/* Shareable Link Section */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">Invite with Shareable link</Label>
          <div className="flex items-center gap-2 p-2 border border-border rounded-md bg-muted h-9">
            <Input
              value={sharableLink}
              readOnly
              className="border-0 bg-transparent focus-visible:ring-0 p-0 text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={copyLinkToClipboard}
              className="shrink-0 cursor-pointer"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email Section */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">Invite with email</Label>
          <div className="border border-border rounded-md p-2 space-y-2">
            {/* Email Chips */}
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emailList.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 text-xs">
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
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-muted-foreground placeholder:text-muted-foreground text-xs h-7"
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs"
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

export default ProjectInviteDialog;
