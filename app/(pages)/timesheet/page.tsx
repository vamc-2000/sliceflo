// app/(pages)/timesheet/page.tsx
"use client";
import { LandingPage } from "@/components/LandingPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { Loader } from "@/components/Loader";

export default function TimesheetPage() {
  const router = useRouter();
  const [showTimesheet, setShowTimesheet] = useState(false);
  const { timesheets, fetchTimesheets, isTimesheetsLoading } = useTimesheetStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkTimesheets() {
      try {
        await fetchTimesheets({ page: 1, limit: 50 });
      } catch (err) {
        console.error("Failed to fetch timesheets:", err);
      } finally {
        setIsChecking(false);
      }
    }
    checkTimesheets();
  }, [fetchTimesheets]);

  useEffect(() => {
    if (!isChecking && timesheets.length > 0) {
      router.push("/timesheet/create");
    }
  }, [isChecking, timesheets, router]);

  function handleCreate() {
    setShowTimesheet(true);
  }

  if (isChecking || (timesheets.length > 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-12">
        <Loader
          message="Checking for timesheets..."
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="border-b">
        <Breadcrumbs />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <LandingPage
          title="Keep Work on Track with Effortless Time Logging"
          description="Track time in real-time, managers stay in the loop. Effortless accountability for every task and project."
          extraText="Your Time Matters—Keep it in Check"
          imageSrc="/images/timesheet-image.svg"
          imageAlt="Timesheet illustration"
          buttonText="Take Control Today"
          onButtonClick={() => router.push("/timesheet/create")}
        />
      </div>
      {/* <div className="h-full overflow-auto">
        {!showTimesheet ? (

          <LandingPage
            title="Build Powerful Teams with Seamless Collaboration"
            description="Empower your teams to connect, communicate, and achieve together. Break down silos, foster synergy, and drive projects forward with ease."
            extraText="Your Team's Success Starts Here—Unleash Their Potential Today"
            imageSrc="/images/timesheet-image.svg"
            imageAlt="Teams illustration"
            buttonText="Create a Team Now"
            onButtonClick={handleCreate}
          />
        ) : (
          <CreateTimesheet  />
        )}

      </div> */}
    </div>
  );
}
