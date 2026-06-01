"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { resetAllStores } from "@/stores/reset-stores";

export default function LogoutPage() {
    const clearCredentials = useAuthStore((state) => state.clearCredentials);

    useEffect(() => {
        clearCredentials();
        localStorage.removeItem("authToken");
        resetAllStores();
    }, []);

    return (
        <AuthPageLayout showTopRightCTA={false}>
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-[#F2F2F7] rounded-full flex items-center justify-center">
                        <LogOut className="w-10 h-10 text-[#001F3F]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-lg">👋</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[#001F3F]">Logged out</h1>
                    <p className="text-[#6B7280] text-sm max-w-[280px] mx-auto">
                        You have been successfully signed out of your account.
                    </p>
                </div>

                <div className="w-full space-y-3 pt-2">
                    <Button asChild className="w-full bg-[#001F3F] text-white h-10 hover:bg-[#001F3F]/90 rounded-md">
                        <Link href="/login">Log back in</Link>
                    </Button>

                    <div className="text-center">
                        <Link href="/" className="text-xs text-[#6B7280] hover:text-[#001F3F] transition-colors underline">
                            Back to login options
                        </Link>
                    </div>
                </div>
            </div>
        </AuthPageLayout>
    );
}
