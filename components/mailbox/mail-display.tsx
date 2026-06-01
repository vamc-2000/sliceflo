import { addDays, addHours, format, nextSaturday } from "date-fns";

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Email } from "@/types/mailbox.types"
import Image from "next/image";
import { MdOutlineMarkEmailUnread, MdSnooze } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { mailStore } from "@/stores/mailbox-store";
import { useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { LuMailOpen } from "react-icons/lu";
import ShadContextMenu from "./ContextMenu";
import SnoozeButton from "./SnoozeButton";
import EmptyMailbox from "./EmptyMailbox";
import { toast } from "sonner";

interface MailDisplayProps {
  mail: Email | null
}

export default function MailDisplay({ mail }: MailDisplayProps) {
  const today = new Date();
  // const { markEmailAsUnread } = useEmails();
  const markAsUnread = mailStore((state) => state.markAsUnread);
  const markAsRead = mailStore((state) => state.markAsRead);
  const removeEmail = mailStore((state) => state.removeEmail);
  const emails = mailStore((state) => state.emails);
  const setSelectedEmail = mailStore((state) => state.setSelectedEmail);

  const selectedMail = mail ? emails.find((e) => e._id === mail._id) ?? mail : null;

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const handleDelete = async () => {
    if (!mail || !emails.length) return;

    try {
      // ✅ Find next email BEFORE deletion (emails still includes current)
      const currentIndex = emails.findIndex(email => email._id === mail._id);
      let nextEmail: Email | null = null;

      // Next email
      if (currentIndex + 1 < emails.length) {
        nextEmail = emails[currentIndex + 1];
      }
      // Previous email (if no next)
      else if (currentIndex - 1 >= 0) {
        nextEmail = emails[currentIndex - 1];
      }

      // ✅ Delete current email
      await removeEmail(mail._id);

      // ✅ Auto-select next/previous email (store expects full Email object)
      if (nextEmail) {
        setSelectedEmail(nextEmail); // ✅ Pass full Email object

        // ✅ Mark next email as READ
        if (!nextEmail.read) {
          await markAsRead(nextEmail._id);
        }
      }

      setDeleteModalOpen(false);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center ">
        <div className="flex items-center gap-2">

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                className="h-12 w-12"
                onClick={() => {
                  // if (mail) markEmailAsUnread(mail.id);
                  if (!selectedMail) return;
                  if (selectedMail.read) {
                    markAsUnread(selectedMail._id);
                  } else {
                    markAsRead(selectedMail._id);
                  }
                }}
              >
                {selectedMail?.read ? (
                  <LuMailOpen className="h-4.5! w-4.5! text-muted-foreground" />
                ) : (
                  <MdOutlineMarkEmailUnread className="h-5! w-5! text-muted-foreground" />
                )}
                {/* <span className="sr-only">Mark as Unread</span> */}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" >
              {selectedMail?.read ? "Mark as unread" : "Mark as read"}
            </TooltipContent>
          </Tooltip>

          {/* <SnoozeButton
            open={snoozeOpen}
            onClose={() => setSnoozeOpen(false)}
            email={mail}
            onSnoozeSelect={(email) => {
              console.log("Email snoozed:", email);
            }}
          /> */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail} onClick={() => setDeleteModalOpen(true)} className="group">
                <RiDeleteBin6Line className="h-5! w-5! text-muted-foreground group-hover:text-red-600" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Delete</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">

        </div>
      </div>
      <Separator />
      {mail ? (
        <ShadContextMenu emailId={mail._id}>
          <div className="flex flex-1 flex-col">
            <div className="flex items-start p-4">
              <h2 className="text-xl font-bold text-foreground">{mail.subject}</h2>

              {mail.createdAt && (
                <div className="ml-auto text-xs text-muted-foreground">
                  {format(new Date(mail.createdAt), "PPpp")}
                </div>
              )}
            </div>

            {mail.body ? (
              <div
                className="p-6 text-sm leading-relaxed "
                dangerouslySetInnerHTML={{ __html: mail.body }}
              />
            ) : (
              <p className="p-6 text-sm leading-relaxed">{mail.body}</p>
            )}

          </div>
        </ShadContextMenu>
      ) : (
        <div className="flex flex-1 items-center justify-center ">
          <div className="text-center text-muted-foreground text-sm gap-4">
            <EmptyMailbox />
            You don&apos;t select any email in your inbox
          </div>
        </div>
      )}

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Are you sure you want to delete the mail?"
        confirmLabel="Delete"
        // onConfirm={async () => {
        //   if (mail) {
        //     await removeEmail(mail._id);  // DELETE the actual email
        //     setDeleteModalOpen(false);    // ✅ CLOSE MODAL
        //     toast.success("Notification deleted");
        //   }
        // }}
        onConfirm={handleDelete}
      />

    </div>
  )
}
