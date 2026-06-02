import Image from "next/image";
import { Button } from "@/components/ui/button";
import EmptyApprovals from "./EmptyApprovals";
import ApprovalsPage from "./ApprovalsPage";

interface ApprovalsBodyProps {
    onNavigateToTimesheet?: (weekStart: string) => void;
}

export default function ApprovalsBody({ onNavigateToTimesheet }: ApprovalsBodyProps) {
    return (
        <div data-testid="approvals-body-container">
            <ApprovalsPage onNavigateToTimesheet={onNavigateToTimesheet} />
        </div>
    )
}