"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider,useTheme } from "next-themes";

function ThemeTimeSync() {
    const { theme, resolvedTheme } = useTheme();

    React.useEffect(() => {
        if (theme !== "system") return;

        const syncThemeWithTime = () => {
            const hour = new Date().getHours();
            const isNight = hour >= 18 || hour < 6; // Night time: 6 PM to 6 AM

            const root = window.document.documentElement;

            if (resolvedTheme === "dark" || resolvedTheme === "dark-contrast" || isNight) {
                root.classList.remove("light", "light-contrast", "brand");
                root.classList.add("dark");
            } else {
                root.classList.remove("dark", "dark-contrast");
                root.classList.add("light");
            }
        };

        syncThemeWithTime();

        // Re-check every 5 minutes
        const timer = setInterval(syncThemeWithTime, 5 * 60 * 1000);
        return () => clearInterval(timer);
    }, [theme, resolvedTheme]);

    return null;
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    // return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
     return (
        <NextThemesProvider {...props}>
            <ThemeTimeSync />
            {children}
        </NextThemesProvider>
    );
}
