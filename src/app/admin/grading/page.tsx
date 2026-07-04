"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface SubmissionItem {
  id: string;
  content: string;
  status: "SUBMITTED" | "GRADING" | "GRADED";
  score: number | null;
  comment: string | null;
  grammarEdits: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  assignment: {
    type: "WRITING" | "SPEAKING";
    prompt: string;
    lesson: {
      title: string;
    };
  };
}

export default function AdminGradingPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Active submission for grading panel
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [score, setScore] = useState<string>("");
  const [grammarEdits, setGrammarEdits] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "8",
      });
      const res = await fetch(`/api/admin/submissions?${q}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải danh sách bài tập nộp.");
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
      fetchSubmissions();
    }
  }, [user, statusFilter, page]);

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setSelectedSubmission(sub);
    setScore(sub.score !== null ? sub.score.toString() : "");
    setGrammarEdits(sub.grammarEdits || "");
    setComment(sub.comment || "");
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const numericScore = parseInt(score, 10);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      showNotification("Điểm số phải là số từ 0 đến 100.", "error");
      return;
    }

    setIsSubmittingGrade(true);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSubmission.id,
          score: numericScore,
          comment,
          grammarEdits,
        }),
      });

      if (res.ok) {
        showNotification("Đã lưu điểm số & phản hồi chấm bài học viên!");
        setSelectedSubmission(null);
        fetchSubmissions();
      } else {
        showNotification("Lưu điểm thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng khi cập nhật điểm.", "error");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row font-sans">
      <AdminSidebar currentPath="/admin/grading" />

      {/* Main Viewport */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <div className="flex flex-col">
            <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">
              Trình Chấm Điểm & Nhận Xét
            </h2>
            <span className="text-[10px] text-slate-500 font-bold">
              Chấm bài tự luận viết & nói của học viên
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
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setStatusFilter("SUBMITTED"); setPage(1); setSelectedSubmission(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "SUBMITTED"
                    ? "bg-[#4E4941] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                📥 Chờ chấm điểm (Submitted)
              </button>
              <button
                onClick={() => { setStatusFilter("GRADED"); setPage(1); setSelectedSubmission(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "GRADED"
                    ? "bg-[#4E4941] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                ✅ Đã chấm xong (Graded)
              </button>
            </div>
          </div>

          {/* Submissions List & Grading details */}
          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-800 border-t-transparent"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] p-12 text-center rounded-2xl shadow-sm space-y-2">
              <span className="text-4xl">📝</span>
              <h3 className="font-serif text-slate-700 font-bold">Danh sách trống</h3>
              <p className="text-xs text-slate-500">Không có bài tập nào thuộc trạng thái này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left submissions list */}
              <div className="lg:col-span-1 space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`bg-white border p-4 rounded-2xl cursor-pointer hover:shadow-md transition flex flex-col justify-between space-y-3 ${
                      selectedSubmission?.id === sub.id ? "border-rose-800 shadow-sm" : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
                        <span>{sub.assignment.type}</span>
                        <span>{new Date(sub.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {sub.assignment.lesson.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                        alt={sub.user.name}
                        className="h-5 w-5 rounded-full border"
                      />
                      <span className="text-[10px] font-bold text-slate-600 truncate">{sub.user.name}</span>
                      {sub.status === "GRADED" && (
                        <span className="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-auto">
                          {sub.score} đ
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      ←
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              {/* Right grading details panel */}
              <div className="lg:col-span-2">
                {selectedSubmission ? (
                  <div className="bg-white border border-[#E2E8F0] p-6 rounded-3xl space-y-5 shadow-sm">
                    <div>
                      <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest">Đánh giá & Chấm điểm</span>
                      <h3 className="font-serif text-base font-bold text-slate-800 mt-1">
                        Học viên: {selectedSubmission.user.name} ({selectedSubmission.user.email})
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                        Bài học: {selectedSubmission.assignment.lesson.title}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Đề bài yêu cầu</span>
                      <p className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-serif text-slate-600 italic">
                        &quot;{selectedSubmission.assignment.prompt}&quot;
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Nội dung học viên nộp</span>
                      <div className="p-4 bg-amber-50/20 border border-amber-100/40 rounded-2xl text-xs font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.content}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      {/* Grading inputs */}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="col-span-1 space-y-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Điểm số (0 - 100)</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="Ví dụ: 85"
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2 text-[10px] text-slate-400 pb-1.5 font-medium">
                          * Thang điểm tối đa là 100. Điểm số sẽ được phản hồi cho học viên qua Email.
                        </div>
                      </div>

                      {/* Grammar Corrector editor */}
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-rose-800 uppercase tracking-widest block">Sửa lỗi ngữ pháp & Từ vựng (Grammar Corrections)</span>
                        <textarea
                          rows={4}
                          value={grammarEdits}
                          onChange={(e) => setGrammarEdits(e.target.value)}
                          placeholder="Ví dụ:
- Sai: 'I has a book' -> Sửa: 'I have a book' (Chủ ngữ I đi với have)
- Nên dùng từ 'flexible' thay vì 'fluid' trong văn cảnh này."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-serif leading-relaxed"
                        />
                      </div>

                      {/* General Feedback Comment */}
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Nhận xét chung</span>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Nhập nhận xét tổng quan về bài làm tự luận của học viên..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isSubmittingGrade}
                        onClick={handleGradeSubmission}
                        className="w-full py-3 bg-[#4E4941] hover:bg-[#3E3A35] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingGrade ? "Đang gửi điểm..." : "Hoàn tất & Gửi email báo điểm"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 space-y-1.5 min-h-[300px]">
                    <span className="text-3xl">👈</span>
                    <p className="text-xs font-bold text-slate-500">Vui lòng chọn một bài nộp để tiến hành chấm điểm</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
