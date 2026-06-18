"use client";

import { AlarmClockPlus, ClipboardClock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyTimesheetView, TimesheetTab } from "@/app/(pages)/timesheet/create/page";
import TimeSheetsSettings from "./TimeSheetSettings";
import { useEffect, useRef, useState } from "react";

interface Props {
    activeTab: TimesheetTab;
    onTabChange: (tab: TimesheetTab) => void;
    myView: MyTimesheetView;
    onMyViewChange: (view: MyTimesheetView) => void;
}

export function TimesheetHeader({ activeTab, onTabChange, myView, onMyViewChange }: Props) {
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [underlineStyle, setUnderlineStyle] = useState({
        width: 0,
        left: 0,
    });

    useEffect(() => {
        const indexMap = {
            teams: 0,
            my: 1,
            approvals: 2,
        };

        const index = indexMap[activeTab];
        const el = tabRefs.current[index];

        if (el) {
            setUnderlineStyle({
                width: el.offsetWidth,
                left: el.offsetLeft,
            });
        }
    }, [activeTab]);

    return (
        <div className="flex items-center justify-between bg-background px-6 py-1">
            {/* Left: Tabs */}
            <div className="relative flex gap-6">
                <Button
                    data-testid="tab-teams"
                    ref={(el) => { tabRefs.current[0] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("teams")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "teams" ? "text-foreground" : "text-muted-foreground"
                        }`}
                >
                    My Team's Timesheets
                </Button>

                <Button
                    data-testid="tab-my"
                    ref={(el) => { tabRefs.current[1] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("my")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "my" ? "text-foreground" : "text-muted-foreground"
                        }`}
                >
                    My timesheet
                </Button>

                <Button
                    data-testid="tab-approvals"
                    ref={(el) => { tabRefs.current[2] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("approvals")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "approvals" ? "text-foreground" : "text-muted-foreground"
                        }`}
                >
                    Approvals
                </Button>

                <div
                    className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        width: underlineStyle.width,
                        transform: `translateX(${underlineStyle.left}px)`,
                    }}
                />
            </div>

            {/* Right side */}
            <div className="flex items-center">
                {/* Show these ONLY for "my" tab */}
                {activeTab === "my" && (
                    <div className="flex items-center gap-1 rounded-sm bg-muted px-1 py-1">
                        <Button
                            data-testid="view-day"
                            variant="ghost"
                            className={`h-7.5 w-10 rounded-sm cursor-pointer ${myView === "timesheet"
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted/80"
                                }`}
                            onClick={() => onMyViewChange("timesheet")}
                        >
                            Day
                        </Button>

                        <Button
                            data-testid="view-week"
                            variant="ghost"
                            className={`h-7.5 w-12 rounded-sm cursor-pointer ${myView === "clipboard"
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted/80"
                                }`}
                            onClick={() => onMyViewChange("clipboard")}
                        >
                            Week
                        </Button>

                        <Button
                            data-testid="view-month"
                            variant="ghost"
                            className={`h-7.5 w-14 rounded-sm cursor-pointer ${myView === "month"
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted/80"
                                }`}
                            onClick={() => onMyViewChange("month")}
                        >
                            Month
                        </Button>
                    </div>
                )}

                {activeTab === "my" && (
                    <div className="ml-2">
                        <TimeSheetsSettings />
                    </div>
                )}
                {/* Commented out settings icon for My Team's Timesheets and Approvals tabs
                {(activeTab === "teams" || activeTab === "approvals") && (
                    <div className="ml-2">
                        <TimeSheetsSettings />
                    </div>
                )}
                */}
            </div>
        </div>
    );
}
