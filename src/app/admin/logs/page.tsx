"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AuditLogItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  target: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 15;

  const fetchLogs = async (page = 1, query = "") => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        q: query,
      });

      const res = await fetch(`/api/admin/logs?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setErrorMsg(null);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Không thể tải nhật ký hoạt động.");
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchLogs(currentPage, searchQuery);
    }
  }, [user, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs(1, searchQuery);
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.startsWith("CREATE")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (action.startsWith("UPDATE") || action === "PROCESS_PAYMENT") {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (action.startsWith("DELETE")) {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      CREATE_LESSON: "Tạo bài học",
      UPDATE_LESSON: "Sửa bài học",
      DELETE_LESSON: "Xóa bài học",
      CREATE_QUIZ: "Tạo câu hỏi",
      UPDATE_QUIZ: "Sửa câu hỏi",
      DELETE_QUIZ: "Xóa câu hỏi",
      UPDATE_USER_ROLE: "Thay đổi vai trò",
      DELETE_USER: "Xóa tài khoản",
      PROCESS_PAYMENT: "Duyệt thanh toán",
      UPDATE_SETTINGS: "Cập nhật cài đặt",
    };
    return map[action] || action;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin/logs" />

      {/* Main Viewport Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Nhật ký Hoạt động</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">SUPER ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full border border-rose-800"
              />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-20">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header intro & Search filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div>
              <h1 className="font-sans font-black text-sm text-slate-800">Tra cứu vết hoạt động</h1>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Toàn bộ thao tác nghiệp vụ được thực hiện bởi CTV, Operator và Admin được lưu trữ tự động tại đây để giám sát hệ thống.
              </p>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm email, hành động, target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-800 w-60 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Lọc nhật ký
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Logs Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4 font-extrabold">Thời gian</th>
                    <th className="py-3 px-4 font-extrabold">Nhân sự</th>
                    <th className="py-3 px-4 font-extrabold">Hành động</th>
                    <th className="py-3 px-4 font-extrabold">Mục tiêu (Target)</th>
                    <th className="py-3 px-4 font-extrabold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-800 border-t-transparent"></div>
                          <span className="text-slate-400 font-bold text-[11px]">Đang tải dữ liệu nhật ký...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 italic">
                        Không tìm thấy bản ghi nhật ký hoạt động nào.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{log.userName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getActionBadgeStyle(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600 font-bold break-all max-w-sm">
                          {log.target}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} trong tổng số {totalCount} nhật ký
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold cursor-pointer"
                  >
                    ◀
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition duration-150 cursor-pointer ${
                        currentPage === i + 1
                          ? "bg-rose-800 border-rose-800 text-white shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
