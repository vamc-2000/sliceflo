import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isExistingUser(data: any): boolean {
    // TODO: Need to check for specific properties that indicate an existing user
    if (!data || typeof data !== "object") {
        return false;
    }
    return data?.isExistingUser || false;
}

