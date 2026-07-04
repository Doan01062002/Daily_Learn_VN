"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";

const TOPICS = [
  { id: "Tech", label: "Công nghệ / Lập trình" },
  { id: "Business", label: "Kinh doanh / Khởi nghiệp" },
  { id: "SoftSkills", label: "Kỹ năng mềm" },
  { id: "Design", label: "Thiết kế / UI/UX" },
  { id: "Health", label: "Sức khỏe / Đời sống" },
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
const SELECTED_TAG_STYLES: { [key: string]: string } = {
  Tech: "bg-blue-50 border-blue-500 text-blue-700",
  Business: "bg-amber-50 border-amber-500 text-amber-700",
  SoftSkills: "bg-purple-50 border-purple-500 text-purple-700",
  Design: "bg-pink-50 border-pink-500 text-pink-700",
  Health: "bg-teal-50 border-teal-500 text-teal-700",
};

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

  const toggleTopic = (id: string) => {
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

    if (!name) {
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
          name,
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#8C8375] to-[#4E4941] flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-base tracking-tight text-[#3E3A35] leading-none">Daily Learn</span>
            <span className="text-[9px] font-bold text-[#8C8375] tracking-widest uppercase mt-0.5">Việt Nam</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          ← Quay lại Dashboard
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Edit Form (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#EBE6DD] p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold border-b border-[#F0ECE4] pb-3.5 mb-5">Cấu hình hồ sơ học tập</h2>

            {successMsg && (
              <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs text-emerald-700 border border-emerald-200 mb-5 font-semibold">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-xs text-[#D32F2F] border border-[#FBE3E1] mb-5">
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Tên hiển thị</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-[#D5CFC5] bg-white px-3 py-2 text-xs text-[#4E4941] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                {/* Email Display (Readonly) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Địa chỉ Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3 py-2 text-xs text-[#8C8375] shadow-none cursor-not-allowed"
                  />
                </div>

                {/* Topic Checkboxes */}
                <div className="space-y-3.5">
                  <label className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Chủ đề học tập quan tâm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TOPICS.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic(topic.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition duration-200 text-left focus:outline-none ${
                            isSelected
                              ? SELECTED_TAG_STYLES[topic.id] || "bg-[#FAF2EB] border-[#6366F1] text-[#3E3A35]"
                              : "bg-[#FCFAF7] border-[#EBE6DD] text-[#8C8375] hover:border-[#BFB8AC]"
                          }`}
                        >
                          <span>{topic.label}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level Radios */}
                <div className="space-y-3.5">
                  <label className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Trình độ của bạn</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {LEVELS.map((level) => {
                      const isSelected = selectedLevel === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => setSelectedLevel(level.id)}
                          className={`flex flex-col p-3.5 rounded-xl border text-xs text-left transition duration-200 focus:outline-none ${
                            isSelected
                              ? "bg-indigo-50/50 border-[#6366F1] text-[#3E3A35]"
                              : "bg-[#FCFAF7] border-[#EBE6DD] text-[#8C8375] hover:border-[#BFB8AC]"
                          }`}
                        >
                          <span className="font-bold">{level.label}</span>
                          <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-[#6366F1]" : "text-[#8C8375]"}`}>
                            {level.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Commitment Radios */}
                <div className="space-y-3.5">
                  <label className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Cam kết thời gian học mỗi ngày</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {COMMITMENTS.map((com) => {
                      const isSelected = selectedCommitment === com.id;
                      return (
                        <button
                          key={com.id}
                          type="button"
                          onClick={() => setSelectedCommitment(com.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs text-left transition duration-200 focus:outline-none ${
                            isSelected
                              ? "bg-indigo-50/50 border-[#6366F1] text-[#3E3A35]"
                              : "bg-[#FCFAF7] border-[#EBE6DD] text-[#8C8375] hover:border-[#BFB8AC]"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{com.label}</span>
                            <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-[#6366F1]" : "text-[#8C8375]"}`}>
                              {com.desc}
                            </span>
                          </div>
                          {isSelected && <span className="text-[#6366F1]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full flex justify-center py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F1C] hover:from-[#e05621] hover:to-[#e58a10] text-white text-xs font-bold transition-all duration-200 active:translate-y-[1px] shadow-md uppercase tracking-wider"
                >
                  {saveLoading ? "Đang lưu thay đổi..." : "Lưu cấu hình & cập nhật bài học"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Account Membership & Payment Invoices (1 col) */}
        <div className="space-y-6">
          {/* Membership status card */}
          <div className={`bg-white rounded-xl border p-6 shadow-sm ${
            user.role === "PREMIUM"
              ? "border-[#D8B4FE] bg-gradient-to-br from-white to-[#8B5CF6]/5"
              : "border-[#E5E7EB]"
          }`}>
            <h3 className="font-serif text-sm font-bold border-b border-[#F0ECE4] pb-3 mb-4">Gói hội viên</h3>
            
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {user.role === "PREMIUM" ? "👑" : user.role === "ADMIN" ? "🛡️" : "📚"}
              </span>
              <div>
                <div className="text-xs font-bold text-[#3E3A35]">
                  {user.role === "PREMIUM"
                    ? "Tài khoản Premium"
                    : user.role === "ADMIN"
                    ? "Tài khoản Quản trị"
                    : "Tài khoản Miễn phí"}
                </div>
                <div className="text-[10px] text-[#8C8375] mt-0.5">
                  {user.role === "PREMIUM"
                    ? "Học tập không giới hạn"
                    : user.role === "ADMIN"
                    ? "Đầy đủ quyền cấu hình"
                    : "Giới hạn 2 bài học / ngày"}
                </div>
              </div>
            </div>

            {user.role === "STUDENT" && (
              <Link
                href="/checkout"
                className="mt-4 block text-center py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7c4fe0] hover:to-[#5457e5] text-white text-xs font-bold transition-all duration-200 active:translate-y-[1px] shadow-sm uppercase tracking-wider"
              >
                Nâng cấp Premium ngay
              </Link>
            )}
          </div>

          {/* Payment Invoices Card */}
          <div className="bg-white rounded-xl border border-[#EBE6DD] p-6 shadow-sm">
            <h3 className="font-serif text-sm font-bold border-b border-[#F0ECE4] pb-3 mb-4">Lịch sử thanh toán</h3>

            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border border-[#8C8375] border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-[10px] text-[#8C8375] italic py-6">
                Chưa có lịch sử giao dịch thanh toán nào.
              </div>
            ) : (
              <div className="divide-y divide-[#F0ECE4] max-h-56 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex justify-between items-center text-[10px]">
                    <div>
                      <div className="font-bold text-[#3E3A35] font-mono">{tx.txCode}</div>
                      <div className="text-[#8C8375] mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#3E3A35] font-mono">{(tx.amount).toLocaleString("vi-VN")} đ</div>
                      <span
                        className={`font-bold text-[8px] rounded px-1.5 py-0.5 mt-1 inline-block uppercase tracking-wide ${
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
