

"use client";

import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { GitBranch, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ConditionNodeData {
    label?: string;
    description?: string;
    color?: string;
    sequence?: number;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    onConfigClick?: (node: any) => void;
    [key: string]: unknown;
}

const ConditionNode = ({ data, selected, id, type, ...props }: NodeProps<Node<ConditionNodeData>>) => {
    const label = data.label || "If condition is met";
    const sequence = data.sequence || 2;
    const onConfigClick = data.onConfigClick as any;
    const accentColor = (data.color as string) || '#F97316';

    return (
        <div className="relative" style={{ width: 220 }}>

            {/* Input handle */}
            <Handle type="target" position={Position.Top} id="input"
                className="border-2 border-background"
                style={{ width: 10, height: 10, background: accentColor, top: -5 }}
            />

            {/* Step badge */}
            <div className="absolute -top-2 -left-2 z-20 flex items-center gap-1 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-sm">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                    <GitBranch className="w-2 h-2 text-white" />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide leading-none">Condition</span>
            </div>

            {/* Card */}
            <div
                onClick={() => onConfigClick?.({ data, id, type, ...props })}
                className={`
                    relative w-full bg-card rounded-xl border border-border cursor-pointer
                    transition-all duration-200 overflow-hidden
                    ${selected ? 'border-orange-400 shadow-md ring-2 ring-orange-400/20' : 'shadow-sm hover:shadow-md'}
                `}
                style={{ borderColor: selected ? undefined : `${accentColor}30` }}
            >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: accentColor }} />

                <div className="pl-3 pr-2 py-2.5 flex items-center gap-2">
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${accentColor}18` }}>
                        <GitBranch className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-foreground leading-tight truncate">{label}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: accentColor }}>
                            If condition met
                        </p>
                    </div>

                    {/* 3-dot menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-md flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer">
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-1">
                            <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer hover:bg-accent">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Yes / No branch labels */}
                <div className="flex border-t border-border divide-x divide-border">
                    <div className="flex-1 py-1 text-center bg-card">
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-wide">✓ Yes path</span>
                    </div>
                    <div className="flex-1 py-1 text-center bg-card">
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">✕ No path</span>
                    </div>
                </div>
            </div>

            {/* Yes handle (left) */}
            <Handle type="source" position={Position.Bottom} id="yes"
                className="border-2 border-background"
                style={{ width: 10, height: 10, background: '#22C55E', bottom: -5, left: '30%' }}
            />
            {/* No handle (right) */}
            <Handle type="source" position={Position.Bottom} id="no"
                className="border-2 border-background"
                style={{ width: 10, height: 10, background: '#EF4444', bottom: -5, left: '70%' }}
            />
        </div>
    );
};

export default memo(ConditionNode);
