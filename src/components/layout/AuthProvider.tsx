"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isOnboarded: boolean;
  interestedTopics: string[];
  currentLevel: string | null;
  commitmentTime: number | null;
  streak: {
    currentStreak: number;
    maxStreak: number;
  } | null;
  permissions?: string[];
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (params: { credential?: string; email?: string; name?: string; password?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Route protection logic
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login"];
    
    if (!user) {
      // User is not logged in - redirect to login unless already there
      if (!publicRoutes.includes(pathname)) {
        router.push("/login");
      }
    } else {
      // User is logged in
      if (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR") {
        if (pathname === "/login" || pathname === "/onboarding" || pathname === "/") {
          if (user.role === "CTV") {
            router.push("/admin/lessons");
          } else {
            router.push("/admin");
          }
        }
      } else if (!user.isOnboarded) {
        // Not onboarded yet - force onboarding
        if (pathname !== "/onboarding") {
          router.push("/onboarding");
        }
      } else {
        // Fully onboarded - prevent going to login or onboarding
        if (pathname === "/login" || pathname === "/onboarding" || pathname === "/") {
          router.push("/dashboard");
        }
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (params: { credential?: string; email?: string; name?: string; password?: string }) => {
    const { credential = "", email, name = "", password } = params;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          credential, 
          mockEmail: !password ? email : undefined, 
          mockName: name,
          email: password ? email : undefined,
          password
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // Redirect based on onboarding status and role
        if (data.user.role === "ADMIN" || data.user.role === "CTV" || data.user.role === "OPERATOR") {
          if (data.user.role === "CTV") {
            router.push("/admin/lessons");
          } else {
            router.push("/admin");
          }
        } else if (data.user.isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login request failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // 1. Call server logout endpoint to clear HttpOnly cookie
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Failed to clear cookie via API:", err);
    }

    try {
      // 2. Sign out of Firebase if initialized
      const { auth } = await import("@/lib/firebase");
      if (auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.error("Failed to sign out of Firebase:", err);
    }

    // 3. Clear local state and redirect
    setUser(null);
    router.push("/login");
  };

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-[#3E3A35]">
        <div className="flex flex-col items-center gap-4">
          {/* Elegant minimalist loader */}
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
          <p className="font-serif italic text-sm tracking-wide text-[#8C8375]">Daily Learn VN...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
