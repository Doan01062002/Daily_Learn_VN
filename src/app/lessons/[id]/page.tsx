"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/FeedbackModal";

interface LessonDetail {
  id: string;
  title: string;
  tags: string[];
  sourceDomain: string;
  summary: string[];
  actionableStep: string;
  level: string;
  completed: boolean;
}

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lessonId } = use(params);
  const { user, refreshSession } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Assignment states
  const [assignment, setAssignment] = useState<any | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [assignmentContent, setAssignmentContent] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchLessonDetail = async () => {
      try {
        const res = await fetch("/api/lessons/today");
        if (res.ok) {
          const data = await res.json();
          const found = data.lessons.find((l: LessonDetail) => l.id === lessonId);
          if (found) {
            setLesson(found);
          } else {
            setErrorMsg("Không tìm thấy bài học này trong danh sách hôm nay.");
          }
        } else {
          setErrorMsg("Không thể kết nối đến dữ liệu bài học.");
        }
      } catch (error) {
        console.error("Failed to load lesson detail:", error);
        setErrorMsg("Lỗi kết nối mạng.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignment = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/assignment`);
        if (res.ok) {
          const data = await res.json();
          setAssignment(data.assignment);
          setSubmission(data.submission);
          if (data.submission) {
            setAssignmentContent(data.submission.content);
          }
        }
      } catch (e) {
        console.error("Failed to fetch assignment:", e);
      }
    };

    fetchLessonDetail();
    fetchAssignment();
  }, [lessonId, user]);

  const handleComplete = async () => {
    if (!lesson || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        // Refresh session to fetch updated Streak data
        await refreshSession();
        // Redirect back to dashboard
        router.push("/dashboard");
      } else {
        setErrorMsg("Không thể cập nhật tiến độ học tập.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      setErrorMsg("Lỗi kết nối máy chủ khi cập nhật tiến độ.");
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentContent.trim()) {
      setAssignmentMessage("Vui lòng điền câu trả lời.");
      return;
    }
    setSubmittingAssignment(true);
    setAssignmentMessage(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: assignmentContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
        setAssignmentMessage("Đã nộp bài tập tự luận thành công!");
      } else {
        const data = await res.json();
        setAssignmentMessage(data.error || "Gửi bài tập thất bại.");
      }
    } catch (e) {
      console.error(e);
      setAssignmentMessage("Lỗi kết nối máy chủ.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Focused Navigation Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          <span>←</span> Quay lại Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition duration-150 cursor-pointer"
          >
            📬 Báo cáo lỗi
          </button>
          <span className="font-serif italic text-xs text-[#BFB8AC]">Đọc tập trung</span>
        </div>
      </header>

      {/* Main Focus Reading Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-between">
        
        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
          </div>
        ) : errorMsg || !lesson ? (
          <div className="space-y-4 flex-1">
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg || "Bài học không tồn tại."}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center py-2.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold"
            >
              Về Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Lesson meta tags */}
              <div className="flex flex-wrap gap-2 items-center">
                {lesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF0E6] text-[#8C8375] border border-[#F5D5C5]"
                  >
                    #{tag}
                  </span>
                ))}
                <span className="text-xs text-[#BFB8AC] font-serif italic ml-auto">
                  nguồn: {lesson.sourceDomain}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#3E3A35] leading-tight">
                {lesson.title}
              </h1>

              {/* Takeaways bullet points list */}
              <div className="space-y-4 pt-4 border-t border-[#EBE6DD]">
                <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">
                  Điểm tóm tắt quan trọng
                </h3>
                <ul className="space-y-4 text-base leading-relaxed text-[#4E4941] font-serif">
                  {lesson.summary.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-[#FAF0E6] text-[#8C8375] flex items-center justify-center text-xs font-bold shrink-0 border border-[#F5D5C5]">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actionable Step widget */}
              <div className="rounded-xl border border-[#EBE6DD] bg-[#FCFAF7] p-5 space-y-2 shadow-sm mt-8">
                <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-1.5">
                  ⚡ Hành động gợi ý
                </h3>
                <p className="text-sm text-[#4E4941] font-serif italic leading-relaxed">
                  &quot;{lesson.actionableStep}&quot;
                </p>
              </div>

              {/* Assignment widget */}
              {assignment && (
                <div className="rounded-xl border border-[#EBE6DD] bg-white p-5 space-y-4 shadow-sm mt-8 font-sans">
                  <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                    <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-1.5">
                      📝 Bài tập tự luận ({assignment.type === "WRITING" ? "Viết" : "Nói/Phát âm"})
                    </h3>
                    {submission && (
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        submission.status === "GRADED" 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}>
                        {submission.status === "GRADED" ? `Đã chấm: ${submission.score}/100` : "Đã nộp bài"}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-[#8C8375] uppercase tracking-widest">Đề bài</span>
                    <p className="text-xs text-[#4E4941] font-serif leading-relaxed italic">
                      &quot;{assignment.prompt}&quot;
                    </p>
                  </div>

                  {/* Submission Form */}
                  {(!submission || submission.status === "SUBMITTED") ? (
                    <form onSubmit={handleSubmitAssignment} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {assignment.type === "WRITING" 
                            ? "Bài làm của bạn (Nhập đoạn văn)" 
                            : "Bài nói của bạn (Nhập đoạn văn hoặc chèn link ghi âm)"}
                        </label>
                        <textarea
                          rows={4}
                          value={assignmentContent}
                          onChange={(e) => setAssignmentContent(e.target.value)}
                          placeholder={assignment.type === "WRITING" 
                            ? "Viết câu trả lời của bạn ở đây..." 
                            : "Viết nội dung bài nói hoặc dán link file ghi âm ở đây..."}
                          className="w-full px-3 py-2 text-xs border border-[#D5CFC5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C8375] font-serif"
                        />
                      </div>

                      {assignmentMessage && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-800">
                          {assignmentMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingAssignment}
                        className="w-full text-center py-2.5 rounded-xl bg-[#4E4941] text-white text-xs font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm disabled:opacity-50"
                      >
                        {submittingAssignment ? "Đang gửi..." : submission ? "Cập nhật bài nộp" : "Nộp bài làm tự luận"}
                      </button>
                    </form>
                  ) : (
                    // Graded Result Display
                    <div className="space-y-4 pt-3 border-t border-[#F0ECE4] text-xs leading-relaxed">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#8C8375] uppercase tracking-widest">Bài làm của bạn</span>
                        <p className="p-3 bg-slate-50 rounded-xl font-serif italic text-slate-700">{submission.content}</p>
                      </div>

                      {submission.grammarEdits && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-rose-800 uppercase tracking-widest block">Sửa lỗi ngữ pháp & câu từ</span>
                          <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl font-serif text-[#991b1b] whitespace-pre-wrap">{submission.grammarEdits}</div>
                        </div>
                      )}

                      {submission.comment && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-900 uppercase tracking-widest block">Nhận xét từ giáo viên</span>
                          <p className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-slate-700 italic">"{submission.comment}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 border-t border-[#EBE6DD] mt-12">
              {lesson.completed ? (
                <div className="space-y-4">
                  <div className="text-center text-xs font-serif italic text-[#8C8375]">
                    Bạn đã đọc bài học này hôm nay. Hãy tiếp tục học các bài khác!
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center py-3 rounded-lg border border-[#D5CFC5] bg-white text-sm font-semibold text-[#4E4941] hover:bg-[#F9F7F4] transition duration-200"
                  >
                    Quay lại Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/lessons/${lessonId}/quiz`}
                    className="block w-full text-center py-3.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm"
                  >
                    Làm trắc nghiệm củng cố (Kiếm điểm)
                  </Link>
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="w-full text-center py-3 rounded-lg border border-[#D5CFC5] bg-white text-xs font-semibold text-[#8C8375] hover:bg-[#F9F7F4] hover:text-[#3E3A35] transition duration-200 disabled:opacity-50 focus:outline-none"
                  >
                    {isSubmitting ? "Đang cập nhật..." : "Đọc xong (Không làm trắc nghiệm)"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        lessonId={lessonId}
      />
    </div>
  );
}
