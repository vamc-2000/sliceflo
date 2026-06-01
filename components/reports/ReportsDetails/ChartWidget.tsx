// components/reports/ReportsDetails/ChartWidget.tsx
"use client";

import React from "react";
import { ReportChart, ChartType } from "@/types/reports.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLineMultiple } from "../charts/chart-line-multiple";
import { ChartPieLegend } from "../charts/chart-pie-legend";
import { ChartBarMultiple } from "../charts/chart-bar-multiple";
import { ChartPieDonut } from "../charts/chart-pie-donut";
import { ChartRadarDots } from "../charts/chart-radar-dots";
import { ChartAreaLegend } from "../charts/chart-area-legend";
import { ChartAreaGradient } from "../charts/chart-area-gradient";
import { computeChartData } from "@/lib/chart-utils";

// Mapping of chart types to components
const ChartComponents: Record<string, React.ComponentType<any>> = {
  line: ChartLineMultiple,
  bar: ChartBarMultiple,
  pie: ChartPieLegend,
  doughnut: ChartPieDonut,
  radar: ChartRadarDots,
  area: ChartAreaLegend,
  areaG: ChartAreaGradient,
};

interface ChartWidgetProps {
  chart: ReportChart;
  projectId?: string;
  projects?: any[];
  tasks?: any[];
}

export default function ChartWidget({ chart, projectId, projects, tasks }: ChartWidgetProps) {
  const ChartComponent = ChartComponents[chart.type] || (() => <div>Unknown chart type: {chart.type}</div>);

  const computeLiveData = () => {
    if (!projectId || !projects || !tasks) return null;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    return computeChartData({
      tasks: tasks.filter((t: any) => t.projectId === projectId),
      project,
      xAxis: chart.xAxis,
      yAxis: chart.yAxis,
      aggregation: chart.aggregation || "count",
      groupBy: chart.groupBy || "none",
    });
  };

  const liveData = computeLiveData();
  const transformSavedData = () => {
    if (!chart.data?.labels || !chart.data?.datasets?.length) return [];

    const { labels, datasets } = chart.data;
    const xAxisKey = chart.xAxis || "status";

    // Is this a grouped/multi-series chart?
    const isGrouped = datasets.length > 1 || (chart.groupBy && chart.groupBy !== "none");

    return labels.map((label, index) => {
      const item: any = { [xAxisKey]: label };

      datasets.forEach((dataset) => {
        item[dataset.label || "value"] = dataset.data?.[index] ?? 0;
      });

      // Only add `fill` for single-series charts
      // For grouped charts, recharts uses chartConfig colors per dataKey
      if (!isGrouped) {
        if (chart.colors?.[index]) {
          item.fill = chart.colors[index];
        } else if (datasets[0]?.backgroundColor?.[index]) {
          item.fill = datasets[0].backgroundColor[index];
        }
      }

      return item;
    });
  };
  // Live data takes priority → saved data → empty array
  const chartData = liveData && liveData.length > 0
    ? liveData
    : transformSavedData();

  return (
    <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 border-[#E5E5EA]">
      <CardHeader className="py-3 px-4 border-b border-[#F2F2F7]">
        <CardTitle className="text-sm font-semibold text-[#001F3F] truncate">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-hidden min-h-[250px]">
        <ChartComponent
          data={chartData}
          config={{
            ...chart,
            xAxis: chart.xAxis,
            displayOptions: chart.displayOptions ?? {
              showLegend: false,
              showLabels: false,
              asPercentage: false,
              donut: false,
            },
            groupBy: chart.groupBy || "none",
          }}
        />
      </CardContent>
    </Card>
  );
}
