"use client";

import React from "react";
import {
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Copy,
    Trash2,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RunHistoryItem {
    id: string;
    status: "success" | "failure";
    date: string;
    time: string;
    description: string;
    owner: {
        name: string;
        avatar: string;
    };
    actionCount: number;
}

const mockRunHistory: RunHistoryItem[] = [
    {
        id: "run-1",
        status: "success",
        date: "Jul 30,2025",
        time: "11:21 AM",
        description: "When an item is created set Due date to",
        owner: { name: "User", avatar: "/images/avatar-placeholder.png" },
        actionCount: 1
    },
    {
        id: "run-2",
        status: "success",
        date: "Jul 30,2025",
        time: "11:21 AM",
        description: "When an item is created set Due date to",
        owner: { name: "User", avatar: "/images/avatar-placeholder.png" },
        actionCount: 1
    },
    {
        id: "run-3",
        status: "success",
        date: "Jul 30,2025",
        time: "11:21 AM",
        description: "When an item is created set Due date to",
        owner: { name: "User", avatar: "/images/avatar-placeholder.png" },
        actionCount: 1
    },
    {
        id: "run-4",
        status: "failure",
        date: "Jul 30,2025",
        time: "11:21 AM",
        description: "When an item is created set Due date to",
        owner: { name: "User", avatar: "/images/avatar-placeholder.png" },
        actionCount: 1
    },
    {
        id: "run-5",
        status: "failure",
        date: "Jul 30,2025",
        time: "11:21 AM",
        description: "When an item is created set Due date to",
        owner: { name: "User", avatar: "/images/avatar-placeholder.png" },
        actionCount: 1
    }
];

interface RunHistoryProps {
    onBack: () => void;
}

const RunHistory = ({ onBack }: RunHistoryProps) => {
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:text-blue-600 text-gray-600 transition-colors group" onClick={onBack}>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[15px] font-semibold">Back to Automations</span>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-3 pb-10">
                    {[...mockRunHistory, ...mockRunHistory].map((run, i) => (
                        <div
                            key={`${run.id}-${i}`}
                            className="group flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all duration-200"
                        >
                            {/* Status Icon */}
                            <div className="flex items-center justify-center shrink-0">
                                {run.status === "success" ? (
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                )}
                            </div>

                            {/* Date/Time */}
                            <div className="flex flex-col min-w-[120px]">
                                <span className="text-[13px] font-semibold text-gray-900">{run.date}</span>
                                <span className="text-[11px] font-medium text-gray-400">{run.time}</span>
                            </div>

                            {/* Description */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-gray-700 font-medium truncate">
                                    {run.description} <span className="font-bold text-gray-900">Due date</span>
                                </p>
                            </div>

                            {/* Actions Area */}
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 text-[11px] h-8 px-2.5 gap-1.5 rounded-lg"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="font-medium">Copy ID</span>
                                </Button>

                                <div className="h-4 w-[1px] bg-gray-200" />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Owner */}
                            <div className="relative shrink-0 ml-2">
                                <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                                    <AvatarImage src={run.owner.avatar} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                                        {run.owner.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                                    {run.actionCount}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default RunHistory;
