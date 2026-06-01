



"use client";

import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { CheckCircle2, MoreVertical, Copy, Trash2, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionNodeData {
    label?: string;
    description?: string;
    color?: string;
    sequence?: number;
    actionType?: string;
    value?: string;
    onConfigClick?: (node: any) => void;
    [key: string]: unknown;
}

const ActionNode = ({ data, selected, id, type, ...props }: NodeProps<Node<ActionNodeData>>) => {
    const label = data.label || "Then do something";
    const sequence = data.sequence || 2;
    const onConfigClick = data.onConfigClick as any;
    const accentColor = (data.color as string) || '#0073EA';

    return (
        <div className="relative" style={{ width: 220 }}>

            {/* Input handle */}
            <Handle type="target" position={Position.Top} id="input"
                style={{ width: 10, height: 10, background: accentColor, border: '2px solid white', top: -5 }}
            />

            {/* Step badge */}
            <div className="absolute -top-2 -left-2 z-20 flex items-center gap-1 bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                    <CheckCircle2 className="w-2 h-2 text-white" />
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none">Action</span>
            </div>

            {/* Card */}
            <div
                onClick={() => onConfigClick?.({ data, id, type, ...props })}
                className={`
                    relative w-full bg-white rounded-xl border cursor-pointer
                    transition-all duration-200 overflow-hidden
                    ${selected ? 'border-blue-400 shadow-md ring-2 ring-blue-400/20' : 'border-gray-150 shadow-sm hover:shadow-md'}
                `}
                style={{ borderColor: selected ? undefined : `${accentColor}30` }}
            >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: accentColor }} />

                <div className="pl-3 pr-2 py-2.5 flex items-center gap-2">
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${accentColor}18` }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-800 leading-tight truncate">{label}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: accentColor }}>
                            Then do this
                        </p>
                    </div>

                    {/* 3-dot menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-md flex-shrink-0 text-gray-300 hover:text-gray-500 hover:bg-gray-50">
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-gray-100">
                            <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium cursor-pointer">
                                <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium cursor-pointer">
                                <CornerDownRight className="w-3.5 h-3.5 text-gray-400" /> Paste below
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem className="gap-2 py-1.5 text-[12px] font-medium text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Output handle */}
            <Handle type="source" position={Position.Bottom} id="output"
                style={{ width: 10, height: 10, background: accentColor, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', bottom: -5 }}
            />
        </div>
    );
};

export default memo(ActionNode);
