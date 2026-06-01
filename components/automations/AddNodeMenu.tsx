


"use client";

import React from 'react';
import { GitBranch, MousePointer2, Clock, History, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface NodeTemplate {
    type: "trigger" | "action" | "condition";
    apiId: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface AddNodeMenuProps {
    onSelect: (template: NodeTemplate) => void;
    onOpenLibrary?: (type: 'action' | 'condition' | 'delay' | 'wait') => void;
    onCategoryHover?: (catId: string | null) => void;
    onMenuOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
    type?: 'trigger' | 'next';
}

const categories = [
    { id: 'action',    label: 'Action',         description: 'Do something',              icon: <MousePointer2 className="w-4 h-4" />, color: '#0073EA' },
    { id: 'condition', label: 'Condition',       description: 'Branch your workflow logic',  icon: <GitBranch className="w-4 h-4" />,    color: '#F97316' },
    { id: 'delay',     label: 'Delay',           description: 'Pause for a set time',        icon: <Clock className="w-4 h-4" />,        color: '#8B5CF6' },
    { id: 'wait',      label: 'Wait for event',  description: 'Wait until event occurs',     icon: <History className="w-4 h-4" />,      color: '#EC4899' },
];

const AddNodeMenu = ({
    onSelect, onOpenLibrary, onCategoryHover, onMenuOpenChange, children, type = 'next'
}: AddNodeMenuProps) => {
    const [open, setOpen] = React.useState(false);

    const handleOpenChange = (o: boolean) => {
        setOpen(o);
        onMenuOpenChange?.(o);
        if (!o) onCategoryHover?.(null);
    };

    const handleCategoryClick = (catId: string) => {
        // ✅ Simply open LibrarySidebar with the selected type — that's it!
        onOpenLibrary?.(catId as 'action' | 'condition' | 'delay' | 'wait');
        setOpen(false);
        onCategoryHover?.(null);
        onMenuOpenChange?.(false);
    };

    const handleCategoryHover = (catId: string | null) => {
        onCategoryHover?.(catId);
    };

    // ── Trigger mode: not used here, handled by InitialTriggerMenu ───────────
    if (type === 'trigger') return <>{children}</>;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                className="p-0 shadow-xl rounded-2xl border border-gray-100 overflow-hidden bg-white"
                style={{ width: 220 }}
                align="center"
                side="right"
                sideOffset={16}
                collisionPadding={16}
            >
                {/* Header */}
                <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-50">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        What happens next?
                    </p>
                </div>

                {/* ── 4 category buttons only ── */}
                <div className="p-1.5 space-y-0.5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            onMouseEnter={() => handleCategoryHover(cat.id)}
                            onMouseLeave={() => handleCategoryHover(null)}
                            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                        >
                            {/* Icon */}
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                            >
                                {cat.icon}
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-gray-700 group-hover:text-gray-900 leading-tight">
                                    {cat.label}
                                </p>
                                <p className="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">
                                    {cat.description}
                                </p>
                            </div>

                            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-50 px-3 py-1.5 flex justify-center">
                    <button className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 -ml-1 inline-block ring-1 ring-white" />
                        <span className="ml-1">Marketplace</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default AddNodeMenu;
