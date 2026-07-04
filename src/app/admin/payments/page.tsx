"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface PaymentTransactionItem {
  id: string;
  userId: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  txCode: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
}

interface PaymentStats {
  totalCount: number;
  pendingCount: number;
  failedCount: number;
  completedCount: number;
  totalRevenue: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
}

function CustomSelect({ value, onChange, options, placeholder, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      {isOpen && (
        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white hover:border-slate-300 transition duration-200 cursor-pointer focus:border-rose-800 focus:outline-none font-bold"
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold transition duration-155 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-rose-50 text-rose-800"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="text-rose-800 text-[10px]">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState<PaymentTransactionItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

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
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  const fetchPayments = async (page = 1, search = "", status = "") => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        q: search,
        status,
      });
      const res = await fetch(`/api/admin/payments?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
        setStats(data.stats);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setErrorMsg("Không thể tải danh sách hóa đơn Premium.");
      }
    } catch (error) {
      console.error("Failed to load admin payments:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchPayments(currentPage, searchQuery, selectedStatus);
    }
  }, [user, currentPage, searchQuery, selectedStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  const handleUpdateStatus = async (transactionId: string, newStatus: "COMPLETED" | "FAILED", txCode: string, userName: string) => {
    if (actionLoading) return;
    const actionText = newStatus === "COMPLETED" ? "phê duyệt thành công" : "đánh dấu thất bại";
    
    setSelectedDuration(30);

    setConfirmModal({
      title: newStatus === "COMPLETED" ? "Phê duyệt giao dịch" : "Hủy giao dịch",
      message: `Bạn có chắc chắn muốn ${actionText} giao dịch "${txCode}" của học viên "${userName}"? Hành động này sẽ cập nhật trạng thái hóa đơn và cập nhật vai trò Premium của học viên tương ứng.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(transactionId);
        try {
          const res = await fetch("/api/admin/payments", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId, status: newStatus, durationDays: selectedDuration }),
          });

          if (res.ok) {
            await fetchPayments(currentPage, searchQuery, selectedStatus);
            showNotification(`Đã ${actionText} giao dịch thành công!`);
          } else {
            const err = await res.json();
            showNotification(err.error || "Không thể cập nhật trạng thái hóa đơn.", "error");
          }
        } catch (error) {
          console.error("Failed to update payment status:", error);
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  if (!user) return null;

  // Client-Side Authorization check
  if (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-sans text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      <AdminSidebar currentPath="/admin/payments" />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Quản lý Thanh toán Premium</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
              aria-label="User menu"
            >
              <img
                src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full border border-rose-800"
              />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50/50 transition cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Stats Cards Row */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Tổng doanh thu</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">
                    {stats.totalRevenue.toLocaleString("vi-VN")} <span className="text-sm font-sans font-bold">đ</span>
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-bold">{stats.completedCount} hóa đơn hoàn tất</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shadow-inner">
                  💰
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Yêu cầu chờ duyệt</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.pendingCount}</h3>
                  <p className="text-[10px] text-amber-700 font-bold">Cần xác nhận thủ công</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shadow-inner">
                  ⏳
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Yêu cầu thất bại</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.failedCount}</h3>
                  <p className="text-[10px] text-rose-700 font-bold">Bị từ chối hoặc lỗi</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-800 shadow-inner">
                  ❌
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Tổng số hóa đơn</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.totalCount}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Tất cả lịch sử dòng tiền</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-inner">
                  🧾
                </div>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative col-span-1 md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm theo mã giao dịch, tên hoặc email học viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white placeholder-slate-400 transition focus:border-rose-800 focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              <CustomSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "PENDING", label: "Chờ duyệt" },
                  { value: "COMPLETED", label: "Hoàn tất" },
                  { value: "FAILED", label: "Thất bại/Hủy" },
                ]}
                placeholder="Trạng thái"
              />
            </div>
          </div>

          {/* Payments Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-20 text-slate-500 italic">
                Không tìm thấy giao dịch nào phù hợp với bộ lọc.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-4">Mã giao dịch</th>
                        <th className="px-6 py-4">Học viên</th>
                        <th className="px-6 py-4">Số tiền</th>
                        <th className="px-6 py-4">Ngày tạo</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {payments.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="px-6 py-4 font-mono font-bold text-rose-950 uppercase">
                            {item.txCode}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                                {item.userName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span>{item.userName}</span>
                                <span className="text-[10px] text-slate-500 font-normal">{item.userEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900">
                            {item.amount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-6 py-4">
                            {item.status === "COMPLETED" && (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hoàn tất
                              </span>
                            )}
                            {item.status === "PENDING" && (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Chờ duyệt
                              </span>
                            )}
                            {item.status === "FAILED" && (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                Thất bại
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              {item.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(item.id, "COMPLETED", item.txCode, item.userName)}
                                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition duration-150 cursor-pointer border border-emerald-200"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(item.id, "FAILED", item.txCode, item.userName)}
                                    className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition duration-150 cursor-pointer border border-rose-200"
                                  >
                                    Hủy
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-semibold italic">Đã xử lý</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50">
                    <div className="text-xs text-slate-500">
                      Hiển thị từ <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
                      <span className="font-bold text-slate-800">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>{" "}
                      trong tổng số <span className="font-bold text-slate-800">{totalCount}</span> hóa đơn
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
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
                                : "border border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
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
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-rose-950">{confirmModal.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
            {confirmModal.title === "Phê duyệt giao dịch" && (
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Thời hạn Premium kích hoạt</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-800 cursor-pointer"
                >
                  <option value={30}>Gói 30 ngày (1 tháng)</option>
                  <option value={180}>Gói 180 ngày (6 tháng)</option>
                  <option value={365}>Gói 365 ngày (1 năm)</option>
                  <option value={9999}>Trọn đời (Lifetime)</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-rose-800 text-white text-xs font-bold hover:bg-rose-900 transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
