import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type ViewMode = "days" | "months" | "years";

type Props = {
    month: Date;
    setMonth: React.Dispatch<React.SetStateAction<Date>>;
    view: ViewMode;
    setView: (v: ViewMode) => void;
    setDirection: (d: "left" | "right") => void;
};

export default function CustomCalendarHeader({
    month,
    setMonth,
    view,
    setView,
    setDirection,
}: Props) {
    let headerLabel = "";

    if (view === "days") {
        headerLabel = format(month, "MMMM yyyy");
    } else if (view === "months") {
        headerLabel = format(month, "yyyy");
    } else {
        const centerYear = month.getFullYear();
        headerLabel = `${centerYear - 6} – ${centerYear + 5}`;
    }

    const handlePrev = () => {
        if (view === "days") {
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
        } else if (view === "months") {
            setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
        } else {
            setMonth(new Date(month.getFullYear() - 12, month.getMonth(), 1));
        }
    };

    const handleNext = () => {
        if (view === "days") {
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
        } else if (view === "months") {
            setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
        } else {
            setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
        }
    };

    return (
        <div className="flex items-center justify-between px-3 pt-2 pb-0">

            {/* LEFT ARROW */}
            <button
                onClick={() => {
                    setDirection("left");

                    if (view === "days") {
                        setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
                    } else if (view === "months") {
                        setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
                    } else {
                        setMonth(new Date(month.getFullYear() - 12, month.getMonth(), 1));
                    }
                }}
            >
                <ChevronLeft />
            </button>

            {/* HEADER LABEL */}
            <button
                className="font-medium"
                onClick={() => {
                    if (view === "days") setView("months");
                    else if (view === "months") setView("years");
                    else setView("days");
                }}
            >
                {headerLabel}
            </button>

            {/* RIGHT ARROW */}
            <button
                onClick={() => {
                    setDirection("right");

                    if (view === "days") {
                        setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
                    } else if (view === "months") {
                        setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
                    } else {
                        setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
                    }
                }}
            >
                <ChevronRight />
            </button>
        </div>
    );
}
