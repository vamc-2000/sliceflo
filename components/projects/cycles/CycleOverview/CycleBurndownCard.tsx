"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Task } from "@/types/task.types";
import { Project } from "@/stores/projects-store";

interface CycleBurndownCardProps {
    isEmpty: boolean;
    tasks: Task[];
    project: Project;
}

export function CycleBurndownCard({ isEmpty, tasks, project }: CycleBurndownCardProps) {
    if (isEmpty) {
        return (
            <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Task Burndown</h3>
                <div className="bg-[#FFF2F2] rounded-md p-2 flex flex-col items-center justify-center text-center shadow-sm min-h-[280px] border-b-4 border-red-400 relative overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center mt-4">
                        <div className="w-20 h-20 bg-white rounded-xl shadow-xl flex items-center justify-center mb-4 border border-white/50">
                            <BarChart3 className="h-10 w-10 text-red-200" strokeWidth={1.5} />
                        </div>
                        <p className="text-red-400 font-semibold text-xs max-w-[220px] leading-relaxed">
                            Add tasks to this cycle to generate the burndown chart.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate Chart Data based on Priority
    const priorityConfig = project.taskPriorityConfig || [];
    const chartData = priorityConfig.map(priority => {
        const count = tasks.filter(t => t.priority === priority.value || t.priority === priority.label).length;
        return {
            name: priority.label,
            value: count,
            color: priority.color || "#94a3b8"
        };
    }).sort((a, b) => (priorityConfig.find(p => p.label === b.name)?.order || 0) - (priorityConfig.find(p => p.label === a.name)?.order || 0));

    return (
        <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Task Burndown</h3>
            <div className="bg-white border border-gray-100 rounded-md p-2 shadow-sm min-h-[280px] flex flex-col">
                <div className="flex-1 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                            barSize={30}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
