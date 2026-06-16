// components/reports/Templates.tsx
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import TemplateCard from "@/app/reports/components/TemplateCard";
// import { RootState, AppDispatch } from "@/store/store";
// import {
//     fetchTemplates,
//     ReportTemplate,
//     setCreateModalOpen,
// } from "@/store/slices/reportsSlice";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
// import Skeleton from "@mui/material/Skeleton";

interface TemplatesProps {
    // onTemplateSelect: (template: ReportTemplate) => void;
    className?: string;
    dashboard?: boolean;
}

export default function Templates({
    // onTemplateSelect,
    className,
    dashboard,
}: TemplatesProps) {
    // const dispatch = useDispatch<AppDispatch>();
    const [isLoading, setIsLoading] = useState(true);
    // const templates = useSelector((state: RootState) => state.reports.templates);

    // useEffect(() => {
    //     const loadTemplates = async () => {
    //         try {
    //             setIsLoading(true);
    //             // await dispatch(fetchTemplates({})).unwrap();
    //         } catch (error) {
    //             console.error("Failed to fetch templates:", error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     loadTemplates();
    // }, [dispatch]);

    // const handleTemplateClick = (template: ReportTemplate) => {
    //     onTemplateSelect(template);
    //     dispatch(setCreateModalOpen(true));
    // };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center bg-card border border-border shadow-sm dark:shadow-none px-4 py-3 rounded-xl w-full",
                className
            )}
        >
            <h2 className="text-sm 2xl:text-base font-semibold text-foreground">
                {dashboard ? "Start with Template" : "Templates"}
            </h2>

            <div className="flex flex-col items-center justify-center gap-4 mt-3 2xl:mt-4 w-full">
                <p className="text-sm 2xl:text-base font-medium text-muted-foreground">
                    No templates found. Please start from scratch.
                </p>
                {isLoading ? (
                    <>
                    </>
                ) : (
                    <>
                        <p className="text-sm 2xl:text-base font-medium text-muted-foreground">
                            No templates found. Please start from scratch.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
