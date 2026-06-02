"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Ellipsis } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useState } from "react";
import { mailStore } from "@/stores/mailbox-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useRouter } from "next/navigation";

export default function SettingsMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [modalState, setModalState] = useState<{
        open: boolean;
        title: string;
        confirmLabel: string;
        onConfirm: () => void;
    }>({ open: false, title: "", confirmLabel: "", onConfirm: () => {} });

    const { removeAllEmails, removeAllReadEmails } = mailStore();

    const handleClose = () => setOpen(false);

    const openModal = (title: string, confirmLabel: string, onConfirm: () => void) => {
        handleClose();
        setModalState({ open: true, title, confirmLabel, onConfirm });
    };

    return (
        <>
            <Tooltip>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    {/* Single button serves as BOTH tooltip trigger and dropdown trigger */}
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                data-testid="settings-menu-trigger-btn"
                                variant="ghost"
                                size="icon"
                                className="text-foreground hover:text-foreground hover:bg-transparent"
                            >
                                <Ellipsis size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>

                    <DropdownMenuContent
                        data-testid="settings-menu-content"
                        align="end"
                        className="w-52 border-0 border-b-4 border-primary"
                    >
                        <DropdownMenuItem
                            data-testid="settings-menu-manage-notifications"
                            className="text-foreground"
                            onClick={() =>
                                router.push(
                                    "/settings?tab=account&section=notifications&mailbox=true"
                                )
                            }
                        >
                            Manage Notifications
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="h-[1px] bg-border" />

                        <DropdownMenuItem
                            data-testid="settings-menu-delete-read"
                            onClick={() =>
                                openModal(
                                    "Are you sure you want to delete all read notifications?",
                                    "Delete all read",
                                    () => removeAllReadEmails()
                                )
                            }
                            className="text-red-600 hover:text-red-600"
                        >
                            Delete all read notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent side="bottom">Settings</TooltipContent>
            </Tooltip>

            <ConfirmationModal
                data-testid="settings-menu-confirm-modal"
                open={modalState.open}
                onClose={() => setModalState({ ...modalState, open: false })}
                title={modalState.title}
                confirmLabel={modalState.confirmLabel}
                onConfirm={modalState.onConfirm}
            />
        </>
    );
}
