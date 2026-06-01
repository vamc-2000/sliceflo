'use client';

import MailHeader from "@/components/mailbox/mail-header";
import { Separator } from "@/components/ui/separator";
import MailList from "@/components/mailbox/mail-list";
import { useEmails, useSelectedEmail, useEmailInitialized, useFetchEmails, useSetSelectedEmail, useMarkAsRead, useMarkAsUnread } from "@/stores/mailbox-store";
import { useEffect, useMemo, useState } from "react";
import EmptyMail from "@/components/mailbox/EmptyMail";
import EmptyMailbox from "@/components/mailbox/EmptyMailbox";
import MailDisplay from "@/components/mailbox/mail-display";
import { useRouter, usePathname } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { LandingPageForMailbox } from "@/components/mailbox/LandingPageForMailbox";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type SortOption = "showRead" | "showUnreadFirst" | "showSnoozed" | null;

export default function MailboxPage() {
  const emails = useEmails();
  const selectedEmail = useSelectedEmail();
  const initialized = useEmailInitialized();
  const fetchEmails = useFetchEmails();
  const setSelectedEmail = useSetSelectedEmail();
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();

  const router = useRouter();
  const pathname = usePathname();

  const [sortOption, setSortOption] = useState<SortOption>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Get ID from the URL path: /mailbox/123
  const idFromPath = pathname.split("/")[2] || null;

  // Derive whether a calendar date filter is active
  const isCalendarActive = selectedDateRange.start !== null || selectedDateRange.end !== null;

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  //   useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchEmails(); // fetch latest emails
  //   }, 5000); // every 5 seconds
  //   return () => clearInterval(interval);
  // }, [fetchEmails]);

  // Auto select email when URL contains /mailbox/<id>
  useEffect(() => {
    if (!initialized) return;
    if (!idFromPath) return;

    const found = emails.find((e) => String(e._id) === idFromPath);
    if (found) {
      setSelectedEmail(found);
    }
  }, [initialized, emails, idFromPath, setSelectedEmail]);

  // Shallow routing when clicking an email
  const handleSelectEmail = (email: any) => {
    setSelectedEmail(email);
    if (!email.read) {
      markAsRead(email._id);
    }
    router.push(`/mailbox/${email._id}`, { scroll: false });
  };

  const filteredEmails = useMemo(() => {
    let result = [...emails];

    switch (sortOption) {
      case "showRead":
        result = result.filter((email) => email.read);
        break;
      case "showUnreadFirst":
        result = [...result].sort(
          (a, b) => Number(a.read) - Number(b.read)
        );
        break;
      case "showSnoozed":
        result = result.filter((email) => email.snoozed);
        break;
    }

    // ✅ Project filter
    const projectFilters = selectedFilters
      .filter((f) => f.startsWith("project:"))
      .map((f) => f.replace("project:", ""));

    if (projectFilters.length > 0) {
      result = result.filter((email) =>
        projectFilters.includes(email.eventData?.project?.id ?? "")
      );
    }

    // ✅ Task priority filter
    const priorityFilters = selectedFilters
      .filter((f) => f.startsWith("priority:"))
      .map((f) => f.replace("priority:", ""));

    if (priorityFilters.length > 0) {
      result = result.filter((email) =>
        priorityFilters.includes(email.eventData?.task?.priority ?? "")
      );
    }

    // ✅ Task type filter
    const taskTypeFilters = selectedFilters
      .filter((f) => f.startsWith("taskType:"))
      .map((f) => f.replace("taskType:", ""));

    if (taskTypeFilters.length > 0) {
      result = result.filter((email) => {
        const typeStr = email.eventData?.task?.taskType ?? email.eventData?.task?.type ?? email.eventData?.task?.taskTypeConfig?.value ?? email.eventData?.task?.taskTypeConfig?._id ?? "";
        return taskTypeFilters.includes(typeStr);
      });
    }

    // ✅ Task status filter
    const statusFilters = selectedFilters
      .filter((f) => f.startsWith("status:"))
      .map((f) => f.replace("status:", ""));

    if (statusFilters.length > 0) {
      result = result.filter((email) =>
        statusFilters.includes(email.eventData?.task?.status ?? "")
      );
    }

    // From (updatedBy) filter
    const fromFilters = selectedFilters
      .filter((f) => f.startsWith("from:"))
      .map((f) => f.replace("from:", ""));

    if (fromFilters.length > 0) {
      result = result.filter((email) => {
        const u = email.eventData?.updatedBy ?? email.updatedBy;
        return fromFilters.includes(u?.id ?? "");
      });
    }

    return result;
  }, [emails, sortOption, selectedFilters]);

  if (initialized && emails.length === 0) {
    return (
      <LandingPageForMailbox
        title="One Inbox for All Your Project Updates"
        description="Get updates about all tasks, milestones, etc. Even get emails based on projects from your Project peers."
        imageSrc="/images/mailbox/mailbox-image.svg"
        imageAlt="Mailbox illustration"
        buttonText="Update Email Preferences"
      // onButtonClick={() => router.push("/reports/create")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER - Breadcrumbs and/or actions, horizontally at top */}
      {/* <Breadcrumbs /> */}
      <div className="border-b shrink-0">
        {/* <Separator /> */}
        <MailHeader
          sortOption={sortOption}
          setSortOption={setSortOption}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          isCalendarActive={isCalendarActive}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
        />
      </div>

      {/* MAIN CONTENT AREA: Two panels side by side */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel: Mail List */}
        <aside className="w-[390px] border-r border-border bg-background flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 pb-10">
            {/* {filteredEmails.length === 0 ? (
              <EmptyMail />              
            ) : ( */}
            <MailList
              emails={filteredEmails}
              // selectedEmail={selectedEmail}
              onEmailSelect={handleSelectEmail}
              selectedDateRange={selectedDateRange}
              selectedFilters={selectedFilters}
            />
            {/* )} */}
          </div>
        </aside>

        {/* Right Panel: Mail Display */}
        <main className="flex-1 bg-background flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 pb-6">
            {/* {filteredEmails.length === 0 ? (
              <EmptyMailbox />
            ) : ( */}
            <MailDisplay
              mail={selectedEmail}
            // sortOption={sortOption}
            // setSortOption={setSortOption}
            />
            {/* )} */}
          </div>
        </main>
      </div>
    </div>
  );
}
