"use client";

import { useProfileStore } from "@/stores/profile-store";

export default function UseRole() {
    const { workspaceRoles } = useProfileStore();
    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div>
                <h2 className="text-[16px] font-semibold text-foreground tracking-tight">User Roles</h2>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Centrally managed roles that define workspace access levels and permissions.
                </p>
            </div>

            {/* Roles List */}
            <div className="grid gap-2">
                {workspaceRoles.map((role) => (
                    <div
                        key={role.id}
                        className="flex items-center justify-between px-4 py-3 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border/50 transition-all hover:bg-muted/50 hover:border-border group"
                    >
                        <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">
                                {role.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted dark:bg-muted/20 border border-border/50 rounded-lg flex items-center justify-center">
                                System
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
