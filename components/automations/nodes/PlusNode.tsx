"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, MousePointer2, GitBranch, Clock, History } from 'lucide-react';
import AddNodeMenu, { type NodeTemplate } from '../AddNodeMenu';

interface PlusNodeData {
    onAdd: (template: NodeTemplate, plusNodeId: string, sourceHandle?: string) => void;
    onOpenLibrary: (type: 'action' | 'condition' | 'delay' | 'wait', plusNodeId: string, sourceHandle?: string) => void;
    parentId: string;
    sourceHandle?: string;
}

const categories = [
    { id: 'action',    hoverText: 'Then do this',              icon: <Plus className="w-3.5 h-3.5" />, color: '#0073EA' },
    { id: 'condition', hoverText: 'If condition is met',       icon: <Plus className="w-3.5 h-3.5" />, color: '#F97316' },
    { id: 'delay',     hoverText: 'Delay workflow',             icon: <Clock className="w-3.5 h-3.5" />, color: '#8B5CF6' },
    { id: 'wait',      hoverText: 'Wait for event',             icon: <History className="w-3.5 h-3.5" />, color: '#EC4899' },
];

const PlusNode = ({ data, id }: NodeProps & { data: PlusNodeData }) => {
    const [hoveredCat, setHoveredCat]   = useState<string | null>(null);
    const [selectedCat, setSelectedCat] = useState<string | null>(null);
    const [menuOpen, setMenuOpen]       = useState(false);

    const activeCat = categories.find(c => c.id === (hoveredCat ?? selectedCat));

    return (
        <div className="flex flex-col items-center" style={{ width: 220 }}>

            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                id="target"
                style={{ width: 10, height: 10, background: '#CBD5E1', border: '2px solid white', top: -5 }}
            />

            {/* ── Wide rectangle button ── */}
            <AddNodeMenu
                type="next"
                onSelect={(template) => data.onAdd(template, id, data.sourceHandle)}
                onOpenLibrary={(type) => {
                    setSelectedCat(type);
                    data.onOpenLibrary(type, id, data.sourceHandle);
                }}
                onMenuOpenChange={setMenuOpen}
                onCategoryHover={setHoveredCat}
            >
                <div
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 bg-white rounded-xl
                        border-2 border-dashed cursor-pointer transition-all
                        ${menuOpen
                            ? 'border-blue-400 shadow-md ring-2 ring-blue-400/10'
                            : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
                        }
                    `}
                    style={activeCat && !menuOpen ? {
                        borderColor: activeCat.color,
                        boxShadow: `0 0 0 3px ${activeCat.color}10`
                    } : {}}
                    title="Add step"
                >
                    {/* Icon box (Square with +) */}
                    <div
                        className="w-4 h-4 rounded-lg flex-shrink-0 flex items-center justify-center transition-all bg-white border border-gray-100 shadow-sm"
                        style={{
                            color: activeCat ? activeCat.color : '#94A3B8'
                        }}
                    >
                        {activeCat ? activeCat.icon : <Plus className="w-2 h-2" />}
                    </div>

                    {/* Label */}
                    <span
                        className="flex-1 text-left text-[12px] font-semibold truncate transition-all text-gray-700"
                        style={{ color: activeCat ? activeCat.color : undefined }}
                    >
                        {activeCat ? activeCat.hoverText : 'What happens next?'}
                    </span>
                </div>
            </AddNodeMenu>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="source"
                style={{ width: 10, height: 10, background: '#CBD5E1', border: '2px solid white', bottom: -5, opacity: 0 }}
            />
        </div>
    );
};

export default memo(PlusNode);
