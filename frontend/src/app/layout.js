// src/app/layout.js
'use client';
/**
 * Root layout component for the Next.js application.
 * Manages authentication checks and renders the main layout structure.
 */

import './globals.css';
import { useEffect, Suspense } from 'react';
import useAuthStore from '@/stores/authStore'; // Adjusted import
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { Loading } from '@/components/common/Loading';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Footer from '@/components/common/Footer';
import NavBar from '@/components/common/NavBar';
import Sidebar from '@/components/common/Sidebar';

export default function RootLayout({ children }) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore(); // Direct destructuring
  const pathname = usePathname();

  const publicPaths = ['/login', '/register', '/', '/logout'];

  useEffect(() => {
    const verifyAuth = async () => {
      if (!publicPaths.includes(pathname)) {
        try {
          const isValid = await checkAuth();
          if (!isValid && typeof window !== 'undefined') {
            console.debug(`[Layout] Redirecting to /login from ${pathname}`);
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('[Layout] Auth check error:', error.message);
          window.location.href = '/login';
        }
      }
    };

    verifyAuth();
  }, [checkAuth, pathname]);

  if (isLoading && !publicPaths.includes(pathname)) {
    return (
      <html lang="en">
        <body className="flex flex-col min-h-screen bg-gray-100">
          <Loading />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-100">
        <ErrorBoundary>
          <NavBar />
          <div className="flex flex-1">
            <Sidebar />
            <Suspense fallback={<Loading />}>
              <main className="flex-1 p-4">{children}</main>
            </Suspense>
            <Toaster position="top-right" />
          </div>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}