"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Task } from "@/types/task.types";
import { Project } from "@/stores/projects-store";

interface CycleProgressCardProps {
    isEmpty: boolean;
    tasks: Task[];
    project: Project;
}

export function CycleProgressCard({ isEmpty, tasks, project }: CycleProgressCardProps) {
    if (isEmpty) {
        return (
            <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Progress</h3>
                <div data-testid="cycle-progress-card-empty" className="bg-primary/10 rounded-md p-2 flex flex-col items-center justify-center text-center shadow-sm min-h-[280px] border-b-4 border-primary/50 relative overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center mt-4">
                        <div className="w-20 h-20 bg-background rounded-xl shadow-xl flex items-center justify-center mb-4 border border-border/50">
                            <TrendingUp className="h-10 w-10 text-primary" strokeWidth={1.5} />
                        </div>
                        <p className="text-primary text-xs max-w-[200px] leading-relaxed">
                            Add tasks to the cycle to view it's progress
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate Chart Data
    const statusConfig = project.taskStatusConfig || [];
    const chartData = statusConfig.map(status => {
        const count = tasks.filter(t => t.status === status.value).length;
        return {
            name: status.label,
            value: count,
            color: status.color || "#94a3b8"
        };
    }).filter(d => d.value > 0);

    const totalTasks = tasks.length;

    return (
        <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Progress</h3>
            <div data-testid="cycle-progress-card-chart" className="bg-card border border-border rounded-md p-2 shadow-sm min-h-[280px] flex flex-col">
                <div className="flex-1 flex flex-row items-center justify-between px-2">
                    {/* Left Side: Pie Chart */}
                    <div className="relative w-36 h-36 flex-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={4}
                                    cornerRadius={8}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
                                    formatter={(value: number, name: string) => [`${value} tasks`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span data-testid="cycle-progress-card-total-tasks" className="text-3xl font-bold text-foreground">{totalTasks}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Tasks</span>
                        </div>
                    </div>

                    {/* Right Side: Legend (Single Column) */}
                    <div className="flex flex-col gap-2 flex-1 max-w-[200px] ml-4">
                        {statusConfig.map((status) => {
                            const count = tasks.filter(t => t.status === status.value).length;
                            return (
                                <div data-testid={`cycle-progress-card-legend-${status.value}`} key={status.value} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{status.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
