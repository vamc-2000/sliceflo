


import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SettingsCardProps {
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    isActive: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    actionButton?: React.ReactNode;
    showChevron?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
    id,
    title,
    subtitle,
    icon,
    isActive,
    onToggle,
    children,
    actionButton,
    showChevron = true,
}) => {
    return (
        <Card id={id} className="border rounded-lg overflow-hidden border-l-4 border-l-primary bg-card font-inter  transition-colors duration-200">
            <CardHeader
                className="cursor-pointer transition-colors p-2"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        {/*  Only render icon if it exists */}
                        {icon && (
                            <div className="text-foreground transition-colors">{icon}</div>
                        )}
                        <div>
                            <h3
                                className="font-inter text-[14px] font-semibold leading-[100%] text-foreground"
                                style={{ letterSpacing: "0" }}
                            >
                                {title}
                            </h3>
                            {subtitle && (
                                <p
                                    className="font-inter text-[12px] font-normal leading-4 text-muted-foreground mt-0.5"
                                    style={{ letterSpacing: "0" }}
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Button + Chevron Container */}
                    <div className="flex items-center gap-2">
                        {/* Only stop propagation on action button, not chevron */}
                        {actionButton && (
                            <div onClick={(e) => e.stopPropagation()}>
                                {actionButton}
                            </div>
                        )}
                        {/*  Only show chevron if showChevron is true */}
                        {showChevron && (
                            <>
                                {isActive ? (
                                    <ChevronUp className="h-4 w-4 text-primary transition-colors" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-primary transition-colors" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>

            {isActive && (
                <CardContent className="p-3 pt-3 pb-0.5 border-t border-border">
                    <div
                        className="font-inter text-[12px] font-normal leading-5 text-foreground transition-colors"
                        style={{ letterSpacing: "0" }}
                    >
                        {children}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
