// components/reports/charts/chart-area-gradient.tsx
"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
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
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

export function ChartAreaGradient({ data, config }: { data?: any[], config?: any }) {
  const store = useChartBuilderStore()

  const displayOptions = config?.displayOptions || store.displayOptions
  const aggregation = config?.aggregation || store.reportConfig?.aggregation
  const reportConfig = store.reportConfig

  const finalData =
    data && data.length > 0 ? data : dummyData

  if (!finalData.length) return null

  const categoryKey = config?.category || config?.xAxis || reportConfig?.category || "month"

  // Auto-detect numeric fields
  const valueKeys = Object.keys(finalData[0]).filter((key) => {
    if (key === categoryKey) return false
    return typeof finalData[0][key] === "number"
  })

  // Auto chart config
  const chartConfig: ChartConfig = valueKeys.reduce(
    (acc, key, index) => {
      acc[key] = {
        label: key,
        color: `var(--chart-${(index % 5) + 1})`,
      }
      return acc
    },
    {} as ChartConfig
  )

  // Percentage transform
  const transformedData = displayOptions?.asPercentage
    ? finalData.map((item) => {
      const total = valueKeys.reduce(
        (sum, key) => sum + Number(item[key] || 0),
        0
      )

      const newItem: any = { ...item }

      valueKeys.forEach((key) => {
        newItem[key] =
          total > 0
            ? Number(((item[key] / total) * 100).toFixed(1))
            : 0
      })

      return newItem
    })
    : finalData

  function getYAxisLabel() {
    if (displayOptions?.asPercentage) return "%"

    switch (aggregation) {
      case "count":
        return "Count"
      case "sum":
        return "Revenue"
      case "avg":
        return "Average"
      default:
        return "Value"
    }
  }

  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={transformedData}
              margin={{
                left: 12,
                right: 12,
                top: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  displayOptions?.asPercentage
                    ? `${value}%`
                    : value
                }
                label={{
                  value: getYAxisLabel(),
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />

              {/* Dynamic Gradients */}
              <defs>
                {valueKeys.map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={chartConfig[key]?.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartConfig[key]?.color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>

              {valueKeys.map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={`url(#fill-${key})`}
                  stroke={chartConfig[key]?.color}
                  fillOpacity={1}
                  stackId="a"
                />
              ))}

              {displayOptions?.showLegend && (
                <ChartLegend
                  content={<ChartLegendContent />}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}