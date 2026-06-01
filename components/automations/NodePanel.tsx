"use client";

import React from 'react';
import { Zap, CheckCircle2, GitBranch, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutomationStore } from "@/stores/automation-store";
import { NodeTemplate } from './AddNodeMenu';




interface NodePanelItemProps {
    template: NodeTemplate;
    onDragStart: (event: React.DragEvent, nodeType: string, template: NodeTemplate) => void;
    onClick: (template: NodeTemplate) => void;
}

const NodePanelItem = ({ template, onDragStart, onClick }: NodePanelItemProps) => {
    const isTrigger = template.type === 'trigger';
    const isCondition = template.type === 'condition';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, template.type, template)}
            onClick={() => onClick(template)}
            className={`group relative p-3.5 rounded-xl border border-gray-100 bg-white transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)]
                ${isTrigger ? 'hover:border-emerald-200' : isCondition ? 'hover:border-orange-200' : 'hover:border-blue-200'}`}
        >
            <div className="flex items-center gap-3.5">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors duration-300
                        ${isTrigger ? 'text-white' : 'border'}`}
                    style={{
                        backgroundColor: isTrigger ? template.color : `${template.color}10`,
                        color: isTrigger ? 'white' : template.color,
                        borderColor: isTrigger ? 'transparent' : `${template.color}30`
                    }}
                >
                    {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors">
                        {template.label}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5 uppercase tracking-wider">
                        {template.description}
                    </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                </div>
            </div>
        </div>
    );
};

interface NodePanelProps {
    onDragStart: (event: React.DragEvent, nodeType: string, template: NodeTemplate) => void;
    onAddItem: (template: NodeTemplate) => void;
}

const NodePanel = ({ onDragStart, onAddItem }: NodePanelProps) => {
    const { triggerOptions, actionOptions, fetchMetadata } = useAutomationStore();

    React.useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    const nodeTemplates: NodeTemplate[] = [
        ...(triggerOptions ?? []).map((t) => ({
            type: "trigger" as const,
            apiId: t.id,
            label: t.label,
            description: t.category,
            icon: <Zap className="w-4 h-4" />,
            color: "#00CA72",
        })),
        ...(actionOptions ?? []).map((a) => ({
            type: a.hasBranch ? ("condition" as const) : ("action" as const),
            apiId: a.id,
            label: a.label,
            description: a.hasBranch ? "Branch" : "Action",
            icon: a.hasBranch ? <GitBranch className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />,
            color: a.hasBranch ? "#F97316" : "#0073EA",
        })),
    ];

    const groupedTemplates = {
        trigger: nodeTemplates.filter(t => t.type === 'trigger'),
        action: nodeTemplates.filter(t => t.type === 'action'),
        condition: nodeTemplates.filter(t => t.type === 'condition')
    };

    return (
        <div className="flex flex-col h-full bg-white select-none overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <h2 className="text-[13px] font-bold text-gray-900 tracking-tight uppercase tracking-[0.15em]">Components</h2>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Drag or click to build workflow</p>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-9">
                    {/* Triggers Section */}
                    {groupedTemplates.trigger.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00CA72] shadow-[0_0_8px_rgba(0,202,114,0.4)]"></div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Event Triggers</h3>
                            </div>
                            <div className="space-y-2.5">
                                {groupedTemplates.trigger.map((template, index) => (
                                    <NodePanelItem
                                        key={`trigger-${index}`}
                                        template={template}
                                        onDragStart={onDragStart}
                                        onClick={onAddItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions Section */}
                    {groupedTemplates.action.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0073EA] shadow-[0_0_8px_rgba(0,115,234,0.4)]"></div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Action Steps</h3>
                            </div>
                            <div className="space-y-2.5">
                                {groupedTemplates.action.map((template, index) => (
                                    <NodePanelItem
                                        key={`action-${index}`}
                                        template={template}
                                        onDragStart={onDragStart}
                                        onClick={onAddItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Conditions Section */}
                    {groupedTemplates.condition.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Logic Gates</h3>
                            </div>
                            <div className="space-y-2.5">
                                {groupedTemplates.condition.map((template, index) => (
                                    <NodePanelItem
                                        key={`condition-${index}`}
                                        template={template}
                                        onDragStart={onDragStart}
                                        onClick={onAddItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default NodePanel;
