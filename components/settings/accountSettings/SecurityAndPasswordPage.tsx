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
    const [appTfa, setAppTfa] = useState(false);
    const [ssoProvider, setSsoProvider] = useState("no-sso");
    const [ssoPolicyName, setSsoPolicyName] = useState("");
    const [identityProvider, setIdentityProvider] = useState("");
    const [isAddSSOOpen, setIsAddSSOOpen] = useState(false);

    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit !== "" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[index] !== "") {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const digits = pastedData.replace(/\D/g, "").slice(0, 6);

        if (digits.length > 0) {
            const newOtp = [...otp];
            for (let j = 0; j < 6; j++) {
                newOtp[j] = digits[j] || "";
            }
            setOtp(newOtp);

            const focusIndex = Math.min(digits.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

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
                            <h4 className="font-semibold text-sm text-brand mb-2">Two-factor authentication (2FA)</h4>
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
                                    <Label htmlFor="app-2fa" className="text-sm font-semibold text-brand">
                                        Authenticator App (TOTP)
                                    </Label>
                                    <Switch
                                        id="app-2fa"
                                        checked={appTfa}
                                        onCheckedChange={(checked) => {
                                            setAppTfa(checked);
                                            if (!checked) setOtp(Array(6).fill(""));
                                        }}
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
                            className="p-5 rounded-xl shadow-sm space-y-4 border border-orange-200/50 dark:border-border bg-[#F68C1F26] dark:bg-muted/30"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* QR Code Section */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex items-center justify-center">
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
                                        <p className="text-[12px] font-semibold text-foreground">Can't scan?</p>
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
                                            <p className="text-[12px] text-muted-foreground dark:text-gray-300 leading-tight">
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
                                            <p className="text-[12px] text-muted-foreground dark:text-gray-300 leading-tight">
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
                                            <h5 className="text-[12px] font-semibold text-foreground">Enter the 6-digit Code</h5>
                                            <p className="text-[11px] text-muted-foreground dark:text-gray-300 leading-tight">
                                                Enter the code from your authenticator app.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Code Inputs */}
                                    <div className="flex gap-2 pt-1">
                                        {otp.map((value, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => { inputRefs.current[i] = el; }}
                                                type="text"
                                                maxLength={1}
                                                value={value}
                                                onChange={(e) => handleChange(i, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(i, e)}
                                                onPaste={handlePaste}
                                                className="w-10 h-12 border border-orange-200 rounded-lg text-center text-lg font-bold bg-white text-black focus:border-[#F68C1F] focus:ring-1 focus:ring-[#F68C1F] outline-none transition-all shadow-inner"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Center Actions Below OTP */}
                            <div className="flex justify-center gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAppTfa(false);
                                        setOtp(Array(6).fill(""));
                                    }}
                                    className="px-8 h-12 rounded-xl border border-border bg-muted text-muted-foreground font-bold text-[14px] hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="px-8 h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-[14px] transition-all shadow-sm"
                                    onClick={() => {
                                        toast.success("2FA Setup Complete!");
                                        setAppTfa(false);
                                        setOtp(Array(6).fill(""));
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
