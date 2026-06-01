import { create } from "zustand";
import { persist } from "zustand/middleware";

type CapacityType = "daily" | "weekly";

interface TimesheetSettingsState {
  capacityType: CapacityType;
  hours: string;
  notifyBefore: "1hr" | "1day" | "1week";

  setCapacityType: (type: CapacityType) => void;
  setHours: (hours: string) => void;
  setNotifyBefore: (value: "1hr" | "1day" | "1week") => void;

  reset: () => void;
}

export const useTimesheetSettingsStore =
  create<TimesheetSettingsState>()(
    persist(
      (set) => ({
        capacityType: "daily",
        hours: "8",
        notifyBefore: "1hr",

        setCapacityType: (type) =>
          set({
            capacityType: type,
            hours: type === "daily" ? "8" : "40",
          }),

        setHours: (hours) => set({ hours }),

        setNotifyBefore: (value) => set({ notifyBefore: value }),

        reset: () =>
          set({
            capacityType: "daily",
            hours: "8",
            notifyBefore: "1hr",
          }),
      }),
      {
        name: "timesheet-settings", 
      }
    )
  );
