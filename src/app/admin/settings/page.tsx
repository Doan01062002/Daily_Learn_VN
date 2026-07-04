"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Configuration States
  const [appName, setAppName] = useState("Daily Learn VN");
  const [supportPhone, setSupportPhone] = useState("0987654321");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(199000);
  const [trialDays, setTrialDays] = useState(7);
  const [freeDailyLimit, setFreeDailyLimit] = useState(1);
  const [minQuizScoreToPass, setMinQuizScoreToPass] = useState(75);
  const [smtpSenderName, setSmtpSenderName] = useState("Daily Learn VN");
  const [smtpSenderEmail, setSmtpSenderEmail] = useState("support@dailylearn.vn");
  const [ctvPermissions, setCtvPermissions] = useState<string[]>(["manage_lessons", "manage_quizzes"]);
  const [operatorPermissions, setOperatorPermissions] = useState<string[]>(["manage_users", "manage_payments", "manage_notifications"]);

  // System Telemetry
  const [telemetry, setTelemetry] = useState<{ dbConnected: boolean; totalDbRecords: number; environment: string }>({
    dbConnected: false,
    totalDbRecords: 0,
    environment: "development",
  });

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setAppName(data.settings.appName || "Daily Learn VN");
        setSupportPhone(data.settings.supportPhone || "0987654321");
        setMaintenanceMode(!!data.settings.maintenanceMode);
        setPremiumPrice(data.settings.premiumPrice);
        setTrialDays(data.settings.trialDays);
        setFreeDailyLimit(data.settings.freeDailyLimit);
        setMinQuizScoreToPass(data.settings.minQuizScoreToPass);
        setSmtpSenderName(data.settings.smtpSenderName);
        setSmtpSenderEmail(data.settings.smtpSenderEmail);
        if (data.settings.rolePermissions) {
          setCtvPermissions(data.settings.rolePermissions.CTV || []);
          setOperatorPermissions(data.settings.rolePermissions.OPERATOR || []);
        }
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      } else {
        setErrorMsg("Không thể tải cài đặt hệ thống.");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchSettings();
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    setConfirmModal({
      title: "Lưu cài đặt hệ thống",
      message: "Bạn có chắc chắn muốn thay đổi các thông số cấu hình hệ thống? Mọi thay đổi sẽ có hiệu lực ngay lập tức với học viên.",
      onConfirm: async () => {
        setConfirmModal(null);
        setSaveLoading(true);
        try {
          const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supportPhone,
              maintenanceMode,
              premiumPrice,
              trialDays,
              freeDailyLimit,
              minQuizScoreToPass,
              smtpSenderName,
              smtpSenderEmail,
              rolePermissions: {
                CTV: ctvPermissions,
                OPERATOR: operatorPermissions,
              },
            }),
          });

          if (res.ok) {
            showNotification("Đã cập nhật cấu hình hệ thống thành công!");
          } else {
            const err = await res.json();
            showNotification(err.error || "Lỗi lưu cấu hình.", "error");
          }
        } catch (error) {
          console.error("Failed to save settings:", error);
          showNotification("Lỗi kết nối máy chủ.", "error");
        } finally {
          setSaveLoading(false);
        }
      }
    });
  };

  if (!user) return null;

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
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin/settings" />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Cài đặt Hệ thống</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
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

        <main className="flex-1 p-6 max-w-4xl w-full mx-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold mb-6">
              ⚠️ {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-800 border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Box 0: App Support Information */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 border-b border-slate-100 pb-3">
                  Thông tin Liên hệ Hỗ trợ
                </h3>

                <div className="max-w-md text-xs space-y-1">
                  <label className="font-bold text-slate-700">Hotline hỗ trợ học viên</label>
                  <input
                    type="text"
                    required
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="Ví dụ: 0987654321"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block">Số điện thoại nóng liên hệ hỗ trợ kỹ thuật và giải đáp thắc mắc dịch vụ.</span>
                </div>
              </div>
              {/* Box 1: Premium & Trial Configuration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 border-b border-slate-100 pb-3">
                  Cấu hình Thanh toán & Dùng thử
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Giá gói Premium (VND)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(Number(e.target.value))}
                      placeholder="Ví dụ: 199000"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">Số tiền hiển thị tại trang nâng cấp Premium.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Số ngày dùng thử (Trial Days)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      placeholder="Ví dụ: 7"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">Số ngày trải nghiệm học thử Premium miễn phí khi đăng ký mới.</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Lesson & Learning Limits */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 border-b border-slate-100 pb-3">
                  Giới hạn học tập & Điều kiện Vượt qua
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Số bài học Free tối đa / ngày</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={freeDailyLimit}
                      onChange={(e) => setFreeDailyLimit(Number(e.target.value))}
                      placeholder="Ví dụ: 1"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">Giới hạn xem tóm tắt bài học của tài khoản thường mỗi ngày.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tỉ lệ câu trả lời đúng tối thiểu (%) để pass</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={minQuizScoreToPass}
                      onChange={(e) => setMinQuizScoreToPass(Number(e.target.value))}
                      placeholder="Ví dụ: 75"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">Học viên cần đạt tỉ lệ đúng tối thiểu này để được ghi nhận vượt qua bài học.</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Email SMTP Configuration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 border-b border-slate-100 pb-3">
                  Cấu hình Thông tin Người gửi Email (SMTP)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tên hiển thị người gửi email</label>
                    <input
                      type="text"
                      required
                      value={smtpSenderName}
                      onChange={(e) => setSmtpSenderName(e.target.value)}
                      placeholder="Ví dụ: Daily Learn VN"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block">Tên thương hiệu xuất hiện trong hộp thư đến của học viên.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Địa chỉ Email phản hồi (Reply-To)</label>
                    <input
                      type="email"
                      required
                      value={smtpSenderEmail}
                      onChange={(e) => setSmtpSenderEmail(e.target.value)}
                      placeholder="support@dailylearn.vn"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:border-rose-800 focus:outline-none font-semibold font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">Hộp thư hỗ trợ tiếp nhận thắc mắc hoặc phản hồi của học viên.</span>
                  </div>
                </div>
              </div>

              {/* Box 4: System Health & Maintenance Control */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 border-b border-slate-100 pb-3">
                  Giám sát & Trạng thái Hệ thống
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  {/* Maintenance Mode Card */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Chế độ Bảo trì (Maintenance)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              title: maintenanceMode ? "Tắt chế độ bảo trì" : "Bật chế độ bảo trì",
                              message: maintenanceMode 
                                ? "Hệ thống sẽ mở lại bình thường cho toàn bộ học viên truy cập học tập. Bạn có muốn tiếp tục?"
                                : "CẢNH BÁO: Học viên thường sẽ không thể truy cập học bài hay thi thử trong quá trình bảo trì. Bạn có chắc muốn bật?",
                              onConfirm: () => {
                                setConfirmModal(null);
                                setMaintenanceMode(!maintenanceMode);
                              }
                            });
                          }}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                            maintenanceMode ? "bg-rose-800" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                              maintenanceMode ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                        Khi chế độ bảo trì được bật, học viên khi truy cập hệ thống sẽ nhận được màn hình thông báo bảo trì, ngoại trừ quản trị viên.
                      </p>
                    </div>
                    {maintenanceMode && (
                      <span className="inline-flex self-start items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 animate-pulse mt-2">
                        ⚠️ ĐANG BẬT BẢO TRÌ
                      </span>
                    )}
                  </div>

                  {/* Telemetry Status Card */}
                  <div className="p-4 border border-slate-200 rounded-xl space-y-3 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-800 text-xs block border-b border-slate-100 pb-1.5">Chỉ số Telemetry</span>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Trạng thái Database:</span>
                        {telemetry.dbConnected ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            ● Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-800 border border-rose-100">
                            ● Disconnected
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Tổng bản ghi cơ sở dữ liệu:</span>
                        <span className="font-mono font-bold text-slate-800">{telemetry.totalDbRecords} bản ghi</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Môi trường máy chủ:</span>
                        <span className="font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">
                          {telemetry.environment}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dynamic Permissions Config Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🛡️</span>
                    <h3 className="font-sans font-black text-sm tracking-tight text-slate-800">
                      Ma trận Phân quyền Quản trị (Dynamic RBAC Matrix)
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Cấu hình quyền hạn truy cập động cho vai trò **Cộng tác viên (CTV)** và **Nhân viên vận hành (Operator)**. Quyền hạn của Super Admin luôn được mặc định đầy đủ.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    {
                      key: "manage_lessons",
                      label: "Quản lý Bài học",
                      desc: "Tạo mới, chỉnh sửa nội dung, import hàng loạt file Excel, cấu hình bài học.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_quizzes",
                      label: "Ngân hàng Câu hỏi",
                      desc: "Soạn thảo ngân hàng câu hỏi trắc nghiệm, cấu hình đáp án đúng/sai.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_users",
                      label: "Quản lý Học viên",
                      desc: "Tra cứu danh sách học viên, nâng cấp Premium, khóa/mở khóa tài khoản học.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_payments",
                      label: "Quản lý Thanh toán",
                      desc: "Phê duyệt các giao dịch nâng cấp tài khoản Premium thủ công chuyển khoản.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_notifications",
                      label: "Quản lý Thông báo",
                      desc: "Tạo chiến dịch nhắc nhở học tập hàng loạt hoặc gửi tin nhắn cá nhân.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      )
                    },
                    {
                      key: "view_analytics",
                      label: "Phân tích Học tập",
                      desc: "Xem biểu đồ thống kê, báo cáo chuyên sâu, tốc độ học tập và doanh số.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_coupons",
                      label: "Quản lý Coupon",
                      desc: "Tạo mới và xóa các mã giảm giá, khuyến mãi nâng cấp Premium cho học viên.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_feedbacks",
                      label: "Hộp thư Góp ý",
                      desc: "Xem báo cáo lỗi học liệu từ học viên, cập nhật trạng thái sửa lỗi và gửi email cảm ơn.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_media",
                      label: "Thư viện Media",
                      desc: "Tải lên, tra cứu và quản lý các file hình ảnh, file âm thanh nghe/phát âm tập trung.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )
                    },
                    {
                      key: "manage_grading",
                      label: "Chấm điểm Tự luận",
                      desc: "Xem danh sách bài tập nộp (Writing, Speaking), chấm điểm và sửa lỗi ngữ pháp.",
                      icon: (
                        <svg className="h-5 w-5 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      )
                    }
                  ].map((perm) => {
                    const isCtvChecked = ctvPermissions.includes(perm.key);
                    const isOperatorChecked = operatorPermissions.includes(perm.key);

                    // Dynamic border glow styles
                    let borderStyle = "border-slate-200 bg-white";
                    if (isCtvChecked && isOperatorChecked) {
                      borderStyle = "border-rose-350 bg-rose-50/10 shadow-sm ring-1 ring-rose-300/20";
                    } else if (isCtvChecked) {
                      borderStyle = "border-rose-200 bg-rose-50/5";
                    } else if (isOperatorChecked) {
                      borderStyle = "border-slate-350 bg-slate-50/10";
                    }

                    return (
                      <div
                        key={perm.key}
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-rose-800/40 group ${borderStyle}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform duration-300">
                              {perm.icon}
                            </div>
                            <span className="text-xs font-extrabold text-slate-800">{perm.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            {perm.desc}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 mt-4 pt-3 space-y-2.5">
                          {/* CTV Toggle Row */}
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Cấp cho Cộng tác viên (CTV)</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isCtvChecked) {
                                  setCtvPermissions(ctvPermissions.filter((p) => p !== perm.key));
                                } else {
                                  setCtvPermissions([...ctvPermissions, perm.key]);
                                }
                              }}
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none ${
                                isCtvChecked ? "bg-rose-800" : "bg-slate-200"
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                                  isCtvChecked ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Operator Toggle Row */}
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Cấp cho Nhân viên vận hành</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isOperatorChecked) {
                                  setOperatorPermissions(operatorPermissions.filter((p) => p !== perm.key));
                                } else {
                                  setOperatorPermissions([...operatorPermissions, perm.key]);
                                }
                              }}
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none ${
                                isOperatorChecked ? "bg-slate-700" : "bg-slate-200"
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                                  isOperatorChecked ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  🔄 Khôi phục mặc định
                </button>
                
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {saveLoading ? "Đang lưu cấu hình..." : "💾 Lưu cấu hình hệ thống"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-rose-950">{confirmModal.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
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
