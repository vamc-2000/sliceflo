import React, { useEffect } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useOpenProfileModal, useHasMore, useLoadMoreEmails, useEmailLoading } from "@/stores/mailbox-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Email } from "@/types/mailbox.types";
import ProfileModal from "./ProfileModal";
import { useProfileStore } from "@/stores/profile-store";

interface MailListProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
  selectedDateRange?: { start: Date | null; end: Date | null };
  selectedFilters?: string[];
}

dayjs.extend(isBetween);

const MailList: React.FC<MailListProps> = ({
  emails,
  onEmailSelect,
  selectedDateRange,
  selectedFilters = [],
}) => {
  const openProfileModal = useOpenProfileModal();
  const currentUserId = useProfileStore((state) => state.user?._id ?? state.user?.id);
  const hasMore = useHasMore();
  const loadMore = useLoadMoreEmails();
  const loading = useEmailLoading();

  const emailInfo = emails;
  // console.log("Email Information", emails.updatedBy.profilePicture)

  if (!emails || emails.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No emails found.
      </div>
    );
  }

  // Filter emails by date range
  const filteredEmails = emails.filter((email) => {
    // Date range filter
    if (selectedDateRange?.start && selectedDateRange?.end) {
      const emailDate = dayjs(email.createdAt);
      const start = dayjs(selectedDateRange.start).startOf("day");
      const end = dayjs(selectedDateRange.end).endOf("day");
      if (!emailDate.isBetween(start, end, null, "[]")) return false;
    }

    // ✅ Project filter
    const projectFilters = selectedFilters
      .filter((f) => f.startsWith("project:"))
      .map((f) => f.replace("project:", ""));

    if (projectFilters.length > 0) {
      const emailProjectId = email.eventData?.project?.id ?? "";
      if (!projectFilters.includes(emailProjectId)) return false;
    }

    // ✅ User filters
    if (selectedFilters.includes("user:Assigned to me")) {
      const assigneeId = email.eventData?.updatedFields?.assigneeId;  // ✅ correct path
      if (assigneeId !== currentUserId) return false;
    }

    if (selectedFilters.includes("user:Assigned by me")) {
      const updatedById = email.eventData?.assignerId?.id;  // ✅ person who made the update
      if (updatedById !== currentUserId) return false;
    }

    if (selectedFilters.includes("user:Mentioned")) {
      const mentionedIds = email.eventData?.updatedFields?.mentionedUserIds ?? [];
      if (!mentionedIds.includes(currentUserId ?? "")) return false;
    }

    if (selectedFilters.includes("user:Unread only")) {
      if (email.read) return false;
    }

    return true;
  });

  // console.log("Sample email eventData:", emails[0]?.eventData);
  // console.log("Sample email top-level keys:", Object.keys(emails[0] ?? {}));
  // console.log("Current userId:", currentUserId);

  return (
    <div className="divide-y divide-border">
      {filteredEmails.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No emails found for this date range.
        </div>
      ) : (
        filteredEmails.map((email) => (
          <div
            key={email._id}
            onClick={() => onEmailSelect(email)}
            className={`flex items-start gap-3 px-4 py-2 cursor-pointer transition-colors ${email.read
              ? "bg-background text-muted-foreground font-normal hover:bg-muted"     // read → muted
              : "text-foreground font-semibold hover:bg-primary/10"                  // unread → highlighted
              }`}
          >
            {/* Email content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                {/* LEFT SIDE */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* <Avatar
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfileModal({
                        name: email.eventData?.updatedBy?.name ?? "Unknown",
                        email: email.eventData?.updatedBy?.email,
                        profilePicture: email.eventData?.updatedBy?.profilePicture,
                      });
                    }}
                  >
                    <AvatarImage
                      src={email.eventData?.updatedBy?.profilePicture ?? ""}
                      alt={email.eventData?.updatedBy?.name ?? "User"}
                    />
                    <AvatarFallback>
                      {email.eventData?.updatedBy?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar> */}
                  <Avatar
                    className="h-7 w-7 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfileModal({
                        name: email.eventData?.updatedBy?.name ?? "Unknown",
                        email: email.eventData?.updatedBy?.email,
                        profilePicture: email.eventData?.updatedBy?.profilePicture,
                        profilePictureUrl: email.eventData?.updatedBy?.profilePictureUrl, // ✅ pass this too if ProfileModal uses it
                      });
                    }}
                  >
                    {/* ✅ Add src here */}
                    <AvatarImage
                      src={email.eventData?.updatedBy?.profilePictureUrl ?? undefined}
                      alt={email.eventData?.updatedBy?.name ?? "User"}
                    />
                    <AvatarFallback>
                      {email.eventData?.updatedBy?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <p className="truncate font-semibold text-sm">{email.eventData?.updatedBy?.name ?? "Unknown"}</p>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-0 shrink-0">
                  {email.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {dayjs(email.createdAt).format("DD MMM, hh:mm A")}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <p className="text-xs truncate font-medium">
                {email.subject ?? "(No Subject)"}
              </p>
            </div>
          </div>
        ))
      )}

      {/* ✅ Load More Button */}
      {hasMore && (
        <div className="flex justify-end px-4 pb-2 pt-1">
          <button
            onClick={() => loadMore()}
            disabled={loading}
            className="text-xs text-primary font-semibold px-4 py-2 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
      <ProfileModal />
    </div>
  );
};

export default MailList;
