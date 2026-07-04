"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { user, logout } = useAuth();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Không thể tải danh sách coupon.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchCoupons();
    }
  }, [user]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !expiresAt) {
      showNotification("Vui lòng nhập đầy đủ thông tin coupon.", "error");
      return;
    }

    const codeClean = code.trim().toUpperCase();
    const codeRegex = /^[A-Z0-9_-]+$/;
    if (!codeRegex.test(codeClean)) {
      showNotification("Mã coupon chỉ được chứa chữ cái, số, gạch ngang/dưới.", "error");
      return;
    }

    const pct = parseInt(discountPercent.toString(), 10);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      showNotification("Phần trăm giảm giá phải từ 1 đến 100.", "error");
      return;
    }

    const uses = parseInt(maxUses.toString(), 10);
    if (isNaN(uses) || uses < 1) {
      showNotification("Lượt sử dụng tối đa phải lớn hơn hoặc bằng 1.", "error");
      return;
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      showNotification("Ngày hết hạn phải ở thời điểm tương lai.", "error");
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          discountPercent,
          maxUses,
          expiresAt,
        }),
      });

      if (res.ok) {
        showNotification("Đã tạo mã coupon mới thành công!");
        setCode("");
        setDiscountPercent(20);
        setMaxUses(100);
        setExpiresAt("");
        fetchCoupons();
      } else {
        const err = await res.json();
        showNotification(err.error || "Không thể tạo coupon.", "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Lỗi kết nối mạng.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string, codeString: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${codeString}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showNotification(`Đã xóa mã giảm giá "${codeString}" thành công!`);
        fetchCoupons();
      } else {
        const err = await res.json();
        showNotification(err.error || "Không thể xóa coupon.", "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Lỗi kết nối mạng.", "error");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin/coupons" />

      {/* Main Viewport Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Mã Giảm Giá Premium</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">{user.role}</span>
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
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Create Coupon Form */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 sticky top-20">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-black text-sm text-slate-800">🎟️ Tạo Coupon Mới</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Thiết lập mã giảm giá mới để chạy các chiến dịch thúc đẩy mua Premium.</p>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">Mã Coupon (Code)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: DAILY50, IELTS20"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-800 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">% Giảm giá</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">Lượt dùng tối đa</label>
                      <input
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {saveLoading ? "Đang tạo..." : "💾 Lưu Coupon"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Coupon List Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-5">
                  <h3 className="font-sans font-black text-sm text-slate-800">📋 Danh sách mã Coupon hiện tại</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Danh sách tất cả các mã coupon đã tạo và trạng thái hiệu lực.</p>
                </div>

                {loading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-800 border-t-transparent"></div>
                    <span className="text-slate-400 font-bold text-[11px]">Đang tải coupon...</span>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 italic text-xs">
                    Chưa có mã giảm giá nào được cấu hình trên hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiresAt) < new Date();
                      const isFullyUsed = coupon.usedCount >= coupon.maxUses;
                      const isActive = !isExpired && !isFullyUsed;

                      return (
                        <div
                          key={coupon.id}
                          className={`border rounded-2xl p-5 flex flex-col justify-between transition hover:shadow-md bg-white ${
                            isActive ? "border-slate-200" : "border-rose-100 bg-rose-50/10"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded-lg font-mono font-black text-xs border border-rose-100">
                                {coupon.code}
                              </span>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                isActive 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                  : "bg-rose-50 text-rose-800 border-rose-100"
                              }`}>
                                {isExpired ? "Hết hạn" : isFullyUsed ? "Hết lượt" : "Hoạt động"}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">Mức giảm:</span>
                                <span className="font-extrabold text-slate-800">Giảm {coupon.discountPercent}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">Số lượng sử dụng:</span>
                                <span className="font-bold text-slate-800">{coupon.usedCount} / {coupon.maxUses} lượt</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">Hạn dùng:</span>
                                <span className="font-mono text-slate-800 text-[11px]">{new Date(coupon.expiresAt).toLocaleDateString("vi-VN")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                            >
                              🗑️ Xóa mã
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

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
