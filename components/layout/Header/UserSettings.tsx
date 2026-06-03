
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    Gift,
    Power,
    Download,
    RefreshCw,
    Bell,
    Settings,
    PhoneCall,
    Wrench,
    ChevronRight,
    Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import StatusDropdown from "./StatusDropDown";
import InviteMembersModal from "@/components/settings/InviteMembersModal";
import MobileAppPopup from "@/components/settings/Mobileappspopup";
import { setPreviousRoute } from "@/utils/routeTracker";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";

type Theme = "light" | "dark" | "brand";

const UserSettings: React.FC<{
    onClose?: () => void;
    onOpenMobileApp?: () => void;
    onOpenInvite?: () => void;
    onOpenLogout?: () => void;
}> = ({ onClose, onOpenMobileApp, onOpenInvite, onOpenLogout }) => {
    const { user: profile, fetchUserProfile, updateUserProfile } = useProfileStore();
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const [openInvite, setOpenInvite] = useState(false);
    const [openMobileApp, setOpenMobileApp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);

    const authStore = useAuthStore();
    const { clearCredentials } = authStore;

    // Avoid hydration mismatch by waiting for mount
    useEffect(() => {
        setMounted(true);
        fetchUserProfile().then((fetchedUser) => {
            if (fetchedUser?.displaySettings?.theme) {
                setTheme(fetchedUser.displaySettings.theme);
            }
        }).catch((err) => console.error("Failed to fetch profile theme", err));
    }, []);

    const userName = profile?.name || "User";
    const profilePictureUrl = profile?.profilePictureUrl || "";

    const initials = userName
        ? userName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "U";

    const handleNavigation = (path?: string, onClick?: () => void) => {
        if (path) {
            const currentPath = window.location.pathname + window.location.search;
            setPreviousRoute(currentPath);
            router.push(path);
            onClose?.();
        }
        if (onClick) {
            onClick();
        }
    };

    const handleThemeSelect = async (value: string) => {
        setTheme(value);
        setIsThemeOpen(false);
        try {
            await updateUserProfile({
                displaySettings: {
                    ...(profile?.displaySettings || {}),
                    theme: value,
                },
            });
            toast.success(`Theme updated to ${value}!`);
        } catch (error) {
            toast.error("Failed to update theme preference");
        }
    };

    type ThemeOption = {
        label: string;
        value: Theme;
        Icon: React.ComponentType<{ className?: string }>;
    };

    const themeOptions: ThemeOption[] = [
        {
            label: "Light Mode",
            value: "light",
            Icon: ({ className }) => (
                <Image src="/themes/light.svg" alt="Light Theme" width={100} height={80} className={className} />
            ),
        },
        {
            label: "Dark Mode",
            value: "dark",
            Icon: ({ className }) => (
                <Image src="/themes/dark.svg" alt="Dark Theme" width={100} height={80} className={className} />
            ),
        },
        {
            label: "Default",
            value: "brand",
            Icon: ({ className }) => (
                <Image src="/themes/default.svg" alt="Default Theme" width={100} height={80} className={className} />
            ),
        },
    ];

    // Define MenuItem type
    type MenuItem =
        | {
            icon: React.ReactNode;
            label: string;
            path?: string;
            divider?: never;
            onClick?: () => void;
            showChevron?: boolean;
        }
        | {
            divider: true;
            icon?: never;
            label?: never;
            path?: never;
            showChevron?: never;
            onClick?: never;
        };

    // Define menu items array
    const menuItems: MenuItem[] = [
        {
            icon: <RefreshCw className="w-[18px] h-[18px]" />,
            label: "Change theme",
            showChevron: true,
            onClick: () => setIsThemeOpen(true),
        },
        {
            icon: <Bell className="w-[18px] h-[18px]" />,
            label: "Notifications",
            path: "/settings?section=Notifications",
        },
        { divider: true },
        {
            icon: <Settings className="w-[18px] h-[18px]" />,
            label: "Settings",
            showChevron: true,
            path: "/settings",
        },
        { divider: true },
        {
            icon: <Gift className="w-[18px] h-[18px]" />,
            label: "Refer a friend",
            path: "/settings/Referral",
        },

        {
            icon: <Download className="w-[18px] h-[18px]" />,
            label: "Download app",
            onClick: () => setOpenMobileApp(true),
        },
        {
            icon: <Workflow className="w-[18px] h-[18px]" />,
            label: "Automations",
            path: "/automations",
        },
        { divider: true },
        {
            icon: <Wrench className="w-[18px] h-[18px]" />,
            label: "Raise a Service Request",
            path: "/dashboard",
        },
        {
            icon: <PhoneCall className="w-[18px] h-[18px]" />,
            label: "Support center",
            path: "/dashboard",
        },
        { divider: true },
        {
            icon: <Power className="w-[18px] h-[18px]" />,
            label: "Sign Out",
            onClick: () => onOpenLogout?.(),
        },
    ];

    if (!mounted) {
        return null; // Or a skeleton
    }

    return (
        <div className="w-[230px] bg-white dark:bg-neutral-900 rounded-xl shadow-xl overflow-hidden border-b-4 border-[#001F3F] dark:border-neutral-800 transition-colors duration-200" data-testid="user-settings-container">

            {/* Header Section -  Big Content */}
            <div className="px-2 py-1.5 bg-white dark:bg-neutral-900 transition-colors duration-200">
                <Card className="bg-white dark:bg-neutral-800 border py-1 border-gray-200 dark:border-neutral-700 rounded-lg">
                    <CardContent className="p-1.5">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-shrink-0">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={profilePictureUrl} alt={userName} />
                                    <AvatarFallback className="bg-gray-300 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-sm font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-[#001F3F] dark:text-neutral-100 truncate mb-0.5" data-testid="user-settings-username">
                                    {userName}
                                </h3>
                                <StatusDropdown />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Menu Items */}
            <div className="py-0.5">
                {menuItems.map((item, index) =>
                    "divider" in item && item.divider ? (
                        <Separator key={`divider-${index}`} className="my-0.5 dark:bg-neutral-800" />
                    ) : item.label === "Change theme" ? (
                        // Special handling for Change theme with Popover
                        <Popover key={item.label} open={isThemeOpen} onOpenChange={setIsThemeOpen}>
                            <PopoverTrigger asChild>
                                <div
                                    className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                                    data-testid="usersettings-theme-trigger"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-700 dark:text-neutral-400">{item.icon}</span>
                                        <span className="text-gray-900 dark:text-neutral-200 text-sm font-normal leading-tight truncate whitespace-nowrap overflow-hidden">
                                            {item.label}
                                        </span>
                                    </div>
                                    {item.showChevron && (
                                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                side="bottom"
                                className="w-67 p-3 sm:p-2 border-0 border-b-4 border-[#001F3F] rounded-xl shadow-md bg-white dark:bg-neutral-900 transition-all"
                                data-testid="usersettings-theme-popover"
                            >

                                <RadioGroup
                                    value={theme}
                                    onValueChange={handleThemeSelect}
                                    className="grid grid-cols-3 gap-3 sm:gap-2"
                                >
                                    {themeOptions.map(({ value, label, Icon }) => (
                                        <div
                                            key={value}
                                            className="flex flex-col items-center justify-center space-y-1 group"
                                            data-testid={`theme-option-${value}`}
                                        >
                                            <Label
                                                htmlFor={value}
                                                className="cursor-pointer flex flex-col items-center space-y-1 text-center"
                                            >
                                                <div
                                                    className={`rounded-md p-1 sm:p-1 bg-background border transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${theme === value
                                                        ? "border-b-2 border-[#001F3F] dark:border-neutral-200 scale-105 shadow-md"
                                                        : "border-transparent"
                                                        }`}
                                                >
                                                    <Icon className="text-[#001F3F] dark:text-neutral-200" />
                                                </div>
                                                <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground dark:text-neutral-400">
                                                    {label}
                                                </span>
                                            </Label>
                                            <RadioGroupItem value={value} id={value} className="sr-only" />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        // Regular menu items
                        <div
                            key={item.label}
                            onClick={() => handleNavigation(item.path, item.onClick)}
                            className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                            data-testid={`usersettings-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-gray-700 dark:text-neutral-400">{item.icon}</span>
                                <span className="text-gray-900 dark:text-neutral-200 text-sm font-normal leading-tight truncate whitespace-nowrap overflow-hidden">
                                    {item.label}
                                </span>
                            </div>
                            {item.showChevron && (
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                            )}
                        </div>
                    )
                )}
            </div>

            <InviteMembersModal open={openInvite} onClose={() => setOpenInvite(false)} />
            <MobileAppPopup open={openMobileApp} onClose={() => setOpenMobileApp(false)} />
        </div>
    );
};

export default UserSettings;
