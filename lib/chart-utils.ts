// lib/chart-utils.ts
export function computeChartData({
  tasks,
  project,
  xAxis,
  yAxis,
  aggregation,
  groupBy,
  showFilter = "all",
}: {
  tasks: any[];
  project: any;
  xAxis: string;
  yAxis: string;
  aggregation: string;
  groupBy: string;
  showFilter?: string;
}) {
  if (!tasks || !project || !xAxis) return [];

  // Helper to get formatted value for a field (xAxis or groupBy)
  const getFieldLabel = (task: any, field: string): { label: string; color: string } => {
    if (["status", "priority", "taskType"].includes(field)) {
      let config: any[] = [];
      if (field === "status") config = project.taskStatusConfig || [];
      else if (field === "priority") config = project.taskPriorityConfig || [];
      else if (field === "taskType") config = project.taskTypeConfig || [];

      const val = task[field];
      const matched = config.find(
        (c: any) => c.value === val || c._id === val || c.label === val
      );
      if (matched) return { label: matched.label, color: matched.color || "var(--chart-1)" };
      return { label: val || "Unknown", color: "var(--chart-1)" };
    }

    if (field === "assigneeId") {
      return { label: task.assignee || "Unassigned", color: "var(--chart-1)" };
    }

    if (["createdAt", "dueDate"].includes(field)) {
      const dbKey = field === "dueDate" ? "endDate" : "createdAt";
      const dateVal = task[dbKey];
      if (!dateVal) return { label: "No Date", color: "var(--chart-1)" };
      const month = new Date(dateVal).toLocaleDateString("en-US", { year: "numeric", month: "short" });
      return { label: month, color: "var(--chart-1)" };
    }

    // fallback to custom field assuming it's a string
    const cfValue = task.customFieldValues?.[field];
    return { label: cfValue ? String(cfValue) : "Uncategorized", color: "var(--chart-1)" };
  };

  // Helper to get all possible configuration labels for a field to assure `Object.keys(data[0])` discovers all dataset keys
  const getFieldAllLabels = (field: string): string[] => {
    if (field === "status") return (project.taskStatusConfig || []).map((c: any) => c.label);
    if (field === "priority") return (project.taskPriorityConfig || []).map((c: any) => c.label);
    if (field === "taskType") return (project.taskTypeConfig || []).map((c: any) => c.label);
    return [];
  };

  const xLabels = getFieldAllLabels(xAxis);
  const groupLabels = groupBy !== "none" ? getFieldAllLabels(groupBy) : ["count"]; // default to "count" when no group By

  // Use a map: xLabel -> { groupByLabel -> value, fill }
  // Structure: Record<string, Record<string, { value: number, count: number, fill: string }>>
  const rawData: Record<string, Record<string, { sum: number; count: number; fill: string }>> = {};

  const validXLabels = xLabels.length > 0 ? xLabels : [];

  // Initialize with known xLabels to keep sorting
  validXLabels.forEach(xl => {
    rawData[xl] = {};
  });

  tasks.forEach((task) => {
    const { label: xLabel, color: xColor } = getFieldLabel(task, xAxis);

    // Check show filter
    if (showFilter !== "all" && xLabel !== showFilter) return;

    if (!rawData[xLabel]) {
      rawData[xLabel] = {};
    }

    let gLabel = aggregation || "count";
    let gColor = xColor;

    if (groupBy && groupBy !== "none") {
      const { label, color } = getFieldLabel(task, groupBy);
      gLabel = label;
      gColor = color;
      // when grouped, the dataset label is the group name, and color is the group color
      // but wait, `chart-bar-multiple.tsx` uses `chartConfig[key]?.color` or `entry.fill`.
      // `entry.fill` works for single dataset. For multiple datasets, it ignores `entry.fill` per Bar usually, unless recharts maps it.
      // Recharts Bar uses `dataKey` for value.
    }

    if (!rawData[xLabel][gLabel]) {
      rawData[xLabel][gLabel] = { sum: 0, count: 0, fill: xColor };
    }

    // Determine value to add
    let valToAdd = 1;
    if (yAxis && yAxis !== "count" && aggregation !== "count") {
      // Find value in task
      let rawVal = 0;
      if (task.customFieldValues && task.customFieldValues[yAxis] !== undefined) {
        rawVal = Number(task.customFieldValues[yAxis]);
      } else if (task[yAxis] !== undefined) {
        rawVal = Number(task[yAxis]);
      }
      if (!isNaN(rawVal)) {
        valToAdd = rawVal;
      } else {
        valToAdd = 0;
      }
    }

    rawData[xLabel][gLabel].sum += valToAdd;
    rawData[xLabel][gLabel].count += 1;
  });

  // Now format for Recharts
  // Ensure array has consistent keys, especially index 0
  const allGroupsEncountered = new Set<string>();
  if (groupBy !== "none") {
    groupLabels.forEach(g => allGroupsEncountered.add(g));
  }
  Object.values(rawData).forEach(groupMap => {
    Object.keys(groupMap).forEach(g => allGroupsEncountered.add(g));
  });

  // Sort x labels logically (createdAt / dueDate special case done in format)
  let entries = Object.entries(rawData);
  if (["createdAt", "dueDate"].includes(xAxis)) {
    entries.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }

  const chartData = entries.map(([xLabel, groupMap]) => {
    const dataObj: any = { [xAxis]: xLabel };

    // Fill all possible groups with 0 so recharts bars render perfectly
    allGroupsEncountered.forEach(gLabel => {
      if (groupMap[gLabel]) {
        const { sum, count } = groupMap[gLabel];
        if (aggregation === "average") {
          dataObj[gLabel] = count > 0 ? Number((sum / count).toFixed(2)) : 0;
        } else {
          // Both sum and count use "sum" variable since valToAdd is 1 for count
          dataObj[gLabel] = Number(sum.toFixed(2));
        }
      } else {
        dataObj[gLabel] = 0;
      }
    });

    // Determine `fill` for single series, or use default
    if (groupBy === "none" || !groupBy) {
      const { color } = getFieldLabel({ [xAxis]: xLabel }, xAxis);
      dataObj.fill = color;
    }

    return dataObj;
  });

  return chartData;
}
