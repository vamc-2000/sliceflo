"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteMembersModalProps {
    open: boolean;
    onClose: () => void;
    onInviteData: (data: {
        members: { email: string; role: string }[];
        message?: string;
    }, isSubmit: boolean) => void;
    existingMembers: { email: string; role: string }[];
    isLoading?: boolean;
}

export default function InviteMembersModal({ open, onClose, onInviteData, existingMembers, isLoading }: InviteMembersModalProps) {
    const [rows, setRows] = useState<{ email: string; role: string }[]>([]);
    const [message, setMessage] = useState("");

    // Always load existing members OR one empty row
    useEffect(() => {
        if (open) {
            setRows(existingMembers.length ? existingMembers : [{ email: "", role: "" }]);
        }
    }, [open, existingMembers]);

    // Sync preview emails
    const previewEmails = rows
        .filter((r) => r.email.trim() !== "")
        .map((r) => r.email);

    const handleSubmit = () => {
        const validRows = rows.filter(r => r.email.trim() !== "" && r.role !== "");
        onInviteData({
            members: validRows,
            message: message || undefined
        }, true);
    };

    const handleCancel = () => {
        // Always return latest data even on close
        onInviteData({
            members: rows.filter(r => r.email.trim() !== "" && r.role !== ""),
            message: message || undefined
        }, false);

        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-lg border-b-4 border-b-[#001F3F] ">
                <DialogHeader>
                    <DialogTitle>Invite Members</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                    <span className="text-[#8E8E93] font-medium">Invite with email</span>

                    {rows.map((row, index) => (
                        <div key={index} className="flex items-center gap-2 w-full">

                            <div className="flex items-center flex-1 p-1 border border-[#8E8E93] rounded-md bg-white">
                                <Input
                                    placeholder="Enter email address"
                                    value={row.email}
                                    onChange={(e) => {
                                        const updated = [...rows];
                                        updated[index].email = e.target.value;
                                        setRows(updated);
                                    }}
                                    className="border-0 shadow-none focus-visible:ring-0 flex-1"
                                />

                                <Select
                                    value={row.role || ""}
                                    onValueChange={(v) => {
                                        const updated = [...rows];
                                        updated[index].role = v;
                                        setRows(updated);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] border-0 rounded-md bg-[#E5E5EA]">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {rows.length > 1 && (
                                <button
                                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X size={18} className="text-gray-600" />
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end">
                        <div
                            className="text-sm text-[#001F3F] cursor-pointer hover:underline"
                            onClick={() => setRows([...rows, { email: "", role: "" }])}
                        >
                            + Add more
                        </div>
                    </div>

                    <span className="text-[#8E8E93] font-medium">Write a message (optional)</span>
                    <Textarea
                        placeholder="Add a message for the people you're inviting..."
                        className="w-full resize-none"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <DialogFooter className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-[120px] h-10 text-sm font-normal border border-[#8E8E93] bg-[#FFFFFF] text-[#8E8E93]"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !rows.some(r => {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return emailRegex.test(r.email) && r.role !== "";
                        })}
                        className={cn(
                            "w-[120px] h-10 text-sm font-normal border flex items-center justify-center gap-2",
                            rows.some(r => {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                return emailRegex.test(r.email) && r.role !== "";
                            })
                                ? "bg-[#001F3F] text-white hover:bg-[#001530]"
                                : "bg-[#F2F2F7] text-[#8E8E93] cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                        "Send Invite"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
