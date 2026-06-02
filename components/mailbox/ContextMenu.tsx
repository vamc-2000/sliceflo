"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { Mail, Clock, Trash, ExternalLink } from "lucide-react";
import { mailStore } from "@/stores/mailbox-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useState } from "react";

interface ShadContextMenuProps {
  children: React.ReactNode; // The row/cell you right-click on
  emailId: string;
}

export default function ShadContextMenu({ children, emailId }: ShadContextMenuProps) {
  const markAsUnread = mailStore((s) => s.markAsUnread);
  const removeEmail = mailStore((s) => s.removeEmail);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    removeEmail(emailId);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <ContextMenu>
        {/* Trigger — wrap whatever you want to right-click */}
        <ContextMenuTrigger data-testid="context-menu-trigger" className="w-full">
          {children}
        </ContextMenuTrigger>

        <ContextMenuContent data-testid="context-menu-content" className="w-48">
          <ContextMenuItem
            data-testid="context-menu-mark-unread"
            onClick={() => markAsUnread(emailId)}
          >
            <Mail className="mr-2 h-4 w-4" /> Mark as Unread
          </ContextMenuItem>

          <ContextMenuItem
            data-testid="context-menu-open-new-tab"
            onClick={() => window.open(`/mailbox/mail/${emailId}`, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
          </ContextMenuItem>

          <ContextMenuItem
            data-testid="context-menu-snooze"
            onClick={() => console.log("Snooze coming soon")}
          >
            <Clock className="mr-2 h-4 w-4" /> Snooze
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            data-testid="context-menu-delete"
            onClick={() => setDeleteModalOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete Notification
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        data-testid="context-menu-delete-modal"
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Are you sure you want to delete this notification?"
        confirmLabel="Delete notification"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
