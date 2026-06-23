import { useProfileStore } from '@/stores/profile-store';

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface UserPreferences {
  timeZone?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekendDays?: string[];
}

/**
 * Parses a date and returns its components adjusted to the target timezone's offset.
 */
export function getLocalDateParts(
  dateInput: Date | string | number | null | undefined
) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return null;
  }

  // Gracefully fallback to UTC if store or preferences are unavailable
  const tz = useProfileStore?.getState?.()?.user?.preferences?.timeZone || "(UTC+00:00)";

  let offsetMs = 0;
  if (tz) {
    const match = tz.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3], 10);
      offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
    }
  }

  // Shift by timezone offset to align UTC methods with target timezone
  const localDate = new Date(date.getTime() + offsetMs);
  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth(), // 0-11
    day: localDate.getUTCDate(), // 1-31
    hours: localDate.getUTCHours(), // 0-23
    minutes: localDate.getUTCMinutes(), // 0-59
    seconds: localDate.getUTCSeconds(),
  };
}

/**
 * Formats a date according to profile preferences.
 */
export function formatLocalDate(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) return "—";
  const prefs = useProfileStore?.getState?.()?.user?.preferences;
  const parts = getLocalDateParts(dateInput);
  if (!parts) return "—";

  const { year, month, day } = parts;

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const yyyy = String(year);

  const formatStr = prefs?.dateFormat || "YYYY-MM-DD";

  // Formatting logic
  if (formatStr === "MM-DD-YYYY") {
    return `${mm}-${dd}-${yyyy}`;
  } else if (formatStr === "DD-MM-YYYY") {
    return `${dd}-${mm}-${yyyy}`;
  } else if (formatStr === "DD MMM YYYY") {
    return `${dd} ${MONTH_NAMES_SHORT[month]} ${yyyy}`;
  } else if (formatStr === "MMM DD, YYYY") {
    return `${MONTH_NAMES_SHORT[month]} ${dd}, ${yyyy}`;
  } else {
    // Default YYYY-MM-DD
    return `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Formats the time portion of a date according to 12h/24h settings.
 */
export function formatLocalTime(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) return "—";
  const prefs = useProfileStore?.getState?.()?.user?.preferences;
  const parts = getLocalDateParts(dateInput);
  if (!parts) return "—";

  const { hours, minutes } = parts;
  const is12h = prefs?.timeFormat === "12h";
  let displayHours = hours;
  let ampm = "";
  if (is12h) {
    ampm = hours >= 12 ? " PM" : " AM";
    displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
  }
  const hh = String(displayHours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  return `${hh}:${min}${ampm}`;
}

/**
 * Formats both date and time according to preferences.
 */
export function formatLocalDateTime(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) return "—";
  const dateStr = formatLocalDate(dateInput);
  const timeStr = formatLocalTime(dateInput);
  return `${dateStr} ${timeStr}`;
}

/**
 * Converts a Date object returned by the browser date picker (representing local midnight)
 * into a UTC date string that matches midnight in the user's preferred timezone.
 */
export function convertSelectedDateToUTC(
  date: Date | null | undefined
): string {
  if (!date || isNaN(date.getTime())) return "";

  // Get the selected date/time parts in local browser time
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

  // Construct a date object representing the selected date/time in UTC
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms));

  const tz = useProfileStore?.getState?.()?.user?.preferences?.timeZone || "(UTC+00:00)";

  let offsetMs = 0;
  if (tz) {
    const match = tz.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hoursOffset = parseInt(match[2], 10);
      const minutesOffset = parseInt(match[3], 10);
      offsetMs = sign * (hoursOffset * 60 + minutesOffset) * 60 * 1000;
    }
  }

  // Adjust the UTC date/time by subtracting the timezone offset
  const utcTimeMs = utcDate.getTime() - offsetMs;
  return new Date(utcTimeMs).toISOString();
}

/**
 * Converts stored UTC date string to a local Date object representing the correct day in the local browser's time.
 */
export function convertUTCToCalendarDate(
  utcDateStr: string | null | undefined
): Date | undefined {
  if (!utcDateStr) return undefined;
  const parts = getLocalDateParts(utcDateStr);
  if (!parts) return undefined;

  const { year, month, day } = parts;
  // Create local Date object representing midnight on the target date in local browser time
  return new Date(year, month, day);
}

/**
 * Maps weekend day names (e.g. "Saturday", "Sunday") to day indices (0-6).
 */
export function getWeekendDaysIndices(): number[] {
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  const days = useProfileStore?.getState?.()?.user?.preferences?.weekendDays || ["Saturday", "Sunday"];
  return days.map(day => dayMap[day] ?? 0);
}

/**
 * Determines if a given date falls on a weekend day based on preferences.
 */
export function isWeekend(date: Date): boolean {
  const indices = getWeekendDaysIndices();
  return indices.includes(date.getDay());
}


export function formatMailboxDate(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) return "—";

  const parts = getLocalDateParts(dateInput);
  if (!parts) return "—";

  const { day, month, hours, minutes } = parts;

  const hh = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  return `${day} ${MONTH_NAMES_SHORT[month]} ${String(hh).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(2, "0")} ${ampm}`;
}
