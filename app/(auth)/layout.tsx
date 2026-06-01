// app/(auth)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthHookStore } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthHookStore(useAuthStore, (state) => state.isAuthenticated);

  // useEffect(() => {
  //   // Redirect authenticated users away from auth pages to dashboard
  //   const authPages = ['/login', '/signup'];
  //   if (isAuthenticated && authPages.some((path) => pathname.startsWith(path))) {
  //     router.push('/dashboard');
  //   }
  // }, [isAuthenticated, pathname, router]);

  return (
    <>
      {/* <Toaster position="top-right" richColors expand={true} /> */}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    </>
  );
}
