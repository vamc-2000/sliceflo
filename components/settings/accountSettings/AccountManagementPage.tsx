"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/sonner";

import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";

export default function AccountManagementPage() {
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
    const [deactivateReason, setDeactivateReason] = useState("");
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { deactivateUserAccount, deleteUserAccount, resetProfile } = useProfileStore();
    const { clearCredentials } = useAuthStore();

    const handleDeactivateAccount = async () => {
        try {
            setIsDeactivating(true);
            const response = await deactivateUserAccount();

            if (response.success) {
                toast("success", { title: "Success", description: response.message || "Account deactivated successfully" });

                // Clear everything
                clearCredentials();
                resetProfile();
                localStorage.clear();
                sessionStorage.clear();

                // Redirect
                window.location.replace("/login");
            }
        } catch (error: any) {
            console.error("Account deactivation failed:", error);
            toast("error", { title: "Error", description: "Failed to deactivate account" });
        } finally {
            setIsDeactivating(false);
            setOpenDeactivateDialog(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            const response = await deleteUserAccount();

            if (response.success) {
                toast("success", { title: "Success", description: response.message || "Account deleted successfully" });

                // Clear everything
                clearCredentials();
                resetProfile();
                localStorage.clear();
                sessionStorage.clear();

                // Redirect
                window.location.replace("/login");
            }
        } catch (error: any) {
            console.error("Account deletion failed:", error);
            toast("error", { title: "Error", description: "Failed to delete account" });
        } finally {
            setIsDeleting(false);
            setOpenDeleteDialog(false);
        }
    };

    return (
        <div className="w-full space-y-6">
    

            <div className="space-y-6">
                {/* Deactivate Account Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-base font-semibold text-primary">
                                Deactivate Account
                            </h3>
                            <p className="text text-muted-foreground">
                                You can remove access to all organizations and workspaces in SliceFlo.
                            </p>
                        </div>
                        <Button
                            onClick={() => setOpenDeactivateDialog(true)}
                            disabled={isDeactivating}
                            className="bg-brand-orange/20 hover:bg-brand-orange/20 whitespace-nowrap w-[180px] h-12 text-brand-orange rounded-xl font-semibold text-[14px] disabled:opacity-50 transition-all shadow-none border-none"
                        >
                            {isDeactivating ? "Deactivating..." : "Deactivate Account"}
                        </Button>
                    </div>
                </div>

                {/* Delete Account Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-base font-semibold text-primary">
                                Delete Account
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Deleting your account will lose all your data, progress, files and team projects.
                            </p>
                        </div>
                        <Button
                            onClick={() => setOpenDeleteDialog(true)}
                            disabled={isDeleting}
                            className="bg-[var(--logout-button)] hover:bg-[var(--logout-button)] whitespace-nowrap w-[180px] h-12 text-white rounded-xl font-semibold text-[14px] disabled:opacity-50 transition-all shadow-none border-none"
                        >
                            {isDeleting ? "Deleting..." : "Delete Account"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Deactivate Account Dialog - Custom Implementation */}
            <Dialog open={openDeactivateDialog} onOpenChange={setOpenDeactivateDialog}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border border-border/60 rounded-2xl shadow-2xl bg-background">
                    <div className="p-8 space-y-7 relative">
                        {/* Custom Close Button */}
                        <button
                            onClick={() => setOpenDeactivateDialog(false)}
                            className="absolute right-6 top-6 p-1 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-6">
                            <DialogHeader className="space-y-4">
                                <DialogTitle className="text-2xl font-bold text-[var(--primary)] dark:text-white text-left">
                                    Account deactivation
                                </DialogTitle>
                                <DialogDescription className="text-[14px] text-foreground/90 font-medium leading-relaxed text-left">
                                    Deactivation is permanent and cannot be undone. Once your account is deactivated, you can no longer log in to any Organizations or Workspaces in SliceFlo. Please visit the SliceFlo Guide for more information.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2">
                                <Textarea
                                    placeholder="We're always looking for ways to improve SliceFlo. Please share your main reason for deactivating your account."
                                    value={deactivateReason}
                                    onChange={(e) => setDeactivateReason(e.target.value)}
                                    className="min-h-[140px] border-border rounded-xl p-4 text-[14px] font-medium text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] shadow-none resize-none bg-background"
                                />
                            </div>

                            <DialogFooter className="flex items-center justify-end gap-3 pt-4 sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpenDeactivateDialog(false)}
                                    disabled={isDeactivating}
                                    className="h-12 px-10 border-[var(--border)] rounded-xl text-[var(--muted-foreground)] font-bold text-[15px] hover:bg-[var(--muted)] shadow-none w-full sm:w-auto transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeactivateAccount}
                                    disabled={isDeactivating}
                                    className="h-12 px-10 bg-[var(--logout-button)] hover:opacity-90 text-white rounded-xl font-bold text-[15px] shadow-none w-full sm:w-auto transition-all"
                                >
                                    {isDeactivating ? "Deactivating..." : "Deactivate"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog - Custom Implementation */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border/60 rounded-2xl shadow-2xl bg-background">
                    <div className="p-8 space-y-7 relative flex flex-col items-center text-center">
                        {/* Custom Close Button */}
                        <button
                            onClick={() => setOpenDeleteDialog(false)}
                            className="absolute right-6 top-6 p-1 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-6 w-full flex flex-col items-center">
                            <DialogHeader className="space-y-4 items-center">
                                <DialogTitle className="text-xl font-bold text-[var(--primary)] dark:text-white text-center max-w-[320px] leading-tight">
                                    Are you sure want to delete your account?
                                </DialogTitle>
                            </DialogHeader>

                            {/* Graphic Section */}
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <Image
                                    src="/images/Delete.svg"
                                    alt="Delete Illustration"
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>

                            <DialogDescription className="text-[14px] text-muted-foreground font-medium leading-relaxed max-w-[380px] text-center">
                                Deleting your account will lose all your data, progress, files and team projects, you can deactivate your account instead
                            </DialogDescription>

                            <DialogFooter className="flex flex-row items-center justify-center gap-3 pt-4 w-full sm:justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpenDeleteDialog(false)}
                                    disabled={isDeleting}
                                    className="h-12 px-10 border-border rounded-xl text-muted-foreground font-bold text-[15px] hover:bg-muted shadow-none flex-1 transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="h-12 px-10 bg-[var(--logout-button)] hover:opacity-90 text-white rounded-xl font-bold text-[15px] shadow-none flex-1 transition-all"
                                >
                                    {isDeleting ? "Deleting..." : "Delete Account"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}







