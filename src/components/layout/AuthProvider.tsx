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
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (credential: string, mockEmail?: string, mockName?: string) => Promise<boolean>;
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
      if (!user.isOnboarded) {
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

  const login = async (credential: string, mockEmail?: string, mockName?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, mockEmail, mockName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // Redirect based on onboarding status
        if (data.user.isOnboarded) {
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
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // For cookies based auth, we can clear it by calling an endpoint or mock clearing locally
    setUser(null);
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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
