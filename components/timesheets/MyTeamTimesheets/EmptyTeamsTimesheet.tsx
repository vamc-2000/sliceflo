import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";

export default function EmptyTeamsTimesheet() {
    return (
        <div className="flex w-full items-center justify-center py-14">
            <div className="flex flex-col items-center text-center gap-4">
                {/* Timer illustration */}
                <div className="relative h-54 w-54">
                    <Image
                        src="/images/Timesheet/empty-team.svg"
                        alt="Timesheet timer"
                        fill
                        className="object-contain"
                    />
                </div>

                {/* Title + subtitle */}
                <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                        No Timesheets found
                    </p>
                    <p className="text-sm text-muted-foreground">
                        No team members have logged time for
                    </p>
                </div>

                {/* CTA button */}
                <div className="mt-2 flex gap-3">
                    <Button className="w-44 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Send className="mr-2 h-4 w-4" />
                        Send Reminder
                    </Button>
                    <Button className="w-44 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Time Manually
                    </Button>
                </div>
            </div>
        </div>
    )
}