"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SettingsCard } from "@/components/settings/SettingsCard";
import toast from "react-hot-toast";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ExternalLink, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

const SecurityAndPasswordPage = () => {
    const [activeSection, setActiveSection] = useState<"2fa" | "sso" | null>(null);
    const [smsTfa, setSmsTfa] = useState(true);
    const [appTfa, setAppTfa] = useState(true);
    const [ssoProvider, setSsoProvider] = useState("no-sso");
    const [ssoPolicyName, setSsoPolicyName] = useState("");
    const [identityProvider, setIdentityProvider] = useState("");
    const [isAddSSOOpen, setIsAddSSOOpen] = useState(false);

    const handleSave2FA = () => {
        toast.success("2FA settings saved successfully");
    };

    return (
        <div className="w-full space-y-6 ">
            {/* Two-factor authentication Card */}
            <SettingsCard
                id="2fa"
                title="Two-factor authentication (2FA)"
                subtitle="Manage your two-factor authentication settings"
                icon={
                    <Image
                        src="/icons/TwoWay.svg"
                        alt="timezone"
                        width={40}
                        height={40}
                        className="w-10 h-10"
                    />
                }
                isActive={activeSection === "2fa"}
                onToggle={() => setActiveSection((prev) => (prev === "2fa" ? null : "2fa"))}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Section - Description */}
                        <div className="md:col-span-1 md:border-r md:pr-4 border-border">
                            <h4 className="font-semibold text-sm text-[var(--primary)] mb-2">Two-factor authentication (2FA)</h4>
                            <p className="text-xs text-[#8E8E93]">
                                Keep your account secure by enabling 2FA via SMS or using a temporary one-time
                                passcode (TOTP) from an authenticator app.
                            </p>
                        </div>

                        {/* Right Section - Options */}
                        <div className="md:col-span-2 space-y-4">
                            {/* Authenticator App (TOTP) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="app-2fa" className="text-sm font-semibold text-[var(--primary)]">
                                        Authenticator App (TOTP)
                                    </Label>
                                    <Switch
                                        id="app-2fa"
                                        checked={appTfa}
                                        onCheckedChange={setAppTfa}
                                    />
                                </div>
                                <p className="text-xs text-[#8E8E93]">
                                    Use an app to receive a temporary one-time passcode each time you log in.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2FA Setup UI - Moved outside grid for full width */}
                    {appTfa && (
                        <div
                            className="p-5 rounded-xl shadow-sm space-y-4"
                            style={{ backgroundColor: "#F68C1F26" }}
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* QR Code Section */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-card p-3 rounded-xl shadow-sm border border-orange-100 flex items-center justify-center">
                                        <div className="w-[110px] h-[110px] relative">
                                            <Image
                                                src="/images/scanner.svg"
                                                alt="Scan me"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[12px] font-semibold text-[#1E1E1E]">Can't scan?</p>
                                        <button className="text-[12px] font-semibold text-[#FF8D28] hover:underline cursor-pointer">
                                            Copy setup key
                                        </button>
                                    </div>
                                </div>

                                {/* Steps Section */}
                                <div className="flex-1 space-y-4">
                                    {/* Step 1 */}
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-brand-orange text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                                            1
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[12px] font-semibold text-foreground">Install an Authenticator App</h5>
                                            <p className="text-[12px] text-muted-foreground leading-tight">
                                                Install Google Authenticator or Duo Mobile from your store.
                                            </p>
                                        </div>
                                    </div>
 
                                    {/* Step 2 */}
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-brand-orange text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                                            2
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[12px] font-semibold text-foreground">Scan the QR Code</h5>
                                            <p className="text-[12px] text-muted-foreground leading-tight">
                                                Use your app to scan the above QR code.
                                            </p>
                                        </div>
                                    </div>
 
                                    {/* Step 3 */}
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-brand-orange text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                                            3
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[12 px] font-semibold text-foreground">Enter the 6-digit Code</h5>
                                            <p className="text-[11px] text-muted-foreground leading-tight">
                                                Enter the code from your authenticator app.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Code Inputs */}
                                    <div className="flex gap-2 pt-1">
                                        {[...Array(6)].map((_, i) => (
                                            <input
                                                key={i}
                                                type="text"
                                                maxLength={1}
                                                className="w-10 h-12 border border-orange-200 rounded-lg text-center text-lg font-bold bg-card focus:border-[#F68C1F] focus:ring-1 focus:ring-[#F68C1F] outline-none transition-all shadow-inner"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Center Actions Below OTP */}
                            <div className="flex justify-center gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setAppTfa(false)}
                                    className="px-8 h-12 rounded-xl border-[#d1d5db] bg-[#edf2f7] text-[#718096] font-bold text-[14px] hover:bg-[#e2e8f0]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="px-8 h-12 rounded-xl bg-[#001F3F] hover:bg-[#001F3F]/90 text-white font-bold text-[14px]"
                                    onClick={() => {
                                        toast.success("2FA Setup Complete!");
                                        setAppTfa(false);
                                    }}
                                >
                                    Register
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>

    );
};

export default SecurityAndPasswordPage;
