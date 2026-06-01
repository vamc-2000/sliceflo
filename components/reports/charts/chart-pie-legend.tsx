// components/reports/charts/chart-pie-legend.tsx
"use client"

import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useChartBuilderStore } from "@/stores/chartBuilderStore"

const dummyData = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90, }
]

export function ChartPieLegend({ data, config }: { data?: any[], config?: any }) {
  const store = useChartBuilderStore()

  const displayOptions = config?.displayOptions || store.displayOptions
  const reportConfig = store.reportConfig

  const finalData =
    data && data.length > 0 ? data : dummyData

  if (!finalData.length) return null

  const nameKey = config?.category || config?.xAxis || reportConfig?.category || "browser"
  const valueKey = config?.value || config?.yAxis || reportConfig?.value || "visitors"

  // ✅ Auto assign colors per slice
  const chartConfig: ChartConfig = finalData.reduce(
    (acc, item, index) => {
      const key = item[nameKey]

      acc[key] = {
        label: key,
        color: `var(--chart-${(index % 5) + 1})`,
      }

      return acc
    },
    {} as ChartConfig
  )

  // ✅ Percentage toggle
  const total = finalData.reduce(
    (sum, item) => sum + Number(item[valueKey] || 0),
    0
  )

  const transformedData = displayOptions?.asPercentage
    ? finalData.map((item) => ({
      ...item,
      [valueKey]:
        total > 0
          ? Number(((item[valueKey] / total) * 100).toFixed(1))
          : 0,
    }))
    : finalData

  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className="h-full">
              <Pie
                data={transformedData}
                dataKey={valueKey}
                nameKey={nameKey}
                outerRadius="70%"   // ✅ percentage instead of number
                innerRadius={displayOptions?.donut ? "50%" : 0}
                label={displayOptions?.showLabels}
              >
                {transformedData.map((entry, index) => {
                  const key = entry[nameKey]
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartConfig[key]?.color}
                    />
                  )
                })}
              </Pie>


              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />

              {displayOptions?.showLegend && (
                <ChartLegend
                  content={
                    <ChartLegendContent nameKey={nameKey} />
                  }
                  // className="flex-wrap gap-2"
                  className="translate-y-0! flex-wrap gap-1 *:basis-1/3 *:justify-center p-0 m-0"
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}