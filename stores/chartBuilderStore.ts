import { create } from "zustand";
import { reportAPI } from "@/lib/api/reports-api";
import {
  ChartType,
  AxisField,
  GetAxesResponse,
  ChartTypeDefinition,
} from "@/types/reports.types";

interface DisplayOptions {
  showLegend: boolean;
  showLabels: boolean;
  asPercentage: boolean;
  donut: boolean;
}

interface ReportConfig {
  projectId: string;
  title: string;
  xAxis: string;
  yAxis: string;
  category: string;
  value: string;
  aggregation: string;
  groupBy: string;
}

interface ChartBuilderStore {
  axes: GetAxesResponse | null;
  chartTypes: ChartTypeDefinition[];

  selectedChartType: ChartType | null;

  reportConfig: ReportConfig;
  setReportConfig: (config: Partial<ReportConfig>) => void;

  displayOptions: DisplayOptions;

  loading: boolean;
  error: string | null;

  // actions
  fetchConfig: () => Promise<void>;
  getAxesByProjectId: (projectId: string) => Promise<any>;
  setSelectedChartType: (type: ChartType) => void;

  setShowLegend: (value: boolean) => void;
  setShowLabels: (value: boolean) => void;
  setAsPercentage: (value: boolean) => void;

  // computed
  getValidXAxis: () => AxisField[];
  getValidYAxis: () => AxisField[];
  getValidCategory: () => AxisField[];
  getValidValue: () => AxisField[];

  resetDisplayOptions: () => void;
}

export const useChartBuilderStore = create<ChartBuilderStore>(
  (set, get) => ({
    axes: null,
    chartTypes: [],
    selectedChartType: null,
    displayOptions: {
      showLegend: false,
      showLabels: false,
      asPercentage: false,
      donut: false,
    },
    reportConfig: {
      projectId: "",
      title: "",
      xAxis: "",
      yAxis: "count",
      category: "",
      value: "",
      aggregation: "count",
      groupBy: "none",
    },
    loading: false,
    error: null,

    // 🔥 Fetch both APIs together
    fetchConfig: async () => {
      try {
        set({ loading: true });

        const chartTypesRes = await reportAPI.getChartTypes();

        set({
          chartTypes: chartTypesRes.chartTypes,
          loading: false,
        });
      } catch (err: any) {
        set({
          loading: false,
          error: err?.message || "Failed to load chart config",
        });
      }
    },

    getAxesByProjectId: async (projectId: string) => {
      try {
        set({ loading: true, error: null });

        const res = await reportAPI.getAxesByProjectId(projectId);

        set({
          axes: res,
          loading: false,
        });

        return res;
      } catch (err: any) {
        set({
          loading: false,
          error: err?.message || "Failed to fetch axes",
        });
        throw err;
      }
    },

    setSelectedChartType: (type: ChartType) =>
      set({ selectedChartType: type }),

    setReportConfig: (config) =>
      set((state) => ({
        reportConfig: {
          ...state.reportConfig,
          ...config,
        },
      })),

    setShowLegend: (value) =>
      set((state) => ({
        displayOptions: { ...state.displayOptions, showLegend: value },
      })),

    setShowLabels: (value) =>
      set((state) => ({
        displayOptions: { ...state.displayOptions, showLabels: value },
      })),

    setAsPercentage: (value) =>
      set((state) => ({
        displayOptions: { ...state.displayOptions, asPercentage: value },
      })),

    // 🔥 Helper to get selected chart definition
    getChartDefinition: () => {
      const { chartTypes, selectedChartType } = get();
      return chartTypes.find((c) => c.type === selectedChartType);
    },

    // ✅ CARTESIAN
    getValidXAxis: () => {
      const { axes, selectedChartType } = get();
      if (!axes || !selectedChartType) return [];

      const chartDef = get().chartTypes.find(
        (c) => c.type === selectedChartType
      );

      if (!chartDef?.requires.xAxis) return [];

      return axes.xAxis.filter((field) =>
        field.chartTypes?.includes(selectedChartType)
      );
    },

    getValidYAxis: () => {
      const { axes, selectedChartType } = get();
      if (!axes || !selectedChartType) return [];

      const chartDef = get().chartTypes.find(
        (c) => c.type === selectedChartType
      );

      if (!chartDef?.requires.yAxis) return [];

      return axes.yAxis.filter((field) =>
        field.chartTypes?.includes(selectedChartType)
      );
    },

    // ✅ CIRCULAR / RADAR
    getValidCategory: () => {
      const { axes, selectedChartType } = get();
      if (!axes || !selectedChartType) return [];

      const chartDef = get().chartTypes.find(
        (c) => c.type === selectedChartType
      );

      if (!chartDef?.requires.category) return [];

      return axes.xAxis.filter((field: AxisField) =>
        field.chartTypes.includes(selectedChartType)
      );
    },

    getValidValue: () => {
      const { axes, selectedChartType } = get();
      if (!axes || !selectedChartType) return [];

      const chartDef = get().chartTypes.find(
        (c) => c.type === selectedChartType
      );

      if (!chartDef?.requires.value) return [];

      return axes.yAxis.filter((field: AxisField) =>
        field.chartTypes.includes(selectedChartType)
      );
    },

    resetDisplayOptions: () =>
      set({
        displayOptions: {
          showLegend: false,
          showLabels: false,
          asPercentage: false,
          donut: false,
        },
        reportConfig: {
          projectId: "",
          title: "",
          xAxis: "",
          yAxis: "count",
          category: "",
          value: "",
          aggregation: "count",
          groupBy: "none",
        },
      }),
  })
);