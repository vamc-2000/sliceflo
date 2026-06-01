// store/reportStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Report, PaginationMeta, CreateReportPayload, UpdateReportPayload } from "@/types/reports.types";
import { reportAPI } from "@/lib/api/reports-api";

interface ReportStore {
  reports: Report[];
  favorites: Report[];
  recent: Report[];

  reportsMeta: PaginationMeta | null;
  activeReport: Report | null;
  selectedTab: string;
  favoriteLoadingIds: string[];

  loading: boolean;
  error: string | null;

  createReport: (payload: CreateReportPayload) => Promise<Report>;
  duplicateReport: (report: Report) => Promise<Report>;
  getReports: (params?: any) => Promise<void>;
  getReportById: (id: string) => Promise<Report>;
  updateReport: (id: string, data: UpdateReportPayload) => Promise<void>;
  toggleFavorite: (report: Report) => Promise<void>;

  setSelectedTab: (tab: string) => void;
  deleteReport: (id: string) => Promise<void>;

  setActiveReport: (report: Report | null) => void;

  updateChartConfig: (reportId: string, chartId: string, config: {
    groupBy?: string;
    displayOptions?: {
      showLegend: boolean;
      showLabels: boolean;
      asPercentage: boolean;
      donut: boolean;
    };
  }) => void;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: [],
      favorites: [],
      recent: [],
      reportsMeta: null,
      activeReport: null,
      selectedTab: "all",
      favoriteLoadingIds: [],
      loading: false,
      error: null,

      // ✅ Create Report
      createReport: async (payload) => {
        try {
          set({ error: null });

          const res = await reportAPI.createReport(payload);

          set((state) => ({
            reports: [...state.reports, res],
            activeReport: res, // 🔥 instantly available after create
          }));

          return res;
        } catch (err: any) {
          set({
            error: err?.message || "Failed to create report",
          });
          throw err;
        }
      },

      // ✅ Duplicate Report
      duplicateReport: async (report) => {
        try {
          set({ error: null });

          const payload: CreateReportPayload = {
            name: `${report.name} (Copy)`,
            description: report.description || "",
          };

          const res = await reportAPI.createReport(payload);

          set((state) => ({
            reports: [...state.reports, res],
            activeReport: res,
          }));

          return res;
        } catch (err: any) {
          set({
            error: err?.message || "Failed to duplicate report",
          });
          throw err;
        }
      },

      getReports: async () => {
        try {
          set({ loading: true, error: null });

          const res = await reportAPI.getReports();

          set({
            // reports: res,
            reports: res.reports,
            reportsMeta: {
              totalReports: res.totalReports,
              currentPage: res.currentPage,
              perPage: res.perPage,
              pageCount: res.pageCount,
            },
            loading: false,
          });
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message || "Failed to fetch reports",
          });
        }
      },

      getReportById: async (id: string) => {
        try {
          const existing = get().reports.find((r) => r.id === id);
          if (existing) {
            set({ activeReport: existing });
            return existing;
          }

          set({ loading: true, error: null });

          const res = await reportAPI.getReportById(id);

          const seen = new Set<string>();
          const dedupedCharts = [...(res.charts || [])].reverse().filter(chart => {
            if (seen.has(chart.id)) return false;
            seen.add(chart.id);
            return true;
          }).reverse();

          set({
            activeReport: { ...res, charts: dedupedCharts },
            loading: false,
          });

          return res;
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message || "Failed to fetch report",
          });
          throw err;
        }
      },

      updateReport: async (id, data) => {
        const res = await reportAPI.updateReport(id, data);

        set((state) => {
          // ✅ Deduplicate charts by id — keep last occurrence
          const seen = new Set<string>();
          const dedupedCharts = [...(res.charts || [])].reverse().filter(chart => {
            if (seen.has(chart.id)) return false;
            seen.add(chart.id);
            return true;
          }).reverse();

          const updatedReport = { ...res, charts: dedupedCharts };

          return {
            reports: state.reports.map((r) =>
              r.id === id ? updatedReport : r
            ),
            activeReport:
              state.activeReport?.id === id
                ? updatedReport
                : state.activeReport,
          };
        });
      },

      toggleFavorite: async (report) => {
        const { favoriteLoadingIds } = get();

        if (favoriteLoadingIds.includes(report.id)) return;

        const previousReports = get().reports;
        const previousActive = get().activeReport;
        const updatedFavoriteState = !report.isFavorite;

        set((state) => ({
          favoriteLoadingIds: [...state.favoriteLoadingIds, report.id],

          reports: state.reports.map((r) =>
            r.id === report.id
              ? { ...r, isFavorite: updatedFavoriteState }
              : r
          ),

          activeReport:
            state.activeReport?.id === report.id
              ? { ...state.activeReport, isFavorite: updatedFavoriteState }
              : state.activeReport,
        }));

        try {
          if (report.isFavorite) {
            await reportAPI.removeFavorite(report.id);
          } else {
            await reportAPI.addFavorite(report.id);
          }
        } catch (err) {
          // Revert if API fails
          set({
            reports: previousReports,
            activeReport: previousActive,
          });
        } finally {
          // 2️⃣ Remove loading state
          set((state) => ({
            favoriteLoadingIds: state.favoriteLoadingIds.filter(
              (id) => id !== report.id
            ),
          }));
        }
      },

      setSelectedTab: (tab) => set({ selectedTab: tab }),

      deleteReport: async (id) => {
        await reportAPI.deleteReport(id);

        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
          activeReport:
            state.activeReport?.id === id ? null : state.activeReport,
        }));
      },

      setActiveReport: (report) => set({ activeReport: report }),

      updateChartConfig: (reportId, chartId, config) =>
        set((state) => {
          if (!state.activeReport || state.activeReport.id !== reportId) return state;

          const updatedCharts = state.activeReport.charts.map((chart) =>
            chart.id === chartId ? { ...chart, ...config } : chart
          );

          const updatedReport = { ...state.activeReport, charts: updatedCharts };

          return {
            reports: state.reports.map(r =>
              r.id === reportId ? updatedReport : r
            ),
            activeReport: updatedReport,
          };
        }),
    }),
    {
      name: "reports-storage", // localStorage key
      partialize: (state) => ({
        reports: state.reports,
        activeReport: state.activeReport,
      }), //  only persist necessary data
    }
  )
);
