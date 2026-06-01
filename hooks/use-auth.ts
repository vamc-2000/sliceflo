import { useEffect, useState } from "react";

/**
 * Custom hook to safely access persistent Zustand stores in Next.js.
 * It prevents hydration mismatches by ensuring client-only data is only
 * returned after the component has mounted.
 */
export const useAuthHookStore = <T, F>(
    store: (callback: (state: T) => unknown) => unknown,
    callback: (state: T) => F
) => {
    const result = store(callback) as F;
    const [data, setData] = useState<F>();

    useEffect(() => {
        setData(result);
    }, [result]);

    return data;
};

/**
 * Simple hook to detect if the component has successfully hydrated on the client.
 */
export function useHasHydrated() {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        setHydrated(true);
    }, []);
    return hydrated;
}