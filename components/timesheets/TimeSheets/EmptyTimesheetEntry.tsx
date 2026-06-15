"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface EmptyTimesheetEntriesProps {
    onAddEntry?: () => void;
}

export function EmptyTimesheetEntries({ onAddEntry }: EmptyTimesheetEntriesProps) {
    return (
        <div data-testid="empty-timesheet-container" className="rounded-lg border border-border bg-background">
            {/* Header (NO padding gap) */}
            <div className="
                sticky top-0 z-10
                grid grid-cols-[2fr_1.5fr_auto]
                md:grid-cols-[2fr_3fr_1fr_1fr_1fr_max-content_auto] rounded-t-lg
                border-b bg-muted/50 text-sm font-semibold text-foreground text-center
            ">
                <div className="px-4 py-3 border-r order-1">Task</div>

                <div className="hidden md:block px-4 py-3 border-r order-2">Description</div>
                {/* <div className="hidden md:block px-4 py-3 border-r text-center order-3">Billable</div> */}
                <div className="hidden md:block px-4 py-3 border-r order-4">Tags</div>
                <div className="hidden md:block px-4 py-3 border-r order-5">Start Time</div>
                <div className="hidden md:block px-4 py-3 border-r order-6">End Time</div>

                <div className="px-4 py-3 whitespace-nowrap order-2 md:order-7 md:border-r">
                    Tracked Time
                </div>

                <div className="px-4 py-3 text-center order-3 md:order-8">
                    Action
                </div>

            </div>

            {/* Body (centered empty state) */}
            <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                <div className="relative h-20 w-20">
                    <Image
                        src="/images/Timesheet/entry-log.svg"
                        alt="Timer"
                        fill
                        className="object-contain"
                    />
                </div>

                <h2 className="mt-4 text-base font-semibold text-foreground">
                    No time entries for this week
                </h2>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    You haven’t tracked any time for this week.
                </p>
                <p className="text-sm text-muted-foreground">
                    Add a task or start a timer to begin.
                </p>

                <div className="mt-4 flex gap-3">
                    <Button
                        data-testid="btn-add-task-empty"
                        className="flex-1 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-lg"
                        onClick={onAddEntry}
                    >
                        + Add Task
                    </Button>

                    <Button
                        data-testid="btn-add-freetext-empty"
                        className="flex-1 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-lg"
                        onClick={onAddEntry}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add free Text
                    </Button>
                </div>
            </div>
        </div>
    );
}
