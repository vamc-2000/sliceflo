// components/teams/TeamActionsMenu.tsx
"use client";

import { MoreHorizontal, Pencil, Trash2, UserPlus, Star, Archive, PanelsTopLeft, LayoutDashboard, Mail, Trophy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type TeamActionsMenuProps = {
    teamId: string;
    teamName: string;
    onRename?: (teamId: string) => void;
    onDelete?: (teamId: string) => void;
    onInviteMembers?: (teamId: string) => void;
    onCreateGoal?: (teamId: string) => void;
    onCreateProject?: (teamId: string) => void;
};

export function TeamActionsMenu({
    teamId,
    teamName,
    onRename,
    onDelete,
    onInviteMembers,
    onCreateGoal,
    onCreateProject
}: TeamActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                    aria-label={`More actions for ${teamName}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4 text-[#FFFFFF]" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={4}
                className="w-58 border-0 border-b-[5px] border-[#001F3F] rounded-lg "
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. Rename Team */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        onRename?.(teamId);
                    }}
                >
                    <Pencil className="mr-2 h-4 w-4 text-[#001F3F]" />
                    <span className="text-[#001F3F]">Rename Team</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 2. Invite Members */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onInviteMembers?.(teamId);
                    }}
                >
                    <LayoutDashboard className="mr-2 h-4 w-4 text-[#001F3F]" />
                    <span className="text-[#001F3F]">Create Portfolio</span>
                </DropdownMenuItem>

                {/* 3. Favorite / Unfavorite */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onCreateProject?.(teamId); 
                    }}
                >
                    <PanelsTopLeft className="mr-2 h-4 w-4 text-[#001F3F]" />
                    <span className="text-[#001F3F]">Create Projects</span>
                </DropdownMenuItem>

                {/* 4. Archive */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onCreateGoal?.(teamId);
                    }}
                >
                    <Trophy className="mr-2 h-4 w-4 text-[#001F3F]" />
                    <span className="text-[#001F3F]">Create Goals</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        // onArchive?.(teamId);
                    }}
                >
                    <Mail className="mr-2 h-4 w-4 text-[#001F3F]" />
                    <span className="text-[#001F3F]">Send a message via email</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 5. Delete */}
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                        e.preventDefault();
                        onDelete?.(teamId);
                    }}
                >
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                    <span>Delete Team</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
