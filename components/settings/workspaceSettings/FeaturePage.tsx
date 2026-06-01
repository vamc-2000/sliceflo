"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
    id: string;
    title: string;
    description: string;
    isEnabled: boolean;
}

const initialFeatures: Feature[] = [
    {
        id: "cycle",
        title: "Cycle",
        description: "Break projects into focused timeframes, align around deadlines, and move forward with clarity.",
        isEnabled: true,
    },
    {
        id: "triage",
        title: "Triage",
        description: "Feature subtext",
        isEnabled: false,
    },
    {
        id: "epic",
        title: "Epic",
        description: "Feature subtext",
        isEnabled: false,
    },
];

export default function FeaturePage() {
    const [features, setFeatures] = useState<Feature[]>(initialFeatures);

    const toggleFeature = (id: string) => {
        setFeatures(prev => prev.map(f => 
            f.id === id ? { ...f, isEnabled: !f.isEnabled } : f
        ));
    };

    return (
        <div className="w-full space-y-1">
            {/* Header section */}
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--primary)] dark:text-white tracking-tight">
                    Features
                </h2>
                <p className="text-[14px] text-muted-foreground font-medium">
                    Subtext
                </p>
            </div>

            {/* Feature List */}
            <div className="space-y-2">
                {features.map((feature) => (
                    <div 
                        key={feature.id}
                        className={cn(
                            "group relative flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-sm transition-all",
                            "border-l-[4px] border-l-[var(--primary)]"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            {/* Icon Box */}
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/60 border border-border/50 text-muted-foreground group-hover:text-[var(--primary)] transition-colors">
                                <LayoutGrid className="w-4 h-4" />
                            </div>

                            {/* Text Content */}
                            <div className="space-y-1">
                                <h3 className="text-[12px] font-semibold text-[var(--primary)] dark:text-white leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-medium max-w-2xl leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>

                        {/* Control Section */}
                        <div className="flex items-center gap-4 pl-4 border-l border-border/50">
                            <Switch 
                                checked={feature.isEnabled}
                                onCheckedChange={() => toggleFeature(feature.id)}
                                className="scale-110"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
