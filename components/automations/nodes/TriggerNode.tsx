


"use client";

import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import {
    Zap, MoreVertical, Copy, Trash2, CornerDownRight,
    Plus, Edit3, RefreshCw, AlertTriangle, Calendar,
    UserPlus, ListPlus, Eye, CheckCircle2, ChevronDown,
    MessageSquare, Clock3, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InitialTriggerMenu from '../InitialTriggerMenu';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TriggerNodeData {
    label?: string;
    description?: string;
    color?: string;
    sequence?: number;
    triggerId?: string;
    isPlaceholder?: boolean;
    onTriggerSelect?: (template: any) => void;
    onConfigClick?: (node: any) => void;
    onChangeTriggerType?: () => void;
    [key: string]: unknown;
}

const TriggerNode = ({ data, selected, id, type, ...props }: NodeProps<Node<TriggerNodeData>>) => {
    const label = data.label || "Choose a trigger";
    const sequence = data.sequence || 1;
    const onConfigClick = data.onConfigClick as any;
    const onChangeTriggerType = data.onChangeTriggerType as () => void;
    const triggerId = data.triggerId || "";

    const [menuOpen, setMenuOpen] = React.useState(false);

    // ── Icon map ──────────────────────────────────────────────────────────────
    const getIcon = (id: string, cls = "w-3.5 h-3.5", style?: React.CSSProperties) => {
        const p = { className: cls, style };
        switch (id) {
            case 'TASK_CREATED': return <Plus {...p} />;
            case 'TASK_UPDATED': return <Edit3 {...p} />;
            case 'STATUS_CHANGED': return <RefreshCw {...p} />;
            case 'STATUS_CHANGED_TO': return <CheckCircle2 {...p} />;
            case 'PRIORITY_CHANGED': return <AlertTriangle {...p} />;
            case 'DUE_DATE_CHANGED': return <Calendar {...p} />;
            case 'ASSIGNEE_CHANGED': return <UserPlus {...p} />;
            case 'SUBTASK_CREATED': return <ListPlus {...p} />;
            case 'WATCHER_ADDED': return <Eye {...p} />;
            case 'COMMENT_ADDED': return <MessageSquare {...p} />;
            case 'TIME_TRACKED': return <Clock3 {...p} />;
            case 'TAG_ADDED': return <Tag {...p} />;
            default: return <Zap {...p} />;
        }
    };

    const accentColor = (data.color as string) || '#00CA72';

    return (
        // ── Node root — fixed narrow width like Monday.com ──────────────────
        <div className="relative" style={{ width: 220 }}>

            {/* Hidden input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !bg-transparent opacity-0"
            />

            {/* Step badge — top-left pill */}
            <div className="absolute -top-2 -left-2 z-20 flex items-center gap-1 bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm">
                <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                >
                    {getIcon(triggerId, "w-2 h-2 text-white fill-white")}
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none">
                    Trigger
                </span>
            </div>

            {data.isPlaceholder ? (
                /* ── PLACEHOLDER STATE ─────────────────────────────────────── */
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`
                            w-full flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl
                            border-2 border-dashed transition-all
                            ${menuOpen
                                ? 'border-[#00CA72] ring-2 ring-[#00CA72]/10 shadow-md'
                                : 'border-gray-200 hover:border-[#00CA72] hover:shadow-sm'
                            }
                        `}
                    >
                        {/* Green circle icon */}
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: '#00CA72' }}>
                            <Zap className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                        {/* Label */}
                        <span className="flex-1 text-left text-[12px] font-semibold text-gray-500 truncate">
                            {data.triggerId ? data.label : "Choose a trigger"}
                        </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 flex-shrink-0 text-gray-300 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999]">
                            <InitialTriggerMenu
                                onSelect={(template) => {
                                    data.onTriggerSelect?.(template);
                                    setMenuOpen(false);
                                }}
                                onExploreAll={() => {
                                    data.onChangeTriggerType?.();
                                    setMenuOpen(false);
                                }}
                            />
                        </div>
                    )}
                </div>

            ) : (
                /* ── SELECTED TRIGGER CARD ─────────────────────────────────── */
                <div
                    onClick={() => {
                        const noConfigTriggers = ['TASK_CREATED', 'SUBTASK_CREATED', 'WATCHER_ADDED'];
                        if (noConfigTriggers.includes(triggerId)) return; // ✅ No config panel
                        onConfigClick?.({ data, id, type, ...props });
                    }}
                    className={`
                        relative w-full bg-white rounded-xl border cursor-pointer
                        transition-all duration-200 overflow-hidden
                        ${selected
                            ? 'border-blue-400 shadow-md ring-2 ring-blue-400/20'
                            : 'border-gray-150 shadow-sm hover:shadow-md hover:border-gray-200'
                        }
                    `}
                    style={{ borderColor: selected ? undefined : `${accentColor}30` }}
                >
                    {/* Left color accent bar */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                        style={{ backgroundColor: accentColor }}
                    />

                    <div className="pl-3 pr-2 py-2.5 flex items-center gap-2">
                        {/* Icon circle */}
                        <div
                            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: `${accentColor}18` }}
                        >
                            {getIcon(triggerId, "w-3.5 h-3.5", { color: accentColor })}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-gray-800 leading-tight truncate">
                                {label}
                            </p>
                            <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5"
                                style={{ color: accentColor }}>
                                When this happens
                            </p>
                        </div>

                        {/* 3-dot menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost" size="icon"
                                    className="w-6 h-6 rounded-md flex-shrink-0 text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100 text-[12px]">
                                <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium cursor-pointer">
                                    <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="gap-2 py-1.5 text-[12px] font-medium cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onChangeTriggerType?.(); }}
                                >
                                    <CornerDownRight className="w-3.5 h-3.5 text-gray-400" /> Change trigger type
                                </DropdownMenuItem>
                                <div className="h-px bg-gray-100 my-1" />
                                <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                style={{
                    width: 10, height: 10,
                    background: accentColor,
                    border: '2px solid white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    bottom: -5,
                }}
            />
        </div>
    );
};

export default memo(TriggerNode);

