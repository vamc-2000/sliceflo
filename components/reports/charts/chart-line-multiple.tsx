// components/reports/charts/chart-line-multiple.tsx
"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Label,
} from "recharts"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useChartBuilderStore } from "@/stores/chartBuilderStore"

const dummyData = [
  { month: "January", desktop: 186, mobile: 80, tablet: 50 },
  { month: "February", desktop: 305, mobile: 200, tablet: 90 },
  { month: "March", desktop: 237, mobile: 120, tablet: 70 },
  { month: "April", desktop: 73, mobile: 190, tablet: 110 },
  { month: "May", desktop: 209, mobile: 130, tablet: 85 },

]

export function ChartLineMultiple({ data, config }: { data?: any[], config?: any }) {
  const store = useChartBuilderStore()

  const displayOptions = config?.displayOptions || store.displayOptions
  const aggregation = config?.aggregation || store.reportConfig?.aggregation
  const reportConfig = store.reportConfig

  const finalData =
    data && data.length > 0 ? data : dummyData

  if (!finalData.length) return null

  const xKey = config?.xAxis || reportConfig?.xAxis || "month"

  const keys = Object.keys(finalData[0]).filter(
    (key) => key !== xKey
  )

  // ✅ Dynamic colors
  const chartConfig: ChartConfig = keys.reduce((acc, key, index) => {
    acc[key] = {
      label: key,
      color: `var(--chart-${(index % 5) + 1})`,
    }
    return acc
  }, {} as ChartConfig)

  // ✅ Percentage toggle
  const transformedData = displayOptions?.asPercentage
    ? finalData.map((item) => {
      const total = keys.reduce(
        (sum, key) => sum + Number(item[key] || 0),
        0
      )

      const newItem: any = { ...item }

      keys.forEach((key) => {
        newItem[key] =
          total > 0
            ? Number(((item[key] / total) * 100).toFixed(1))
            : 0
      })

      return newItem
    })
    : finalData

  // ✅ Dynamic Y label
  const yAxisLabel = displayOptions?.asPercentage
    ? "%"
    : aggregation
      ?.charAt(0)
      .toUpperCase() + aggregation?.slice(1) || "Value"

  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <LineChart
            data={transformedData}
            margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={displayOptions?.asPercentage ? [0, 100] : ["auto", "auto"]}
            >
              <Label
                value={yAxisLabel}
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle" }}
              />
            </YAxis>

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

            {keys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={chartConfig[key]?.color}
                strokeWidth={2}
                dot={false}
              />
            ))}

            {displayOptions?.showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 20 }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}