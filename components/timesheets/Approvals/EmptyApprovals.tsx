import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function EmptyApprovals() {
    return (
        <div data-testid="empty-approvals-container" className="flex w-full items-center justify-center py-34">
            <div className="flex flex-col items-center text-center gap-4">
                {/* Timer illustration */}
                <div className="relative h-24 w-24">
                    <Image
                        src="/images/Timesheet/entry-log.svg"
                        alt="Timesheet timer"
                        fill
                        className="object-contain"
                    />
                </div>

                {/* Title + subtitle */}
                <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                        Timesheets not yet sent for approval
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Send your completed timesheets to your manager for approval
                    </p>
                </div>

                {/* CTA button */}
                <Button data-testid="btn-setup-approvals" className="mt-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Setup Timesheet Approvals
                </Button>
            </div>
        </div>
    )
}