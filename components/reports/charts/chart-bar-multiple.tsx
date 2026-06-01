// components/reports/charts/chart-bar-multiple.tsx
"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Label, LabelList, Legend, XAxis, YAxis, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
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

export function ChartBarMultiple({ data, config }: { data?: any[], config?: any }) {
  const store = useChartBuilderStore()

  const displayOptions = config?.displayOptions || store.displayOptions
  const aggregation = config?.aggregation || store.reportConfig?.aggregation

  const finalData =
    data && data.length > 0 ? data : dummyData

  if (!finalData.length) return null

  // ✅ get xAxis key dynamically
  const xKey = config?.xAxis || store.reportConfig?.xAxis || "month"

  // ✅ get all Y keys dynamically
  const keys = Object.keys(finalData[0]).filter(
    (key) => key !== xKey && key !== "fill"
  )

  const chartConfig: ChartConfig = keys.reduce((acc, key, index) => {
    acc[key] = {
      label: key,
      color: `var(--chart-${(index % 5) + 1})`,
    }
    return acc
  }, {} as ChartConfig)

  // ✅ dynamic percentage conversion
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

  const getYAxisLabel = () => {
    if (displayOptions?.asPercentage) return "%"

    switch (aggregation) {
      case "count":
        return "Count"
      case "sum":
        return "Revenue"
      case "avg":
        return "Average"
      case "users":
        return "Users"
      default:
        return "Value"
    }
  }

  const yAxisLabel = getYAxisLabel()

  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <BarChart
            data={transformedData}
            margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey={xKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
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
              content={<ChartTooltipContent indicator="dashed" />}
            />

            {keys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                radius={[4, 4, 0, 0]}
                stackId="a"
              >
                {/* Dynamically apply colors to individual bars if available in finalData mapping */}
                {
                  finalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={keys.length > 1 ? chartConfig[key]?.color : (entry.fill || chartConfig[key]?.color)} />
                  ))
                }
                {displayOptions?.showLabels && (
                  <LabelList position="top" />
                )}
              </Bar>
            ))}

            {displayOptions?.showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 20 }}
              />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
