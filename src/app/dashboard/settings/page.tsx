"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";

const TOPICS = [
  { id: "Tech", label: "Công nghệ / Lập trình", color: "bg-blue-500", activeStyle: "bg-blue-500/10 border-blue-500 text-blue-600" },
  { id: "Business", label: "Kinh doanh / Khởi nghiệp", color: "bg-emerald-500", activeStyle: "bg-emerald-500/10 border-emerald-500 text-emerald-600" },
  { id: "SoftSkills", label: "Kỹ năng mềm", color: "bg-amber-500", activeStyle: "bg-amber-500/10 border-amber-500 text-amber-600" },
  { id: "Design", label: "Thiết kế / UI/UX", color: "bg-pink-500", activeStyle: "bg-pink-500/10 border-pink-500 text-pink-600" },
  { id: "Health", label: "Sức khỏe / Đời sống", color: "bg-rose-500", activeStyle: "bg-rose-500/10 border-rose-500 text-rose-600" },
];

const LEVELS = [
  { id: "Beginner", label: "Beginner", desc: "Mới bắt đầu tìm hiểu lĩnh vực này" },
  { id: "Experienced", label: "Experienced", desc: "Đã có nền tảng/kinh nghiệm thực tế" },
];

const COMMITMENTS = [
  { id: 5, label: "5 Phút / ngày", desc: "Tinh gọn, siêu tốc độ" },
  { id: 10, label: "10 Phút / ngày", desc: "Học sâu hơn, thực hành vừa phải" },
  { id: 15, label: "15 Phút / ngày", desc: "Tập trung cao độ, thực hành sâu" },
];

interface TransactionItem {
  id: string;
  txCode: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function UserSettingsPage() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedCommitment, setSelectedCommitment] = useState(0);

  // Invoices log state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          const { profile, transactions } = data;

          setName(profile.name);
          setSelectedTopics(profile.interestedTopics || []);
          setSelectedLevel(profile.currentLevel || "");
          setSelectedCommitment(profile.commitmentTime || 5);
          setTransactions(transactions);
        } else {
          setErrorMsg("Không thể tải thông tin cài đặt cá nhân.");
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        setErrorMsg("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Clean success/error notifications on input change
  const handleNameChange = (val: string) => {
    setName(val);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleLevelChange = (val: string) => {
    setSelectedLevel(val);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleCommitmentChange = (val: number) => {
    setSelectedCommitment(val);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const toggleTopic = (id: string) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveLoading) return;

    setSuccessMsg(null);
    setErrorMsg(null);

    // Double-Layer Input Trimming
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập tên hiển thị.");
      return;
    }

    if (selectedTopics.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 chủ đề quan tâm.");
      return;
    }

    if (!selectedLevel) {
      setErrorMsg("Vui lòng chọn trình độ hiện tại.");
      return;
    }

    setSaveLoading(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          interestedTopics: selectedTopics,
          currentLevel: selectedLevel,
          commitmentTime: selectedCommitment,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Cập nhật sở thích học tập thành công!");
        if (refreshSession) {
          await refreshSession();
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Không thể lưu cài đặt.");
      }
    } catch (error) {
      console.error("Save profile settings failed:", error);
      setErrorMsg("Lỗi kết nối mạng khi lưu cài đặt.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#FFFFFF] to-[#F1F5F9] text-slate-800 flex flex-col relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-200/15 blur-[120px] pointer-events-none"></div>

      {/* Floating Glass Header */}
      <header className="sticky top-4 z-40 max-w-7xl w-[calc(100%-2rem)] mx-auto rounded-2xl border px-5 py-3 flex justify-between items-center shadow-lg shadow-indigo-950/5 mt-4 backdrop-blur-md bg-white/75 border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-650 to-indigo-500 flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black text-sm tracking-tight text-slate-800 leading-none">Daily Learn</span>
            <span className="text-[8px] font-black text-indigo-600/80 tracking-widest uppercase mt-0.5 font-sans">Việt Nam</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200 border border-slate-200/85 px-3 py-2 rounded-xl hover:bg-slate-50 hover:scale-[1.03] active:scale-[0.96] shadow-sm"
        >
          <span>←</span> <span>Quay lại Dashboard</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start z-20">
        
        {/* Left Side: Summary & Membership card (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="backdrop-blur-md bg-white/70 border border-slate-200/60 p-6 rounded-3xl shadow-xl shadow-indigo-950/5 space-y-6">
            
            {/* Profile Avatar Card */}
            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-slate-100">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold font-serif shadow-md border-4 border-white">
                {name ? name.trim().charAt(0).toUpperCase() : user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 font-serif">{name || user.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.email}</p>
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hội viên</h4>
              
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">
                  {user.role === "PREMIUM" ? "👑" : user.role === "ADMIN" ? "🛡️" : "📚"}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {user.role === "PREMIUM"
                      ? "Tài khoản Premium"
                      : user.role === "ADMIN"
                      ? "Tài khoản Quản trị"
                      : "Tài khoản Miễn phí"}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                    {user.role === "PREMIUM"
                      ? "Học tập không giới hạn"
                      : user.role === "ADMIN"
                      ? "Đầy đủ quyền cấu hình hệ thống"
                      : "Giới hạn 2 bài học / ngày"}
                  </div>
                </div>
              </div>

              {user.role === "STUDENT" && (
                <Link
                  href="/checkout"
                  className="w-full block text-center py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] shadow-sm uppercase tracking-wider"
                >
                  Nâng cấp Premium
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Profile Settings Form & Billing Log (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="backdrop-blur-md bg-white/70 border border-slate-200/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/5 space-y-6">
            <h3 className="font-serif text-lg font-bold border-b border-slate-100 pb-3 mb-4 text-slate-800">
              Cấu hình sở thích học tập
            </h3>

            {successMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4 text-center text-xs text-emerald-800 font-bold animate-fade-in">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-250 p-4 text-center text-xs text-rose-800 font-medium animate-fade-in">
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="space-y-6 relative overflow-hidden bg-white/50 rounded-2xl p-6 border border-slate-100/50">
                {/* Shimmer animation keyframe */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes shimmer {
                    100% { transform: translateX(100%); }
                  }
                  .animate-shimmer {
                    animation: shimmer 1.6s infinite;
                  }
                `}} />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-205/20 to-transparent animate-shimmer" style={{ animation: 'shimmer 1.6s infinite' }} />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4.5 w-24 bg-slate-100 rounded-md" />
                    <div className="h-10 w-full bg-slate-200/50 rounded-xl" />
                  </div>
                ))}
                <div className="h-12 w-full bg-slate-200 rounded-xl mt-8" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên hiển thị</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Email Display (Readonly) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed shadow-none"
                  />
                </div>

                {/* Topic Checkboxes */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chủ đề học tập quan tâm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TOPICS.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic(topic.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all duration-200 text-left hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                            isSelected
                              ? topic.activeStyle
                              : "bg-white/50 border-slate-200 text-slate-500 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${topic.color} shrink-0`} />
                            <span>{topic.label}</span>
                          </div>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level Radios */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trình độ của bạn</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {LEVELS.map((level) => {
                      const isSelected = selectedLevel === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => handleLevelChange(level.id)}
                          className={`flex flex-col p-3.5 rounded-xl border text-xs text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                            isSelected
                              ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 font-bold"
                              : "bg-white/50 border-slate-200 text-slate-500 hover:border-slate-350"
                          }`}
                        >
                          <span className="font-bold">{level.label}</span>
                          <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-indigo-500" : "text-slate-400"}`}>
                            {level.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Commitment Radios */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cam kết thời gian học mỗi ngày</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {COMMITMENTS.map((com) => {
                      const isSelected = selectedCommitment === com.id;
                      return (
                        <button
                          key={com.id}
                          type="button"
                          onClick={() => handleCommitmentChange(com.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                            isSelected
                              ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 font-bold"
                              : "bg-white/50 border-slate-200 text-slate-500 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{com.label}</span>
                            <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-indigo-500" : "text-slate-400"}`}>
                              {com.desc}
                            </span>
                          </div>
                          {isSelected && <span className="text-indigo-500 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full flex justify-center py-3.5 rounded-xl bg-indigo-650 hover:bg-indigo-750 disabled:opacity-50 text-white text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-md uppercase tracking-wider"
                >
                  {saveLoading ? "Đang lưu thay đổi..." : "Lưu cấu hình & cập nhật bài học"}
                </button>
              </form>
            )}
          </div>

          {/* Payment Invoices Card */}
          <div className="backdrop-blur-md bg-white/70 border border-slate-200/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/5 space-y-4">
            <h3 className="font-serif text-sm font-bold border-b border-slate-100 pb-3 mb-4 text-slate-800">
              Lịch sử thanh toán
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border border-indigo-500 border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-[10px] text-slate-400 italic py-6">
                Chưa có lịch sử giao dịch thanh toán nào.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex justify-between items-center text-[10px]">
                    <div>
                      <div className="font-bold text-slate-700 font-mono">{tx.txCode}</div>
                      <div className="text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                          month: "numeric",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700 font-mono">{(tx.amount).toLocaleString("vi-VN")} đ</div>
                      <span
                        className={`font-bold text-[8px] rounded px-1.5 py-0.5 mt-1.5 inline-block uppercase tracking-wide ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {tx.status === "COMPLETED" ? "Thành công" : "Chờ xử lý"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
