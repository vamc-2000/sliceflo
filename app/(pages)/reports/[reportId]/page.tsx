"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import ReportDetails from "@/components/reports/ReportDetails";
import { useReportStore } from "@/stores/reports-store";

export default function ReportDetailsPage() {
  const { reportId } = useParams();
  const reportsLoaded = useRef(false);

  const { getReportById, activeReport, loading } = useReportStore();

  useEffect(() => {
    if (!reportId || reportsLoaded.current) return;

    const loadData = async () => {
      reportsLoaded.current = true;

      try {
        await getReportById(reportId as string);
      } catch (error) {
        console.error("Error loading report details:", error);
      }
    };

    loadData();
  }, [reportId, getReportById]);

  if (loading) {
    return <h1>Report Details Skeleton</h1>;
  }

  if (!activeReport?.id) {
    return <h1>Report Details Not Found</h1>;
  }

  return (
    <div className="overflow-hidden h-full">
      <div className="border-b">
        <Breadcrumbs />
      </div>
      <ReportDetails />
    </div>
  );
}



// "use client";

// import { useEffect } from "react";
// import { useParams } from "next/navigation";
// import { useReportStore } from "@/stores/reports-store";

// export default function ReportDetailsPage() {
//   const { reportId } = useParams();
//   const { getReportById, activeReport, loading } = useReportStore();

//   useEffect(() => {
//     if (reportId) {
//       getReportById(reportId as string);
//     }
//   }, [reportId]);

//   if (loading) return <div>Loading...</div>;
//   if (!activeReport) return <div>Report not found</div>;

//   return <div>{activeReport.name}</div>;
// }
