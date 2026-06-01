"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { resetAllStores } from "@/stores/reset-stores";
import { AppSkeleton } from "@/components/layout/AppSkeleton";
import { Loader } from "./Loader";

const publicRoutes = ["/login", "/register", "/logout", "/signup"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, isHydrated, user, token, checkUserAuth } = useAuthStore();
  const [lastVerifiedToken, setLastVerifiedToken] = useState<string | null>(null);

  const hasVerified = lastVerifiedToken === token;

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token || hasVerified) return;

    // Verify current status with server on mount/hydration
    // to prevent stale localStorage data from causing wrong redirects
    const verifyStatus = async () => {
      try {
        await checkUserAuth(token);
        setLastVerifiedToken(token);
      } catch (error) {
        console.error("Auth status verification failed:", error);
        // If verification fails, we still mark it as verified for this token 
        // to avoid infinite retry loops, but the 401 interceptor 
        // will have cleared credentials if the token was truly invalid.
        setLastVerifiedToken(token);
      }
    };

    verifyStatus();
  }, [isHydrated, isAuthenticated, token, checkUserAuth, hasVerified]);

  useEffect(() => {
    if (!isHydrated) return;

    // If we have a token and are authenticated, but haven't verified with the server yet,
    // we wait for the verification to complete before making any redirection decisions.
    if (isAuthenticated && token && !hasVerified) return;

    const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

    // Redirect unauthenticated users away from protected routes
    if (!isAuthenticated && !isPublic) {
      resetAllStores();
      router.replace("/login");
      return;
    }

    // Redirect authenticated users away from login/register
    if (isAuthenticated && isPublic && !pathname.startsWith('/logout')) {
      if (user?.isQuestionnaireCompleted) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, isHydrated, pathname, router, user, token, hasVerified]);

  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r)) || pathname === "/signup";

  if (!isHydrated) {
    if (isPublicRoute) {
      return (
        <div
          className="flex items-center justify-center min-h-screen w-full"
          style={{
            backgroundImage: "url('/images/loginbackground.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Loader
            message="Loading..."
            size="lg"
          />
        </div>
      );
    }
    return <AppSkeleton />;
  }

  return <>{children}</>;

}
