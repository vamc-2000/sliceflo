export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "area"
  | "radar"
  | "doughnut";

export interface ChartPosition {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

// 1. Define the display options interface 
export interface ChartDisplayOptions {
  showLegend: boolean;
  showLabels: boolean;
  asPercentage: boolean;
  donut: boolean;
}

export interface ReportChart {
  id: string;
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  aggregation: string;
  groupBy?: string;
  displayOptions?: ChartDisplayOptions;
  position: ChartPosition;
  colors?: string[];
  data?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
    }[];
  };
}

export interface Report {
  id: string;
  name: string;
  description: string;
  projectId: string;
  charts: ReportChart[];
  isFavorite: boolean;

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PaginationMeta {
  totalReports: number;
  currentPage: number;
  perPage: number;
  pageCount?: number;
}

export interface CreateReportPayload {
  name: string;
  description: string;
  projectId?: string;
  //   charts: ReportChart[];
}

export type UpdateReportPayload = {
  name?: string;
  description?: string;
  charts?: ReportChart[];
  // only fields that can be updated
};

export type CreateReportResponse = Partial<Report>;

// Axis Field Definition
export type AxisFieldType = "string" | "number" | "date";

export type AggregationType =
  | "sum"
  | "average"
  | "count";

export interface AxisField {
  field: string;
  type: AxisFieldType;
  label: string;
  description?: string;
  chartTypes: ChartType[];
  aggregations?: AggregationType[];
  isCustom?: boolean;
}

// Cartesian Axes
export interface CartesianAxes {
  xAxis: AxisField[];
  yAxis: AxisField[];
}

// Circular Axes (Pie / Doughnut)
export interface CircularAxes {
  category: AxisField[];
  value: AxisField[];
}

// Radar Axes
export interface RadarAxes {
  category: AxisField[];
  value: AxisField[];
}

// Full GetAxes Response
export interface GetAxesResponse {
  xAxis: AxisField[];
  yAxis: AxisField[];
}

export interface ChartTypeRequirements {
  xAxis?: AxisFieldType[];
  yAxis?: AxisFieldType[];
  category?: AxisFieldType[];
  value?: AxisFieldType[];
}

export interface ChartTypeDefinition {
  type: ChartType;
  label: string;
  description: string;
  requires: ChartTypeRequirements;
}

export interface GetChartTypesResponse {
  chartTypes: ChartTypeDefinition[];
}