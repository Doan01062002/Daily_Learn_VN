"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [deniedPermission, setDeniedPermission] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const role = user.role;
    if (role !== "ADMIN" && role !== "CTV" && role !== "OPERATOR") {
      router.push("/dashboard");
      return;
    }

    // Role-based permission mapping for admin sub-routes
    const routePermissions: Record<string, string> = {
      "/admin/lessons": "manage_lessons",
      "/admin/quizzes": "manage_quizzes",
      "/admin/users": "manage_users",
      "/admin/payments": "manage_payments",
      "/admin/notifications": "manage_notifications",
      "/admin/analytics": "view_analytics",
      "/admin/settings": "manage_settings",
      "/admin/logs": "manage_settings", // Audit logs are reserved for super admin (manage_settings permission)
      "/admin/coupons": "manage_coupons",
    };

    let isAuthorized = true;
    let requiredPermission = null;

    // Check if the current route has a permission requirement
    for (const route in routePermissions) {
      if (pathname.startsWith(route)) {
        requiredPermission = routePermissions[route];
        if (role !== "ADMIN") {
          const userPerms = user.permissions || [];
          if (!userPerms.includes(requiredPermission)) {
            isAuthorized = false;
          }
        }
        break;
      }
    }

    // Special check for grading route which accepts either manage_lessons or manage_quizzes
    if (isAuthorized && pathname.startsWith("/admin/grading") && role !== "ADMIN") {
      const userPerms = user.permissions || [];
      if (!userPerms.includes("manage_lessons") && !userPerms.includes("manage_quizzes")) {
        isAuthorized = false;
        requiredPermission = "manage_lessons";
      }
    }

    // Special check for main dashboard route `/admin` (disallow CTV)
    if (isAuthorized && (pathname === "/admin" || pathname === "/admin/") && role === "CTV") {
      isAuthorized = false;
      requiredPermission = "view_dashboard";
    }

    if (isAuthorized) {
      setAuthorized(true);
      setDeniedPermission(null);
    } else {
      setAuthorized(false);
      setDeniedPermission(requiredPermission);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-rose-800 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR")) {
    return null;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute -top-20 -left-20 h-40 w-40 bg-amber-500/5 rounded-full blur-2xl" />

          {/* Locked Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-600 animate-bounce">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800">Quyền truy cập bị từ chối</h1>
            <p className="text-xs text-slate-500 leading-relaxed px-4">
              Tài khoản của bạn ({user.email}) với vai trò <span className="font-bold text-rose-800">{user.role}</span> không được cấp quyền <span className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">{deniedPermission}</span> để xem trang này.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/admin"
              className="w-full py-2.5 px-4 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition duration-200 shadow-sm flex items-center justify-center gap-2"
            >
               Quay lại Trang Tổng quan
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-2"
            >
              Về Trang Học viên
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
