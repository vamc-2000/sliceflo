// components/reports/ReportsDashoard.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { formatDateWithSuffix } from "@/utils/formatdate";
import { Star, Maximize2, Edit3Icon, Trash } from "lucide-react";
import IconContainer from "@/components/reports/common/IconContainer";
import { useReportStore } from "@/stores/reports-store";
import CreateReportPage from "./CreateReportPage";

const ReportsDashboard = () => {
    const {
        reports,
        reportsMeta,
        loading,
        selectedTab,
        createReport,
        toggleFavorite,
        deleteReport,
        updateReport,
        setSelectedTab,
    } = useReportStore();

    const getReports = useReportStore((state) => state.getReports);
    const router = useRouter();

    const safeMeta = reportsMeta ?? {
        currentPage: 1,
        pageCount: 1,
        totalReports: 0,
        perPage: 10,
    };

    const [reportUnderEdit, setReportUnderEdit] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

    // useEffect(() => {
    //     getReports();
    // }, [getReports]);

    const saveReportNameEdit = async (row: any) => {
        if (
            reportUnderEdit &&
            reportUnderEdit.name.trim() &&
            reportUnderEdit.name !== row.name
        ) {
            await updateReport(row.id, { name: reportUnderEdit.name.trim() });
        }

        setReportUnderEdit(null);
    };

    const handleCreateClick = () => {
        setViewMode('create');
    };

    return (
        <>
            {viewMode === 'list' ? (
                <>
                    <div className="flex justify-end mb-4">
                        <Button
                            // onClick={handleStartFromScratch}
                            onClick={handleCreateClick}
                            className="bg-[#001F3F] dark:bg-primary dark:text-primary-foreground"
                        >
                            Create Report
                        </Button>
                    </div>
                    <div className="rounded-md border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="w-100 text-muted-foreground">Report Name</TableHead>
                                    <TableHead className="text-muted-foreground">Date Created</TableHead>
                                    <TableHead className="text-muted-foreground">Date Updated</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {reports.map((row: any) => (
                                    <TableRow key={row.id} className="border-border">
                                        <TableCell className="text-foreground">
                                            <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                                                {reportUnderEdit?.id === row.id ? (
                                                    <input
                                                        className="bg-transparent outline-none border-none w-full max-w-80 text-foreground"
                                                        value={reportUnderEdit.name}
                                                        onChange={(e) =>
                                                            setReportUnderEdit({
                                                                ...reportUnderEdit,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        onBlur={() => saveReportNameEdit(row)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="truncate w-full max-w-80">
                                                        {row.name}
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-3">
                                                    <IconContainer
                                                        onClick={() => toggleFavorite(row)}
                                                        className={
                                                            row.isFavorite
                                                                ? "text-yellow-400"
                                                                : "text-muted-foreground hover:text-foreground"
                                                        }
                                                    >
                                                        <Star
                                                            className={`size-4 ${row.isFavorite ? "fill-yellow-400 animate-pulse" : ""
                                                                }`}
                                                        />
                                                    </IconContainer>

                                                    <Link href={`/reports/${row.id}`} target="_blank">
                                                        <Maximize2 className="size-4 text-muted-foreground hover:text-foreground" />
                                                    </Link>

                                                    <IconContainer
                                                        onClick={() => setReportUnderEdit(row)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Edit3Icon className="size-4" />
                                                    </IconContainer>

                                                    <IconContainer
                                                        onClick={() => deleteReport(row.id)}
                                                        className="text-muted-foreground hover:text-red-500"
                                                    >
                                                        <Trash className="size-4" />
                                                    </IconContainer>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">
                                            {formatDateWithSuffix(row.createdAt)}
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">
                                            {formatDateWithSuffix(row.updatedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Simple Pagination */}
                        <div className="flex justify-between items-center p-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">
                                Page {reportsMeta?.currentPage} of{" "}
                                {reportsMeta?.pageCount}
                            </span>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground hover:bg-muted"
                                    disabled={reportsMeta?.currentPage === 1}
                                    onClick={() =>
                                        getReports(safeMeta.currentPage - 1)
                                    }
                                >
                                    Previous
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground hover:bg-muted"
                                    disabled={
                                        reportsMeta?.currentPage ===
                                        reportsMeta?.pageCount
                                    }
                                    onClick={() =>
                                        getReports(safeMeta.currentPage + 1)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <CreateReportPage
                    onCancel={() => setViewMode('list')}
                // onSuccess={() => {
                //     setViewMode('list');
                //     getReports(); // Refresh list after creation
                // }}
                />
            )}
        </>
    );
};

export default ReportsDashboard;
