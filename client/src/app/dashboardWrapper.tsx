"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "./(components)/Sidebar";
import { useAppSelector } from "./redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/unauthorized'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isPublicRoute, router]);

  // Show loading spinner for protected routes when not authenticated
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // For public routes, don't show sidebar and navbar
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 w-full min-h-screen font-tajawal`}
    >
      <Sidebar />
      <div
        className={`transition-all duration-300 ease-in-out min-h-screen ${
          isSidebarCollapsed ? "mr-0 md:mr-16" : "mr-0 md:mr-64"
        }`}
      >
        <main className="flex flex-col py-6 px-6 bg-transparent">
          <Navbar />
          <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default DashboardWrapper;
