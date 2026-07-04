"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import AdminSidebar from "@/components/layout/AdminSidebar";
import CustomSelect from "@/components/CustomSelect";

interface UserAdminItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "PREMIUM" | "ADMIN" | "CTV" | "OPERATOR";
  isLocked: boolean;
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

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "Tất cả vai trò" },
  { value: "STUDENT", label: "Thành viên Thường" },
  { value: "PREMIUM", label: "Hội viên Premium" },
  { value: "ADMIN", label: "Quản trị viên (Admin)" },
  { value: "CTV", label: "Cộng tác viên (CTV)" },
  { value: "OPERATOR", label: "Vận hành viên (Operator)" },
];

const LEVEL_FILTER_OPTIONS = [
  { value: "", label: "Tất cả trình độ" },
  { value: "Beginner", label: "Beginner" },
  { value: "Experienced", label: "Experienced" },
];

const FORM_ROLE_OPTIONS = [
  { value: "STUDENT", label: "Thành viên Thường" },
  { value: "PREMIUM", label: "Hội viên Premium" },
  { value: "ADMIN", label: "Quản trị viên (Admin)" },
  { value: "CTV", label: "Cộng tác viên (CTV)" },
  { value: "OPERATOR", label: "Vận hành viên (Operator)" },
];

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Preview User state
  const [previewUser, setPreviewUser] = useState<UserAdminItem | null>(null);

  // Filter & Pagination states
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create / Edit Form Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("STUDENT");
  const [formIsLocked, setFormIsLocked] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchUsers = async (page = 1, query = "", role = "", level = "") => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        q: query,
        role,
        level,
      });
      const res = await fetch(`/api/admin/users?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setErrorMsg("Không thể tải danh sách tài khoản.");
      }
    } catch (error) {
      console.error("Failed to load admin users:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchUsers(currentPage, searchQuery, selectedRole, selectedLevel);
    }
  }, [user, currentPage, searchQuery, selectedRole, selectedLevel]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedLevel]);

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("STUDENT");
    setFormIsLocked(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: UserAdminItem) => {
    setEditingUserId(item.id);
    setFormName(item.name);
    setFormEmail(item.email);
    setFormPassword(""); // Empty to indicate no change unless re-typed
    setFormRole(item.role);
    setFormIsLocked(item.isLocked);
    setIsFormModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    if (!formName.trim() || !formEmail.trim() || (!editingUserId && !formPassword.trim())) {
      showNotification("Vui lòng điền đầy đủ các thông tin bắt buộc", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      showNotification("Định dạng Email không hợp lệ", "error");
      return;
    }

    if (!editingUserId && formPassword.trim().length < 6) {
      showNotification("Mật khẩu phải dài ít nhất 6 ký tự", "error");
      return;
    }

    if (editingUserId && formPassword.trim() && formPassword.trim().length < 6) {
      showNotification("Mật khẩu phải dài ít nhất 6 ký tự", "error");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
      };

      if (editingUserId) {
        payload.userId = editingUserId;
        payload.isLocked = formIsLocked;
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
      } else {
        payload.password = formPassword.trim();
      }

      const method = editingUserId ? "PUT" : "POST";
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormModalOpen(false);
        showNotification(
          editingUserId
            ? `Cập nhật thông tin tài khoản "${formName}" thành công.`
            : `Đã tạo tài khoản mới "${formName}" thành công.`
        );
        fetchUsers(currentPage, searchQuery, selectedRole, selectedLevel);
      } else {
        const err = await res.json();
        showNotification(err.error || "Có lỗi xảy ra.", "error");
      }
    } catch (error) {
      console.error("Save user error:", error);
      showNotification("Lỗi kết nối máy chủ.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleLock = async (userId: string, currentLockStatus: boolean, userName: string) => {
    if (actionLoading) return;
    const newLockStatus = !currentLockStatus;
    const actionText = newLockStatus ? "khóa tài khoản" : "mở khóa tài khoản";

    setConfirmModal({
      title: newLockStatus ? "Khóa tài khoản" : "Mở khóa tài khoản",
      message: `Bạn có chắc chắn muốn ${actionText} của học viên "${userName}" không? Tài khoản bị khóa sẽ không thể đăng nhập.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(userId);
        setErrorMsg(null);

        try {
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, isLocked: newLockStatus }),
          });

          if (res.ok) {
            await fetchUsers(currentPage, searchQuery, selectedRole, selectedLevel);
            showNotification(
              newLockStatus
                ? `Đã khóa tài khoản "${userName}" thành công.`
                : `Đã mở khóa tài khoản "${userName}" thành công.`
            );
          } else {
            const err = await res.json();
            showNotification(err.error || "Không thể cập nhật trạng thái khóa.", "error");
          }
        } catch (error) {
          console.error("Lock/Unlock status update failed:", error);
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (actionLoading) return;

    setConfirmModal({
      title: "Xóa vĩnh viễn tài khoản",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của "${userName}"? Hành động này sẽ xóa sạch lịch sử học tập, câu trả lời, streak, nộp bài, hóa đơn và KHÔNG thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(userId);
        setErrorMsg(null);

        try {
          const res = await fetch(`/api/admin/users?userId=${userId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            await fetchUsers(currentPage, searchQuery, selectedRole, selectedLevel);
            showNotification(`Đã xóa vĩnh viễn tài khoản "${userName}" thành công.`);
          } else {
            const err = await res.json();
            setErrorMsg(err.error || "Không thể xóa tài khoản học viên.");
            showNotification(err.error || "Không thể xóa tài khoản học viên.", "error");
          }
        } catch (error) {
          console.error("Delete user failed:", error);
          setErrorMsg("Lỗi kết nối mạng.");
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  if (!user) return null;

  if (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-sans text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-[#334155] text-white text-xs font-semibold hover:bg-[#0F172A] transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      <AdminSidebar currentPath="/admin/users" />

      {/* Main Viewport Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Quản lý Tài khoản</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-[#64748B] font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
              aria-label="User menu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full border border-rose-800"
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition duration-150 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-2 border-b border-[#E2E8F0] gap-4">
          <div>
            <h2 className="font-sans text-2xl font-bold tracking-tight">Tài khoản & Phân quyền</h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Danh sách và công cụ quản trị tài khoản, cấp quyền, khóa tài khoản trên hệ thống.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span> Tạo tài khoản mới
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-xs text-[#D32F2F] border border-[#FBE3E1] font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Stats Grid Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Tổng số tài khoản</span>
              <span className="text-2xl font-extrabold block mt-1 text-[#0F172A]">{stats.totalCount} tài khoản</span>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Hội viên Premium</span>
              <span className="text-2xl font-extrabold block mt-1 text-amber-700">{stats.premiumCount} thành viên</span>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Thành viên miễn phí</span>
              <span className="text-2xl font-extrabold block mt-1 text-[#5C554B]">{stats.freeCount} tài khoản</span>
            </div>
          </div>
        )}

        {/* Filters and Search Panel */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Bar */}
            <div className="relative col-span-1 md:col-span-2">
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#CBD5E1] rounded-xl text-xs text-[#334155] bg-white placeholder-[#BFB8AC] transition focus:border-rose-800 focus:outline-none font-medium h-full min-h-[38px]"
              />
              <span className="absolute left-3 top-3 text-[#64748B]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            {/* Role filter select */}
            <CustomSelect
              value={selectedRole}
              onChange={setSelectedRole}
              options={ROLE_FILTER_OPTIONS}
              placeholder="Vai trò"
            />

            {/* Level filter select */}
            <CustomSelect
              value={selectedLevel}
              onChange={setSelectedLevel}
              options={LEVEL_FILTER_OPTIONS}
              placeholder="Trình độ"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64748B] border-t-transparent"></div>
            </div>
          ) : totalCount === 0 ? (
            <div className="text-center py-20 text-sm text-[#64748B] italic">
              Không tìm thấy tài khoản nào phù hợp với bộ lọc.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Vai trò / Cấp bậc</th>
                    <th className="px-6 py-4">Luyện tập (Streak)</th>
                    <th className="px-6 py-4">Độ khó</th>
                    <th className="px-6 py-4">Ngày tham gia</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]/50 transition duration-150">
                      <td className="px-6 py-4 font-bold text-[#0F172A]">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                            alt={item.name}
                            className="h-8 w-8 rounded-full border border-[#CBD5E1]"
                          />
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              <span>{item.name}</span>
                              {item.isLocked && (
                                <span className="bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                                  🔒 Khóa
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-normal text-[#64748B] mt-0.5">{item.email}</div>
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
                        ) : item.role === "CTV" ? (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            🤝 CTV
                          </span>
                        ) : item.role === "OPERATOR" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            ⚙️ Operator
                          </span>
                        ) : (
                          <span className="bg-[#F8FAFC] text-[#64748B] border border-[#E5E0D8] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            Thường
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-[#D35400]">
                        🔥 {item.streak} ngày <span className="text-[10px] font-normal text-[#64748B]">(Max: {item.maxStreak})</span>
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
                      <td className="px-6 py-4 text-[#64748B]">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setPreviewUser(item)}
                            className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100/60 px-2 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer"
                          >
                            Xem
                          </button>
                          
                          <button
                            onClick={() => openEditModal(item)}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100/60 px-2 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer"
                          >
                            Sửa
                          </button>

                          {item.id !== user.id && item.role !== "ADMIN" && (
                            <>
                              <button
                                onClick={() => handleToggleLock(item.id, item.isLocked, item.name)}
                                disabled={actionLoading === item.id}
                                className={`px-2 py-1.5 rounded-lg font-bold text-[10px] border shadow-sm transition duration-150 cursor-pointer disabled:opacity-50 ${
                                  item.isLocked
                                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60"
                                }`}
                              >
                                {actionLoading === item.id ? "Đang lưu..." : item.isLocked ? "Mở khóa" : "Khóa"}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(item.id, item.name)}
                                disabled={actionLoading === item.id}
                                className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/60 px-2 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer disabled:opacity-50"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#F1F5F9]">
                <div className="text-xs text-[#64748B]">
                  Hiển thị từ <span className="font-bold text-[#0F172A]">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
                  <span className="font-bold text-[#0F172A]">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>{" "}
                  trong tổng số <span className="font-bold text-[#0F172A]">{totalCount}</span> tài khoản
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-rose-800 text-white"
                            : "border border-[#CBD5E1] text-[#64748B] hover:bg-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </main>

      {/* Create / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col relative"
          >
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F1F5F9] z-20">
              <h3 className="font-sans font-extrabold text-base text-rose-950">
                {editingUserId ? "Chỉnh sửa Tài khoản" : "Tạo Tài khoản mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] focus:outline-none cursor-pointer text-sm font-bold"
              >
                Đóng
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-[#334155] pb-36">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#4E4941] uppercase tracking-wider block">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Nhập tên tài khoản..."
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-slate-50 focus:outline-none focus:border-rose-800 font-medium"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#4E4941] uppercase tracking-wider block">Địa chỉ Email *</label>
                <input
                  type="email"
                  placeholder="vi_du@gmail.com"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-slate-50 focus:outline-none focus:border-rose-800 font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#4E4941] uppercase tracking-wider block">
                  Mật khẩu {editingUserId ? "(Để trống nếu không đổi)" : "*"}
                </label>
                <input
                  type="password"
                  placeholder={editingUserId ? "Nhập mật khẩu mới..." : "Nhập mật khẩu khởi tạo..."}
                  required={!editingUserId}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-slate-50 focus:outline-none focus:border-rose-800 font-medium"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#4E4941] uppercase tracking-wider block">Vai trò hệ thống</label>
                <CustomSelect
                  value={formRole}
                  onChange={setFormRole}
                  options={FORM_ROLE_OPTIONS}
                  placeholder="Chọn vai trò"
                  className="w-full"
                />
              </div>

              {/* isLocked (only edit mode) */}
              {editingUserId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formIsLocked"
                    checked={formIsLocked}
                    onChange={(e) => setFormIsLocked(e.target.checked)}
                    className="h-4 w-4 accent-rose-800 cursor-pointer"
                  />
                  <label htmlFor="formIsLocked" className="font-bold text-rose-900 cursor-pointer selection:bg-transparent">
                    Khóa tài khoản này (Không cho phép đăng nhập)
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-2 bg-[#F8FAFC] z-20 mt-auto">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg font-bold text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold transition cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? "Đang lưu..." : editingUserId ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview User Modal */}
      {previewUser && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F1F5F9]">
              <h3 className="font-sans font-extrabold text-lg text-rose-950">
                Thông tin chi tiết tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setPreviewUser(null)}
                className="text-[#64748B] hover:text-[#0F172A] focus:outline-none cursor-pointer text-sm font-bold"
              >
                Đóng
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-[#334155]">
              {/* Profile Card */}
              <div className="flex items-center gap-4 pb-4 border-b border-[#E2E8F0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUser.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                  alt={previewUser.name}
                  className="h-16 w-16 rounded-full border-2 border-rose-800"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-sans text-lg font-bold text-[#0F172A]">{previewUser.name}</h4>
                    {previewUser.isLocked && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                        🔒 Đã khóa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] font-mono">{previewUser.email}</p>
                  <div className="mt-1.5 flex gap-2 items-center">
                    <span className="text-[10px] text-[#64748B]">Cấp bậc:</span>
                    {previewUser.role === "ADMIN" ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">🛡️ Admin</span>
                    ) : previewUser.role === "PREMIUM" ? (
                      <span className="bg-[#FAF2EB] text-[#BF753F] border border-[#F0DDC5] font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">★ Premium</span>
                    ) : previewUser.role === "CTV" ? (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">🤝 CTV</span>
                    ) : previewUser.role === "OPERATOR" ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">⚙️ Operator</span>
                    ) : (
                      <span className="bg-[#F8FAFC] text-[#64748B] border border-[#E5E0D8] font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">Thường</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Study Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Streak Hiện tại</span>
                  <span className="text-xl font-extrabold text-[#D35400] mt-1 block">🔥 {previewUser.streak || 0} ngày</span>
                </div>
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Streak Kỷ lục</span>
                  <span className="text-xl font-extrabold text-amber-700 mt-1 block">👑 {previewUser.maxStreak || 0} ngày</span>
                </div>
              </div>

              {/* Level and Commitment */}
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Trình độ của học viên</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-xs inline-block">
                    {previewUser.currentLevel || "Chưa thiết lập"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Thời gian cam kết học tập</span>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    {previewUser.commitmentTime ? `⏱️ {previewUser.commitmentTime} phút / ngày` : "Chưa thiết lập cam kết"}
                  </span>
                </div>
              </div>

              {/* Interested Topics */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Lĩnh vực học viên quan tâm</span>
                {previewUser.interestedTopics && previewUser.interestedTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {previewUser.interestedTopics.map((topic) => (
                      <span key={topic} className="bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                        #{topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="italic text-xs text-[#64748B]">Chưa hoàn tất onboarding</span>
                )}
              </div>

              {/* Account Details */}
              <div className="pt-3 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex justify-between">
                <span>ID tài khoản: {previewUser.id}</span>
                <span>Ngày tham gia: {new Date(previewUser.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-sans font-extrabold text-base text-rose-950">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition duration-150 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-800 text-white rounded-lg text-xs font-bold hover:bg-rose-900 transition duration-150 cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-55 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-250 bg-white border-[#E2E8F0]">
          <div className={`h-2 w-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
          <p className="text-xs font-bold text-[#0F172A]">{toast.message}</p>
        </div>
      )}
      </div>
    </div>
  );
}
