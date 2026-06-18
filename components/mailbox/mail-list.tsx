import React, { useEffect } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useOpenProfileModal, useHasMore, useLoadMoreEmails, useEmailLoading, useSelectedEmail } from "@/stores/mailbox-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Email } from "@/types/mailbox.types";
import ProfileModal from "./ProfileModal";
import { useProfileStore } from "@/stores/profile-store";
import { formatLocalDate, formatLocalTime } from "@/utils/timezone-utils";

interface MailListProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
  selectedDateRange?: { start: Date | null; end: Date | null };
  selectedFilters?: string[];
}

dayjs.extend(isBetween);

const stripHtml = (html: string) => {
  if (!html) return "";
  const cleanText = html.replace(/<[^>]*>/g, "");
  return cleanText
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

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
  const selectedEmail = useSelectedEmail();

  const emailInfo = emails;
  // console.log("Email Information", emails.updatedBy.profilePicture)

  if (!emails || emails.length === 0) {
    return (
      <div data-testid="mail-list-empty" className="p-4 text-center text-sm text-muted-foreground">
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
    <div data-testid="mail-list-container" className="flex flex-col">
      {filteredEmails.length === 0 ? (
        <div data-testid="mail-list-no-results" className="p-4 text-center text-sm text-muted-foreground">
          No emails found for this date range.
        </div>
      ) : (
        filteredEmails.map((email) => (
          <div
            key={email._id}
            data-testid={`mail-list-item-${email._id}`}
            onClick={() => onEmailSelect(email)}
            className={`flex items-start gap-3 px-4 py-2 cursor-pointer transition-colors border-r-2 border-b ${selectedEmail?._id === email._id
              ? "bg-muted border-r-brand-orange border-b-transparent text-foreground font-semibold"
              : email.read
                ? "bg-background border-r-transparent border-border text-muted-foreground font-normal hover:bg-muted"
                : "bg-background border-r-transparent border-border text-foreground font-semibold hover:bg-primary/10"
              }`}
          >
            {/* Left Side: Avatar */}
            <Avatar
              data-testid={`mail-list-item-avatar-${email._id}`}
              className="h-7 w-7 cursor-pointer shrink-0 mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                openProfileModal({
                  name: email.eventData?.updatedBy?.name ?? "Unknown",
                  email: email.eventData?.updatedBy?.email,
                  profilePicture: email.eventData?.updatedBy?.profilePicture,
                  profilePictureUrl: email.eventData?.updatedBy?.profilePictureUrl,
                });
              }}
            >
              <AvatarImage
                src={email.eventData?.updatedBy?.profilePictureUrl ?? undefined}
                alt={email.eventData?.updatedBy?.name ?? "User"}
              />
              <AvatarFallback>
                {email.eventData?.updatedBy?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            {/* Right Side: Mail Info */}
            <div data-testid={`mail-list-item-content-${email._id}`} className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex justify-between items-baseline gap-2">
                <p
                  data-testid={`mail-list-item-subject-${email._id}`}
                  className="truncate font-medium text-sm text-foreground flex-1 min-w-0"
                >
                  {email.subject ?? "(No Subject)"}
                </p>
                <div data-testid={`mail-list-item-date-${email._id}`} className="flex items-center shrink-0">
                  {email.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatLocalDate(email.createdAt)}, {formatLocalTime(email.createdAt)}
                    </span>
                  )}
                </div>
              </div>
              <p
                data-testid={`mail-list-item-body-preview-${email._id}`}
                className="text-xs text-muted-foreground truncate"
              >
                {stripHtml(email.body || "")}
              </p>
            </div>
          </div>
        ))
      )}

      {/* ✅ Load More Button */}
      {hasMore && (
        <div data-testid="mail-list-load-more-wrapper" className="flex justify-end px-4 pb-2 pt-1">
          <button
            data-testid="mail-list-load-more-btn"
            onClick={() => loadMore()}
            disabled={loading}
            className="text-xs text-primary font-semibold px-4 py-2 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
      <ProfileModal data-testid="mail-list-profile-modal" />
    </div>
  );
};

export default MailList;
