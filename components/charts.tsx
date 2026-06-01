"use client";

import {
  AreaChart, Area, XAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Legend,
} from "recharts";

// ── Overview Chart ──
export function OverviewChart({ data, onDotClick }: { data: { date: string; current: number; previous: number }[], onDotClick?: (date: string) => void }) {
  console.log('data', data)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} onClick={(e) => {
        if (e?.activeLabel && onDotClick) {
          onDotClick(e.activeLabel)
        }
      }}
        style={{ cursor: "pointer" }}
      >
        <defs>
          <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradPrevious" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d1d5db" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#d1d5db" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
        <Area type="monotone" dataKey="previous" stroke="#d1d5db" strokeWidth={1.5} fill="url(#gradPrevious)" />
        <Area type="monotone" dataKey="current" stroke="#1a1a1a" strokeWidth={2} fill="url(#gradCurrent)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Achievement Bar Chart ──
export function AchievementChart({
  data,
  onBarClick,
}: {
  data: { year: string;  tasks: number }[]
  onBarClick?: (month: string) => void
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        maxBarSize={26}
        barCategoryGap="20%"
        barGap={4}
        onClick={(e) => {
          if (e?.activeLabel && onBarClick) onBarClick(e.activeLabel)
        }}
      >
        <XAxis
          dataKey="year"
          orientation="bottom"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          tickFormatter={(val) => {
            if (/^\d{4}$/.test(val)) return val
            return val.slice(0, 3)
          }}
          padding={{ left: 10, right: 10 }}
        />
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
        />

        {/* Projects bar */}
        {/* <Bar
          dataKey="projects"
          name="Projects"
          fill="#6366f1"
          radius={[6, 6, 0, 0]}
          label={{
            position: "top",
            fontSize: 10,
            fill: "#6b7280",
            formatter: (val: number) => val > 0 ? val : "",
          }}
        /> */}

        {/*  Tasks bar */}
        <Bar
          dataKey="tasks"
          name="Tasks Done"
          fill="#10b981"
          radius={[6, 6, 0, 0]}
          label={{
            position: "top",
            fontSize: 10,
            fill: "#6b7280",
            formatter: (val: number) => val > 0 ? val : "",
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Efficiency Chart ──
export function EfficiencyChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => val.slice(0, 3)}
        />
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
          formatter={(value: number) => [`${value}%`, "Efficiency"]}
          labelFormatter={(label) => `📅 ${label}`}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#effGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}