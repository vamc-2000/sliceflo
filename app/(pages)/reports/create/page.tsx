"use client";

import Image from "next/image";
// import Templates from "@/app/reports/components/Templates";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Templates from "@/components/reports/Templates";
import { useReportStore } from "@/stores/reports-store";
import CreateReportPage from "@/components/reports/CreateReportPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function ReportsCreatePage() {
    //   const dispatch = useDispatch<AppDispatch>();
    //   const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [viewMode, setViewMode] = useState<"templates" | "create">("templates");

    const router = useRouter();
    const { createReport } = useReportStore();
    //   useEffect(() => {
    //     dispatch(fetchProjects({}));
    //   }, [dispatch]);

    //   const handleTemplateSelect = (template: ReportTemplate) => {
    //     setSelectedTemplate(template);
    //   };

    const handleStartFromScratch = () => {
        setViewMode("create");
    };

    return (
        <>
            {viewMode === "templates" ? (
                <div className="flex flex-col items-center justify-center max-w-4xl mx-auto text-center py-10 px-4">
                    <h1 className="text-2xl 2xl:text-3xl font-bold text-primary">
                        Choose a Report Template
                    </h1>

                    <p className="text-base 2xl:text-lg mt-4 2xl:mt-6 text-center text-[#6E6E6E] font-normal">
                        Get started with a Report template or create a custom Report to fit
                        your exact needs.
                    </p>

                    <div className="flex flex-col md:flex-row items-stretch gap-12 mt-8 2xl:mt-12 w-full">
                        <Templates className="w-full md:w-1/2 min-h-100" />

                        <div
                            className="flex flex-col items-center justify-center shadow-[0px_0px_10px_0px_#D9D9D9] p-6 rounded-xl w-full md:w-1/2 min-h-100 cursor-pointer hover:scale-[1.001] transition-transform"
                            onClick={handleStartFromScratch}
                        >
                            <Image
                                src="/images/reports/scratchTemplate.svg"
                                alt="Start from scratch"
                                width={200}
                                height={200}
                                className="w-52 h-52"
                            />

                            <span className="text-base 2xl:text-xl font-semibold text-[#001F3F] mt-6">
                                Build on your own
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden h-full flex flex-col">
                    <div className="border-b shrink-0">
                        <Breadcrumbs />
                    </div>
                    <div className="px-6 overflow-y-auto flex-1">
                        <CreateReportPage onCancel={() => setViewMode("templates")} />
                    </div>
                </div>
            )}
        </>
    );
}
