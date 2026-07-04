"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";

interface UserAdminItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "PREMIUM" | "ADMIN";
  avatarUrl: string | null;
  interestedTopics: string[];
  currentLevel: string | null;
  commitmentTime: number | null;
  createdAt: string;
  streak: number;
  maxStreak: number;
}

interface UserStats {
  totalCount: number;
  premiumCount: number;
  freeCount: number;
  adminCount: number;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async (query = "") => {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      } else {
        setErrorMsg("Không thể tải danh sách tài khoản học viên.");
      }
    } catch (error) {
      console.error("Failed to load admin users:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      const loadData = async () => {
        await fetchUsers(searchQuery);
      };
      loadData();
    }
  }, [user, searchQuery]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (actionLoading) return;
    const newRole = currentRole === "PREMIUM" ? "STUDENT" : "PREMIUM";

    setActionLoading(userId);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        await fetchUsers(searchQuery);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Không thể cập nhật quyền hội viên.");
      }
    } catch (error) {
      console.error("Role update failed:", error);
      setErrorMsg("Lỗi kết nối mạng.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (actionLoading) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của học viên '${userName}'? Hành động này sẽ xóa toàn bộ lịch sử học tập và streak.`)) {
      return;
    }

    setActionLoading(userId);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchUsers(searchQuery);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Không thể xóa tài khoản học viên.");
      }
    } catch (error) {
      console.error("Delete user failed:", error);
      setErrorMsg("Lỗi kết nối mạng.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-serif text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-[#4E4941] text-white text-xs font-semibold hover:bg-[#3E3A35] transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-800 to-rose-950 flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-base tracking-tight text-rose-950 leading-none">Quản trị</span>
            <span className="text-[9px] font-bold text-rose-800 tracking-widest uppercase mt-0.5">Học viên</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
          >
            Quản lý Bài viết
          </Link>
          <span className="h-4 w-px bg-[#D5CFC5]"></span>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
          >
            Trang Học viên
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* Banner Title */}
        <div className="flex justify-between items-end pb-2 border-b border-[#EBE6DD]">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">Thành viên & Thống kê</h2>
            <p className="text-xs text-[#8C8375] mt-1">Danh sách tài khoản học viên đăng ký trên hệ thống Daily Learn Việt Nam.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-xs text-[#D32F2F] border border-[#FBE3E1]">
            {errorMsg}
          </div>
        )}

        {/* Stats Grid Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#EBE6DD] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider block">Tổng số học viên</span>
              <span className="text-2xl font-extrabold block mt-1 text-[#3E3A35]">{stats.totalCount} tài khoản</span>
            </div>
            <div className="bg-white border border-[#EBE6DD] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Hội viên Premium</span>
              <span className="text-2xl font-extrabold block mt-1 text-amber-700">{stats.premiumCount} thành viên</span>
            </div>
            <div className="bg-white border border-[#EBE6DD] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider block">Thành viên miễn phí</span>
              <span className="text-2xl font-extrabold block mt-1 text-[#5C554B]">{stats.freeCount} tài khoản</span>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-[#EBE6DD] shadow-sm">
          <svg className="h-4 w-4 text-[#8C8375]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm học viên theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm placeholder-[#BFB8AC] focus:outline-none"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white border border-[#EBE6DD] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-sm text-[#8C8375] italic">
              Không tìm thấy học viên nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EBE6DD] text-[#8C8375] font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Tên học viên</th>
                    <th className="px-6 py-4">Vai trò / Cấp bậc</th>
                    <th className="px-6 py-4">Chuỗi Streak</th>
                    <th className="px-6 py-4">Chủ đề quan tâm</th>
                    <th className="px-6 py-4">Trình độ</th>
                    <th className="px-6 py-4">Ngày đăng ký</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4]">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/50 transition duration-150">
                      <td className="px-6 py-4 font-bold text-[#3E3A35]">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                            alt={item.name}
                            className="h-8 w-8 rounded-full border border-[#D5CFC5]"
                          />
                          <div>
                            <div className="font-bold text-sm">{item.name}</div>
                            <div className="text-[10px] font-normal text-[#8C8375] mt-0.5">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.role === "ADMIN" ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            🛡️ Admin
                          </span>
                        ) : item.role === "PREMIUM" ? (
                          <span className="bg-[#FAF2EB] text-[#BF753F] border border-[#F0DDC5] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            ★ Premium
                          </span>
                        ) : (
                          <span className="bg-[#FAF8F5] text-[#8C8375] border border-[#E5E0D8] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            Thường
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-[#D35400]">
                        🔥 {item.streak} ngày <span className="text-[10px] font-normal text-[#8C8375]">(Max: {item.maxStreak})</span>
                      </td>
                      <td className="px-6 py-4 text-[#8C8375]">
                        {item.interestedTopics && item.interestedTopics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.interestedTopics.map((topic) => (
                              <span key={topic} className="bg-[#FAF2EB] px-1.5 py-0.5 rounded text-[9px] font-semibold text-[#8C8375]">
                                #{topic}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-[10px]">Chưa onboarding</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.currentLevel ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                            {item.currentLevel}
                          </span>
                        ) : (
                          <span className="italic text-[10px] text-[#BFB8AC]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#8C8375]">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.id !== user.id && item.role !== "ADMIN" && (
                          <>
                            <button
                              onClick={() => handleToggleRole(item.id, item.role)}
                              disabled={actionLoading === item.id}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition duration-150 ${
                                item.role === "PREMIUM"
                                  ? "bg-[#FAF8F5] text-amber-700 border border-amber-200 hover:bg-amber-50/50"
                                  : "bg-amber-600 text-white hover:bg-amber-700"
                              }`}
                            >
                              {actionLoading === item.id ? "Đang lưu..." : item.role === "PREMIUM" ? "Hạ Premium" : "Nâng Premium"}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(item.id, item.name)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50/50 font-bold text-[10px] transition duration-150"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
