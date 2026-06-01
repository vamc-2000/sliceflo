"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

// Import reusable components
import { SettingsCard } from "@/components/settings/SettingsCard";
import { ThemeOptionCard } from "@/components/settings/ThemeOptionCard";
import { useProfileStore } from "@/stores/profile-store";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

export const timezones = [
    "(UTC-12:00) International Date Line West",
    "(UTC-11:00) Coordinated Universal Time-11",
    "(UTC-10:00) Hawaii",
    "(UTC-09:00) Alaska",
    "(UTC-08:00) Pacific Time (US & Canada)",
    "(UTC-07:00) Mountain Time (US & Canada)",
    "(UTC-06:00) Central Time (US & Canada)",
    "(UTC-05:00) Eastern Time (US & Canada)",
    "(UTC-04:00) Atlantic Time (Canada)",
    "(UTC-03:00) Brasilia",
    "(UTC-02:00) Mid-Atlantic",
    "(UTC-01:00) Azores",
    "(UTC+00:00) London, Dublin, Edinburgh",
    "(UTC+01:00) Berlin, Paris, Rome, Madrid",
    "(UTC+02:00) Cairo, Athens, Istanbul",
    "(UTC+03:00) Moscow, Baghdad",
    "(UTC+04:00) Dubai, Baku",
    "(UTC+05:00) Karachi, Tashkent",
    "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    "(UTC+06:00) Dhaka, Almaty",
    "(UTC+07:00) Bangkok, Jakarta",
    "(UTC+08:00) Beijing, Singapore, Hong Kong",
    "(UTC+09:00) Tokyo, Seoul",
    "(UTC+10:00) Sydney, Melbourne",
    "(UTC+11:00) Solomon Islands",
    "(UTC+12:00) Auckland, Wellington",
];

const languages = [
    "English (United States)",
    "English (United Kingdom)",
    "हिन्दी (Hindi)",
    "Español (Spanish)",
    "Français (French)",
    "中文 (Chinese)",
    "日本語 (Japanese)",
    "Deutsch (German)",
];

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const themeOptions = [
    { theme: "brand", label: "System Default", imageSrc: "/themes/default.svg" },
    { theme: "light", label: "Light Mode", imageSrc: "/themes/light.svg" },
    { theme: "dark", label: "Dark Mode", imageSrc: "/themes/dark.svg" },
    { theme: "dark-contrast", label: "Dark high contrast", imageSrc: "/themes/darkhighContrast.svg" },
    { theme: "light-contrast", label: "Light high contrast", imageSrc: "/themes/lightContrast.svg" },
];

const fontSizes = [
    { label: "Aa", size: "xs", fontSize: 12 },
    { label: "Aa", size: "sm", fontSize: 14 },
    { label: "Aa", size: "base", fontSize: 16 },
    { label: "Aa", size: "lg", fontSize: 18 },
    { label: "Aa", size: "xl", fontSize: 20 },
];

export default function PreferencesPage() {
    const { user: profile, fetchUserProfile, updateUserProfile, isLoading } = useProfileStore();
    const { setTheme, theme: currentTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [selectedFontSize, setSelectedFontSize] = useState("base");
    const [selectedTheme, setSelectedTheme] = useState("brand");
    const [activeSection, setActiveSection] = useState<"time" | "language" | "preferences" | "themes" | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [initialTheme, setInitialTheme] = useState("brand");
    //  Default preferences with ALL fields
    const defaultPreferences = {
        timeFormat: "12h",
        timeZone: "(UTC-05:00) Eastern Time (US & Canada)",
        dateFormat: "MM-DD-YYYY",
        language: "English (United States)",
        weekendDays: ["Saturday", "Sunday"],
        toastMessage: false,
        keyboardShortcuts: false,
        checkSpelling: true,
    };

    const [localPreferences, setLocalPreferences] = useState(defaultPreferences);
    const [initialPreferences, setInitialPreferences] = useState(defaultPreferences);

    // Fetch profile on mount
    useEffect(() => {
        fetchUserProfile();
        setMounted(true);
    }, [fetchUserProfile]);

    // Sync selectedTheme with next-themes currentTheme
    useEffect(() => {
        if (currentTheme) {
            setSelectedTheme(currentTheme);
        }
    }, [currentTheme]);

    //  preference fields from backend
    useEffect(() => {
        if (profile?.preferences) {
            console.log(" Preferences received:", profile.preferences);

            const syncedPreferences = {
                timeFormat: profile.preferences.timeFormat || "12h",
                timeZone: profile.preferences.timeZone || "(UTC-05:00) Eastern Time (US & Canada)",
                dateFormat: profile.preferences.dateFormat || "MM-DD-YYYY",
                language: profile.preferences.language || "English (United States)",
                weekendDays: profile.preferences.weekendDays || ["Saturday", "Sunday"],
                toastMessage: profile.preferences.toastMessage ?? false,
                keyboardShortcuts: profile.preferences.keyboardShortcuts ?? false,
                checkSpelling: profile.preferences.checkSpelling ?? true,
            };

            setLocalPreferences(syncedPreferences);
            setInitialPreferences(syncedPreferences);
        }

        // Sync theme
        if (profile?.displaySettings?.theme) {
            setSelectedTheme(profile.displaySettings.theme);
            setInitialTheme(profile.displaySettings.theme);
        }
    }, [profile]);

    const isChanged = JSON.stringify(localPreferences) !== JSON.stringify(initialPreferences) ||
        selectedTheme !== initialTheme;;

    const toggleDay = (day: string) => {
        setLocalPreferences((prev) => {
            const isActive = prev.weekendDays.includes(day);
            let newDays: string[];

            if (isActive) {
                // Only allow deselection if more than 2 days are selected
                if (prev.weekendDays.length > 2) {
                    newDays = prev.weekendDays.filter((d) => d !== day);
                } else {
                    // Don't allow deselecting if only 2 days remain
                    return prev;
                }
            } else {
                // Only allow selection if less than 2 days are selected
                if (prev.weekendDays.length < 2) {
                    newDays = [...prev.weekendDays, day];
                } else {
                    // Replace the oldest selected day with the new one
                    newDays = [...prev.weekendDays.slice(1), day];
                }
            }

            return { ...prev, weekendDays: newDays };
        });
    };

    // Add this helper function at the top level of the component
    const dayNameToNumber = (dayName: string): number => {
        const dayMap: Record<string, number> = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        };
        return dayMap[dayName] ?? 0;
    };

    const handleChange = (key: keyof typeof localPreferences, value: string | string[] | boolean) =>
        setLocalPreferences((prev) => ({ ...prev, [key]: value }));

    // Save ALL preferences including toggles
    const handleSave = async () => {
        // Check if there are changes before starting save
        if (!isChanged) return;

        try {
            setIsSaving(true); // Use isSaving instead of loading

            const payload = {
                preferences: localPreferences,
                displaySettings: {
                    theme: selectedTheme,
                    customization: {},
                },
            };

            console.log("Saving preferences:", payload);

            await updateUserProfile(payload);
            await fetchUserProfile();

            toast("success", { title: "Success", description: "Preferences saved successfully!" });
            setInitialPreferences(localPreferences);
            setInitialTheme(selectedTheme);
        } catch (error) {
            console.error("Save failed:", error);
            toast("error", { title: "Error", description: "Failed to save preferences" });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading && !profile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Loading preferences...</p>
            </div>
        );
    }

    return (
        <div className="w-full p-0">
            <div className="space-y-4">
                {/* Themes Card */}
                <SettingsCard
                    id="themes"
                    title="Optimize your visual Theme"
                    subtitle={selectedTheme === "brand" ? "System Default" : (themeOptions.find(o => o.theme === selectedTheme)?.label || "System Default")} // dynamic subtitle
                    icon={
                        <Image
                            src="/images/PaintTheme.svg"
                            alt="timezone"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                    }
                    isActive={activeSection === "themes"}
                    onToggle={() => setActiveSection((prev) => (prev === "themes" ? null : "themes"))}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {themeOptions.map((option) => (
                            <ThemeOptionCard
                                key={option.theme}
                                theme={option.theme}
                                label={option.label}
                                imageSrc={option.imageSrc}
                                isSelected={selectedTheme === option.theme}
                                onClick={() => {
                                    setSelectedTheme(option.theme);
                                    setTheme(option.theme);
                                }}
                            />
                        ))}
                    </div>
                </SettingsCard>

                {/* Time Preferences Card */}
                <SettingsCard
                    id="time"
                    title="Time Preferences"
                    subtitle={`Current Time Zone: ${localPreferences.timeZone || "Not set"}`}
                    icon={
                        <Image
                            src="/images/timezone.png"
                            alt="timezone"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                    }
                    isActive={activeSection === "time"}
                    onToggle={() => setActiveSection((prev) => (prev === "time" ? null : "time"))}
                >
                    <div className="space-y-4">
                        {/* Time Format */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <Label htmlFor="timeFormat" className="text-[14px] font-medium text-foreground">
                                Time Format
                            </Label>
                            <div className="md:col-span-2">
                                <Select
                                    value={localPreferences.timeFormat || undefined}
                                    onValueChange={(value) => handleChange("timeFormat", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["12h", "24h"].map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Time Zone */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <Label htmlFor="timeZone" className="text-[14px] font-medium text-foreground">
                                Time Zone 
                            </Label>
                            <div className="md:col-span-2">
                                <Select
                                    value={localPreferences.timeZone || undefined}
                                    onValueChange={(value) => handleChange("timeZone", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timezones.map((tz) => (
                                            <SelectItem key={tz} value={tz}>
                                                {tz}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date Format */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <Label htmlFor="dateFormat" className="text-[14px] font-medium text-foreground">
                                Date Format 
                            </Label>
                            <div className="md:col-span-2">
                                <Select
                                    value={localPreferences.dateFormat || undefined}
                                    onValueChange={(value) => handleChange("dateFormat", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["YYYY-MM-DD", "MM-DD-YYYY", "DD-MM-YYYY"].map((format) => (
                                            <SelectItem key={format} value={format}>
                                                {format}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Weekend Toggle */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <div className="mt-2">
                                <Label className="text-[14px] font-medium text-foreground">Enable Weekend</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select days when you consider as your weekend
                                </p>
                            </div>
                            <div className="md:col-span-2 rounded-lg border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted hover:bg-muted">
                                            {weekdays.map((day) => (
                                                <TableHead
                                                    key={day}
                                                    className="text-center text-xs font-semibold text-foreground h-10 px-2"
                                                >
                                                    {day}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-transparent">
                                            {weekdays.map((day) => (
                                                <TableCell key={day} className="text-center py-3 px-2">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={localPreferences.weekendDays.includes(day)}
                                                            onCheckedChange={() => toggleDay(day)}
                                                            aria-label={`Toggle ${day} as weekend`}
                                                        />
                                                    </div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </SettingsCard>

                {/* Language Card */}
                <SettingsCard
                    id="language"
                    title="Language Preference"
                    subtitle={`Selected Language: ${localPreferences.language || "Not set"}`}
                    icon={
                        <Image
                            src="/images/Language.png"
                            alt="language"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                    }
                    isActive={activeSection === "language"}
                    onToggle={() => setActiveSection((prev) => (prev === "language" ? null : "language"))}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <Label htmlFor="language" className="text-[14px] font-medium text-foreground">
                            Language 
                        </Label>
                        <div className="md:col-span-2">
                            <Select
                                value={localPreferences.language || undefined}
                                onValueChange={(value) => handleChange("language", value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SettingsCard>


                {/* Preferences Card */}
                <SettingsCard
                    id="preferences"
                    title="In-app Preferences"
                    subtitle="Manage your application preferences"
                    icon={
                        <Image
                            src="/images/preferences.png"
                            alt="Preferences"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg"
                        />
                    }
                    isActive={activeSection === "preferences"}
                    onToggle={() => setActiveSection((prev) => (prev === "preferences" ? null : "preferences"))}
                >
                    <div className="space-y-6">
                        {/*  Toast Message Toggle */}
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h4 className="font-inter text-[14px] font-medium leading-[100%] text-foreground">
                                    Flyout Toast Message
                                </h4>
                                <p className="font-inter text-[12px] font-normal leading-4 text-muted-foreground mt-1">
                                    When performing actions, toast messages may appear in the bottom left-hand of your screen. You can disable that here.
                                </p>
                            </div>
                            <Switch
                                checked={localPreferences.toastMessage}
                                onCheckedChange={(checked) => handleChange("toastMessage", checked)}
                            />
                        </div>

                        {/*  Keyboard Shortcuts Toggle */}
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h4 className="font-inter text-[14px] font-medium leading-[100%] text-foreground">
                                    Keyboard Shortcuts
                                </h4>
                                <p className="font-inter text-[12px] font-normal leading-4 text-muted-foreground mt-1">
                                    Use keyboard shortcuts to quickly navigate and take action through SliceFlo without using your mouse.
                                </p>
                            </div>
                            <Switch
                                checked={localPreferences.keyboardShortcuts}
                                onCheckedChange={(checked) => handleChange("keyboardShortcuts", checked)}
                            />
                        </div>

                        {/* Font Size Row */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                            <div className="flex-1">
                                <h4 className="font-inter text-[14px] font-medium leading-[100%] text-foreground">
                                    Font Size
                                </h4>
                                <p className="font-inter text-[12px] font-normal leading-4 text-muted-foreground mt-1">
                                    Adjust the size of text across the app
                                </p>
                            </div>
                            <div className="flex gap-2.5 flex-wrap">
                                {fontSizes.map(({ label, size, fontSize }) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedFontSize(size)}
                                        className={
                                            selectedFontSize === size
                                                ? "w-12 h-12 flex items-center justify-center font-inter font-normal rounded-lg cursor-pointer leading-none transition-all duration-200 bg-primary text-primary-foreground shadow-sm border-b-[3px] border-b-primary"
                                                : "w-12 h-12 flex items-center justify-center font-inter font-normal rounded-lg cursor-pointer leading-none transition-all duration-200 bg-muted text-muted-foreground border-b-[3px] border-b-transparent hover:bg-muted/80"
                                        }
                                        style={{ fontSize: `${fontSize}px` }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsCard>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !isChanged}
                        className="font-inter text-[14px] font-medium leading-5 px-8 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>

            </div>
        </div>
    );
}

