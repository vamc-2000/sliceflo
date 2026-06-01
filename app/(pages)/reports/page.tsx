"use client";

import { useEffect } from "react";
import { LandingPage } from "@/components/LandingPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/navigation";
import { useReportStore } from "@/stores/reports-store";
import ReportsDashboard from "@/components/reports/ReportsDashoard";

export default function ReportsPage() {
  const router = useRouter();

  const { reports, getReports, loading } = useReportStore();
  console.log("Reports: ", reports);

  console.log("Reports length: ", reports.length);

  // useEffect(() => {
  //   if (reports.length === 0) {
  //     getReports();
  //   }
  // }, [reports.length, getReports]);

  useEffect(() => {
    getReports();
  }, []);


  return (
    <div className="overflow-hidden h-full flex flex-col">
      <div className="border-b shrink-0">
        <Breadcrumbs />
      </div>

      <div className="flex-1 overflow-auto px-6 py-3">
        {loading ? (
          <h1>Loading reports...</h1>
        ) : reports.length > 0 ? (
          <ReportsDashboard />
        ) : (
          <LandingPage
            title="Turn Data into Decisions with Powerful Reporting"
            description="Create custom reports with actionable insights from your projects and portfolios. Select widgets, visualize data, and make smarter decisions - all in one place."
            extraText="Start visualizing your data and unlocking insights today."
            imageSrc="/images/reports/reports-image.svg"
            imageAlt="Reports illustration"
            buttonText="Create Your First Report"
            onButtonClick={() => router.push("/reports/create")}
          />
        )}
      </div>
    </div>
  );
}
