


"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash } from "lucide-react";
import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaThreads } from "react-icons/fa6";
import { IconType } from "react-icons";
import { toast } from "@/components/ui/sonner";
import { useProfileStore } from "@/stores/profile-store";
import { SocialPlatform, SocialLinks } from "@/types/profile.types";

interface SocialLink {
    platform: SocialPlatform | "";
    url: string;
}

const iconMap: Record<SocialPlatform, { icon: IconType; color: string }> = {
    linkedin: { icon: FaLinkedin, color: "#0077B5" },
    twitter: { icon: FaTwitter, color: "#1DA1F2" },
    facebook: { icon: FaFacebook, color: "#1877F2" },
    instagram: { icon: FaInstagram, color: "#E1306C" },
    threads: { icon: FaThreads, color: "#000000" },
};

const SOCIAL_ICONS: SocialPlatform[] = ["linkedin", "twitter", "facebook", "instagram", "threads"];

//   function to validate platform type
const isValidSocialPlatform = (value: string): value is SocialPlatform => {
    return ["linkedin", "twitter", "facebook", "instagram", "threads"].includes(value);
};
// Add this after iconMap and before SocialLinksForm component
const platformPlaceholders: Record<SocialPlatform, string> = {
    linkedin: "https://www.linkedin.com/in/your-username",
    twitter: "https://twitter.com/your-username",
    facebook: "https://www.facebook.com/your-username",
    instagram: "https://www.instagram.com/your-username",
    threads: "https://www.threads.net/@your-username",
};


const SocialLinksForm = () => {
    const { user: profile, fetchUserProfile, updateUserProfile, isLoading } = useProfileStore();

    const [links, setLinks] = useState<SocialLink[]>([{ platform: "", url: "" }]);
    const [initialLinks, setInitialLinks] = useState<SocialLink[]>([{ platform: "", url: "" }]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    useEffect(() => {
        if (profile?.socialLinks && Object.keys(profile.socialLinks).length > 0) {
            console.log("📦 Social links received:", profile.socialLinks);

            // Convert backend data to array format
            const socialLinksArray: SocialLink[] = [];

            Object.entries(profile.socialLinks).forEach(([key, url]) => {
                if (url && typeof url === "string") {
                    const link: SocialLink = {
                        platform: isValidSocialPlatform(key) ? (key as SocialPlatform) : ("" as const),
                        url,
                    };
                    socialLinksArray.push(link);
                }
            });

            //  Use converted array or empty row
            const linksToSet: SocialLink[] =
                socialLinksArray.length > 0 ? socialLinksArray : [{ platform: "", url: "" }];

            console.log(" Converted links:", linksToSet);

            // Save to local state
            setLinks(linksToSet);
            setInitialLinks(linksToSet);
        }
    }, [profile]);


    const isChanged = JSON.stringify(links) !== JSON.stringify(initialLinks);
    const isAnyRowIncomplete = links.some((link) => !link.platform || !link.url);
    const usedPlatforms = links.map((l) => l.platform).filter(Boolean) as SocialPlatform[];

    const handlePlatformChange = (index: number, value: string) => {
        setLinks((prev) => {
            const updated = [...prev];
            updated[index].platform = value as SocialPlatform;
            return updated;
        });
    };

    const handleUrlChange = (index: number, value: string) => {
        setLinks((prev) => {
            const updated = [...prev];
            updated[index].url = value;
            return updated;
        });
    };

    const handleAdd = () => {
        if (links.length < 5) {
            setLinks((prev) => [...prev, { platform: "", url: "" }]);
        }
    };

    const handleRemove = (index: number) => {
        setLinks((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.length > 0 ? updated : [{ platform: "", url: "" }];
        });
    };

    const handleSave = async () => {
        // Move all validation checks BEFORE setSaving(true)
        if (links.length === 0 || links.some((l) => !l.platform || !l.url)) {
            toast("error", { title: "Error", description: "Please fill in all fields" });
            return;
        }

        try {
            setSaving(true); //  Only set saving to true after validation

            //  Convert to proper format
            const socialLinksObj: SocialLinks = {};
            links.forEach((link) => {
                if (link.platform && link.url) {
                    socialLinksObj[link.platform] = link.url;
                }
            });

            console.log("📤 Saving social links:", socialLinksObj);

            await updateUserProfile({ socialLinks: socialLinksObj });
            await fetchUserProfile();

            toast("success", { title: "Success", description: "Social links saved successfully" });
            setInitialLinks(links);
        } catch (err) {
            console.error("Failed to save social links:", err);
            toast("error", { title: "Error", description: "Failed to save social links" });
        } finally {
            setSaving(false); 
        }
    };

    if (isLoading && !profile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Loading social links...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Social Links</h2>
                <p className="text-sm text-muted-foreground">Add your social media profiles</p>
            </div>

            <div className="space-y-4">
                {links.map((link, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-foreground mb-2">Link Name</Label>
                            <Select
                                value={link.platform}
                                onValueChange={(value) => handlePlatformChange(idx, value)}
                            >
                                <SelectTrigger className="h-10 border-l-[3px] border-l-primary">
                                    <SelectValue placeholder="Select">
                                        {link.platform && (
                                            <div className="flex items-center justify-center">
                                                {React.createElement(iconMap[link.platform as SocialPlatform].icon, {
                                                    size: 22,
                                                    color: iconMap[link.platform as SocialPlatform].color,
                                                })}
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {SOCIAL_ICONS.map((platform) => (
                                        <SelectItem
                                            key={platform}
                                            value={platform}
                                            disabled={usedPlatforms.includes(platform) && link.platform !== platform}
                                            className="flex items-center justify-center"
                                        >
                                            <div className="flex items-center justify-center w-full">
                                                {React.createElement(iconMap[platform].icon, {
                                                    size: 20,
                                                    color: iconMap[platform].color,
                                                })}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-9">
                            <Label className="text-sm font-medium text-foreground mb-2">Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder={
                                        link.platform 
                                            ? platformPlaceholders[link.platform as SocialPlatform] 
                                            : "Select a platform first"
                                    }
                                    value={link.url}
                                    onChange={(e) => handleUrlChange(idx, e.target.value)}
                                    className="h-10 text-foreground"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(idx)}
                                    className="h-10 w-10 flex-shrink-0 hover:bg-destructive/10"
                                    disabled={links.length === 1 && !link.platform && !link.url}
                                >
                                    <Trash className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-4">
                <Button
                    disabled={links.length >= 5 || isAnyRowIncomplete}
                    onClick={handleAdd}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    + Add Link
                </Button>

                <Button
                    disabled={saving || !isChanged || isAnyRowIncomplete}
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Saving..." : "Save"}
                </Button>

            </div>
        </div>
    );
};

export default SocialLinksForm;
