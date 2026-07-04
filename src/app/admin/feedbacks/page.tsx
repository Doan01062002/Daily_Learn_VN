"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import AdminSidebar from "@/components/layout/AdminSidebar";
import CustomSelect from "@/components/CustomSelect";

const TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại lỗi" },
  { value: "TYPO", label: "Lỗi chính tả" },
  { value: "WRONG_QUIZ", label: "Lỗi đáp án Quiz" },
  { value: "TRANSLATION", label: "Lỗi dịch nghĩa" },
  { value: "OTHER", label: "Lỗi khác" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả độ ưu tiên" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chưa xử lý (Pending)" },
  { value: "FIXING", label: "Đang sửa (Fixing)" },
  { value: "APPROVED", label: "Đã duyệt (Approved)" },
  { value: "DONE", label: "Hoàn tất (Done)" },
];

const EDIT_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp (Low)" },
  { value: "MEDIUM", label: "Trung bình (Medium)" },
  { value: "HIGH", label: "Cao (High)" },
];

const EDIT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chưa xử lý (Pending)" },
  { value: "FIXING", label: "Đang sửa (Fixing)" },
  { value: "APPROVED", label: "Đã duyệt sửa (Approved)" },
  { value: "DONE", label: "Hoàn tất & Cám ơn học viên (Done)" },
];

interface FeedbackItem {
  id: string;
  type: "TYPO" | "WRONG_QUIZ" | "TRANSLATION" | "OTHER";
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "FIXING" | "APPROVED" | "DONE";
  adminNote: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  lesson: {
    title: string;
  } | null;
  quiz: {
    question: string;
  } | null;
}

export default function AdminFeedbacksPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected feedback for details modal/drawer
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        type: typeFilter,
        page: page.toString(),
        limit: "8",
      });
      const res = await fetch(`/api/admin/feedbacks?${query}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải danh sách phản hồi lỗi.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    }
  }, [user, statusFilter, priorityFilter, typeFilter, page]);

  const handleOpenFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setNewStatus(item.status);
    setNewPriority(item.priority);
    setAdminNote(item.adminNote || "");
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/feedbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: newStatus,
          priority: newPriority,
          adminNote,
        }),
      });

      if (res.ok) {
        showNotification("Cập nhật thông tin góp ý thành công!");
        setSelectedFeedback(null);
        fetchFeedbacks();
      } else {
        showNotification("Cập nhật thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng khi cập nhật.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    const map = {
      TYPO: "Lỗi chính tả",
      WRONG_QUIZ: "Lỗi đáp án Quiz",
      TRANSLATION: "Lỗi dịch nghĩa",
      OTHER: "Lỗi khác",
    };
    return map[type as keyof typeof map] || type;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row font-sans">
      <AdminSidebar currentPath="/admin/feedbacks" />

      {/* Main Viewport */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <div className="flex flex-col">
            <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">
              Hộp thư Góp ý & Báo cáo Lỗi
            </h2>
            <span className="text-[10px] text-slate-500 font-bold">
              Phản hồi từ cộng đồng học viên Daily Learn VN
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold z-50 animate-in slide-in-from-bottom-2 ${
                toast.type === "success" ? "bg-emerald-800 text-white" : "bg-rose-800 text-white"
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Type Select */}
              <div className="flex flex-col space-y-1 min-w-[150px]">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Loại lỗi</span>
                <CustomSelect
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setPage(1); }}
                  options={TYPE_OPTIONS}
                  placeholder="Chọn loại lỗi"
                />
              </div>

              {/* Priority Select */}
              <div className="flex flex-col space-y-1 min-w-[140px]">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ưu tiên</span>
                <CustomSelect
                  value={priorityFilter}
                  onChange={(val) => { setPriorityFilter(val); setPage(1); }}
                  options={PRIORITY_OPTIONS}
                  placeholder="Chọn độ ưu tiên"
                />
              </div>

              {/* Status Select */}
              <div className="flex flex-col space-y-1 min-w-[160px]">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setPage(1); }}
                  options={STATUS_OPTIONS}
                  placeholder="Chọn trạng thái"
                />
              </div>
            </div>

            <button
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); setTypeFilter(""); setPage(1); }}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition duration-150"
            >
              🔄 Xóa bộ lọc
            </button>
          </div>

          {/* Feedbacks Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-800 border-t-transparent"></div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] p-12 text-center rounded-2xl shadow-sm space-y-2">
              <span className="text-4xl">📬</span>
              <h3 className="font-serif text-slate-700 font-bold">Hộp thư trống</h3>
              <p className="text-xs text-slate-500">Chưa có góp ý hay báo cáo lỗi nào được gửi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((item) => {
                  let statusBadge = "bg-slate-100 text-slate-700";
                  if (item.status === "PENDING") statusBadge = "bg-rose-50 border-rose-200 text-rose-800";
                  if (item.status === "FIXING") statusBadge = "bg-amber-50 border-amber-200 text-amber-800";
                  if (item.status === "APPROVED") statusBadge = "bg-blue-50 border-blue-200 text-blue-800";
                  if (item.status === "DONE") statusBadge = "bg-emerald-50 border-emerald-200 text-emerald-800";

                  let priorityBadge = "bg-slate-100 text-slate-500";
                  if (item.priority === "HIGH") priorityBadge = "bg-rose-800 text-white";
                  if (item.priority === "MEDIUM") priorityBadge = "bg-amber-500 text-white";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenFeedback(item)}
                      className="bg-white border border-[#E2E8F0] p-5 rounded-2xl hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        {/* Upper Meta */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusBadge}`}>
                            {item.status}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${priorityBadge}`}>
                            {item.priority}
                          </span>
                        </div>

                        {/* Feedback Content Preview */}
                        <p className="text-xs font-serif text-[#4E4941] italic line-clamp-3 leading-relaxed">
                          &quot;{item.content}&quot;
                        </p>
                      </div>

                      {/* Bottom Info */}
                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#64748B] font-bold">
                        <div className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                            alt={item.user.name}
                            className="h-5 w-5 rounded-full border"
                          />
                          <span className="truncate max-w-[120px]">{item.user.name}</span>
                        </div>
                        <span>
                          {item.lesson ? `Bài: ${item.lesson.title.slice(0, 20)}...` : "Quiz / Khác"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    ← Trước
                  </button>
                  <span className="text-xs font-bold text-slate-500">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Details drawer/modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFeedback(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close details"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header info */}
            <div>
              <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest">Chi tiết báo cáo lỗi</span>
              <h3 className="font-serif text-lg font-bold text-slate-800 mt-1">
                {getFeedbackTypeLabel(selectedFeedback.type)}
              </h3>
            </div>

            {/* User detail card */}
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedFeedback.user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                  alt={selectedFeedback.user.name}
                  className="h-8 w-8 rounded-full border border-slate-200"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{selectedFeedback.user.name}</span>
                  <span className="text-[10px] text-slate-400">{selectedFeedback.user.email}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {new Date(selectedFeedback.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Lesson detail context */}
            {(selectedFeedback.lesson || selectedFeedback.quiz) && (
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Nguồn lỗi phát sinh</span>
                <p className="text-xs text-slate-700 leading-relaxed font-serif">
                  {selectedFeedback.lesson && (
                    <>
                      <strong>Bài học:</strong> {selectedFeedback.lesson.title}
                    </>
                  )}
                  {selectedFeedback.quiz && (
                    <>
                      <br />
                      <strong>Câu hỏi:</strong> &quot;{selectedFeedback.quiz.question}&quot;
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Content text */}
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Chi tiết phản ánh</span>
              <div className="p-4 bg-amber-50/40 border border-amber-100/60 rounded-2xl text-xs font-serif text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                &quot;{selectedFeedback.content}&quot;
              </div>
            </div>

            {/* Editor form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Độ ưu tiên</span>
                <CustomSelect
                  value={newPriority}
                  onChange={(val) => setNewPriority(val)}
                  options={EDIT_PRIORITY_OPTIONS}
                  placeholder="Ưu tiên"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                <CustomSelect
                  value={newStatus}
                  onChange={(val) => setNewStatus(val)}
                  options={EDIT_STATUS_OPTIONS}
                  placeholder="Trạng thái"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú phản hồi học viên</span>
                {newStatus === "DONE" && (
                  <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">📧 Sẽ gửi Email</span>
                )}
              </div>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ghi chú sửa đổi nội dung học liệu để phản hồi cho học viên..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="flex-1 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateFeedback}
                className="flex-1 py-2.5 text-xs font-bold bg-[#4E4941] text-white hover:bg-[#3E3A35] rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Đang cập nhật..." : "Cập nhật & Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
