"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TimesheetHeader } from "@/components/timesheets/TimesheetHeader";
import { TimesheetBody } from "@/components/timesheets/TimeSheets/TimesheetBody";
import { Separator } from "@/components/ui/separator";
import { DateHeader } from "@/components/timesheets/DateHeader";
import ApprovalsBody from "@/components/timesheets/Approvals/ApprovalsBody";
import TimeEntriesBody from "@/components/timesheets/TimeEntries/TimeEntriesBody";
import TimessheetPage from "@/components/timesheets/TimeSheets/TimessheetPage";
import { endOfWeek, startOfWeek } from "date-fns";
import { CalendarRow } from "@/components/timesheets/MyTeamTimesheets/CalendarRow";
import TeamListView from "@/components/timesheets/MyTeamTimesheets/TeamListView";

export type TimesheetTab = "teams" | "my" | "approvals";
export type MyTimesheetView = "timesheet" | "clipboard" | "month";
export type TeamView = "calendar" | "list";
export type TeamFilter = "all" | "approved" | "awaiting_approval" | "rejected";

export default function TimesheetCreatePage() {
  const [activeTab, setActiveTab] = useState<TimesheetTab>("my");
  const [myView, setMyView] = useState<MyTimesheetView>("timesheet");
  const [teamView, setTeamView] = useState<TeamView>("list");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [open, setOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<Date | undefined>(undefined);

  const [selectedWeek, setSelectedWeek] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday — matches backend weekStart
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Breadcrumbs - fixed */}
      <div className="border-b flex-none">
        <Breadcrumbs />
      </div>

      {/* Header - fixed */}
      <div className="flex-none">
        <TimesheetHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myView={myView}
          onMyViewChange={setMyView}
        />
      </div>

      {/* Date Header + Separator - fixed */}
      {activeTab === "teams" && (
        <>
          <div className="flex-none">
            <Separator className="my-0 h-px" />
          </div>

          <div className="flex-none">
            <CalendarRow
              onAddEntry={() => setOpen(true)}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              myView={myView}
              view={teamView}
              setView={setTeamView}
              teamFilter={teamFilter}        // pass down
              setTeamFilter={setTeamFilter}
            />
          </div>
        </>
      )}

      {activeTab === "my" && (
        <>
          <div className="flex-none">
            <Separator className="my-0 h-px" />
          </div>

          <div className="flex-none">
            <DateHeader
              onAddEntry={() => {
                setPrefillDate(selectedWeek.start);
                setOpen(true);
              }}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              myView={myView}
            />
          </div>
        </>
      )}

      {/* ONLY THIS scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-1">
        {activeTab === "teams" && (
          <>
            {teamView === "list" ? (  // You'll need to lift 'view' state up or use context/store
              <TeamListView selectedWeek={selectedWeek} teamFilter={teamFilter} />
            ) : (
              // Your existing calendar/teams content
              <div>Your existing teams calendar content</div>
            )}
          </>
        )}

        {activeTab === "my" && (
          myView === "timesheet"
            ? <TimessheetPage
                open={open}
                setOpen={(v) => {
                  setOpen(v);
                  if (!v) setPrefillDate(undefined);
                }}
                selectedWeek={selectedWeek}
                prefillDate={prefillDate}
              />
            : <TimeEntriesBody selectedWeek={selectedWeek} />
        )}

        {activeTab === "approvals" && (
          <>
            <div className="flex-none">
              <Separator className="my-0 h-px" />
            </div>
            <ApprovalsBody 
              onNavigateToTimesheet={(weekStart) => {
                const weekStartDate = new Date(weekStart);
                setSelectedWeek({
                  start: weekStartDate,
                  end: endOfWeek(weekStartDate, { weekStartsOn: 1 })
                });
                setActiveTab("my");
                setMyView("timesheet");
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
