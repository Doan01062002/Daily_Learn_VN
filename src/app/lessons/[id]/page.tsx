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

  // Takeaways checkboxes
  const [checkedTakeaways, setCheckedTakeaways] = useState<boolean[]>([]);

  // Personal Notes notepad
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Assignment states
  const [assignment, setAssignment] = useState<any | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [assignmentContent, setAssignmentContent] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  // Load lesson details & notes
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
            // Default takeaways checked if already completed
            setCheckedTakeaways(new Array(found.summary.length).fill(found.completed));
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

    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/notes`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || "");
        }
      } catch (err) {
        console.error("Failed to load notes:", err);
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
    fetchNotes();
    fetchAssignment();
  }, [lessonId, user]);

  // Debounced Notepad Autosave to database
  useEffect(() => {
    if (loading || !user || !lesson) return;

    const delayDebounceFn = setTimeout(async () => {
      setSavingNotes(true);
      try {
        await fetch(`/api/lessons/${lessonId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
      } catch (err) {
        console.error("Failed to auto-save notes:", err);
      } finally {
        setSavingNotes(false);
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [notes, lesson, loading, user, lessonId]);

  const handleComplete = async () => {
    if (!lesson || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        await refreshSession();
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

  // Calculate reading checklist progress
  const checkedCount = checkedTakeaways.filter(Boolean).length;
  const totalTakeaways = checkedTakeaways.length;
  const readingProgress = totalTakeaways > 0 ? (checkedCount / totalTakeaways) * 100 : 0;
  const isQuizUnlocked = readingProgress === 100 || (lesson?.completed || false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#FFFFFF] to-[#F5EFFF] text-slate-800 flex flex-col relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-200/15 blur-[120px] pointer-events-none"></div>

      {/* Focused Navigation Header - Floating design */}
      <header className="sticky top-4 z-40 max-w-5xl w-[calc(100%-2rem)] mx-auto rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md px-5 py-3 flex justify-between items-center shadow-lg shadow-indigo-950/5 mt-4 transition-all duration-300">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition duration-200 border border-slate-200/85 px-3 py-2 rounded-xl hover:bg-slate-50"
        >
          <span>←</span> <span className="hidden sm:inline">Quay lại Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-250 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition duration-150 cursor-pointer"
          >
            📬 Báo cáo lỗi
          </button>
          <span className="font-serif italic text-xs text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">Đọc tập trung</span>
        </div>
      </header>

      {/* Main Focus Reading Responsive Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 z-20">
        
        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : errorMsg || !lesson ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 border border-red-100">
              {errorMsg || "Bài học không tồn tại."}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md transition duration-200"
            >
              Về Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column (2/3 Width) - Lesson takeaways, details & essay submission */}
            <div className="lg:col-span-2 space-y-6 order-1">
              
              <div className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/5 space-y-6">
                {/* Lesson meta tags */}
                <div className="flex flex-wrap gap-2 items-center">
                  {lesson.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-700"
                    >
                      #{tag}
                    </span>
                  ))}
                  <span className="text-xs text-slate-400 font-serif italic ml-auto">
                    nguồn: {lesson.sourceDomain}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-serif text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-800 leading-tight">
                  {lesson.title}
                </h1>

                {/* Progress bar today */}
                {!lesson.completed && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Tiến độ đọc hiểu bài viết</span>
                      <span className="font-mono text-xs text-slate-600">{checkedCount} / {totalTakeaways} ý đã tích chọn</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${readingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Takeaways bullet points list */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Điểm tóm tắt quan trọng (Tích chọn để đánh dấu đã đọc)
                  </h3>
                  <ul className="space-y-3 text-base leading-relaxed text-slate-700 font-serif">
                    {lesson.summary.map((point, index) => {
                      const isChecked = checkedTakeaways[index];
                      return (
                        <li
                          key={index}
                          onClick={() => {
                            if (lesson.completed) return; // lock if completed
                            const nextChecked = [...checkedTakeaways];
                            nextChecked[index] = !nextChecked[index];
                            setCheckedTakeaways(nextChecked);
                          }}
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isChecked 
                              ? "bg-indigo-50/20 border-indigo-100 text-slate-700" 
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={lesson.completed}
                            className={`h-6 w-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-150 ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}
                          >
                            {isChecked ? "✓" : index + 1}
                          </button>
                          <span className={`pt-0.5 select-none leading-relaxed text-sm ${isChecked ? "line-through text-slate-400" : ""}`}>
                            {point}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Actionable Step widget */}
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 space-y-2 shadow-sm mt-8">
                  <h3 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    ⚡ Hành động gợi ý hôm nay
                  </h3>
                  <p className="text-sm text-slate-700 font-serif italic leading-relaxed">
                    &quot;{lesson.actionableStep}&quot;
                  </p>
                </div>

              </div>

              {/* Assignment widget */}
              {assignment && (
                <div className="bg-white/85 border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/5 space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      📝 Bài tập tự luận ({assignment.type === "WRITING" ? "Viết" : "Nói/Phát âm"})
                    </h3>
                    {submission && (
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        submission.status === "GRADED" 
                          ? "bg-emerald-50 border-emerald-250 text-emerald-800" 
                          : "bg-amber-50 border-amber-250 text-amber-800"
                      }`}>
                        {submission.status === "GRADED" ? `Đã chấm: ${submission.score}/100` : "Đã nộp bài"}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đề bài</span>
                    <p className="text-xs text-slate-700 font-serif leading-relaxed italic">
                      &quot;{assignment.prompt}&quot;
                    </p>
                  </div>

                  {/* Submission Form */}
                  {(!submission || submission.status === "SUBMITTED") ? (
                    <form onSubmit={handleSubmitAssignment} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
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
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif bg-white/50 text-slate-700"
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
                        className="w-full text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition duration-200 disabled:opacity-50"
                      >
                        {submittingAssignment ? "Đang gửi..." : submission ? "Cập nhật bài nộp" : "Nộp bài làm tự luận"}
                      </button>
                    </form>
                  ) : (
                    // Graded Result Display
                    <div className="space-y-4 pt-3 border-t border-slate-100 text-xs leading-relaxed">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bài làm của bạn</span>
                        <p className="p-3 bg-slate-50 rounded-xl font-serif italic text-slate-600">{submission.content}</p>
                      </div>

                      {submission.grammarEdits && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-rose-800 uppercase tracking-widest block">Sửa lỗi ngữ pháp & câu từ</span>
                          <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl font-serif text-rose-800 whitespace-pre-wrap">{submission.grammarEdits}</div>
                        </div>
                      )}

                      {submission.comment && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-900 uppercase tracking-widest block">Nhận xét chi tiết</span>
                          <p className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-slate-700 italic">"{submission.comment}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-slate-100 mt-6">
                {lesson.completed ? (
                  <div className="space-y-4">
                    <div className="text-center text-xs font-serif italic text-slate-500">
                      Bạn đã hoàn thành bài học này hôm nay. Hãy tiếp tục ôn tập và ghi chú nhé!
                    </div>
                    <Link
                      href="/dashboard"
                      className="block w-full text-center py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition duration-200"
                    >
                      Quay lại Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Locked Quiz trigger link */}
                    <Link
                      href={isQuizUnlocked ? `/lessons/${lessonId}/quiz` : "#"}
                      onClick={(e) => {
                        if (!isQuizUnlocked) {
                          e.preventDefault();
                          alert("Vui lòng đọc và tích chọn hoàn thành tất cả các ý tóm tắt quan trọng để mở khóa Quiz nhé!");
                        }
                      }}
                      className={`block w-full text-center py-3.5 rounded-xl text-sm font-bold shadow-md transition duration-200 focus:outline-none ${
                        isQuizUnlocked
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-[1.01]"
                          : "bg-slate-200 text-slate-400 border border-slate-350 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {isQuizUnlocked ? "Làm trắc nghiệm củng cố (Kiếm điểm)" : "🔒 Tích chọn đủ Takeaways để mở khóa Quiz"}
                    </Link>

                    <button
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="w-full text-center py-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition duration-200 disabled:opacity-50 focus:outline-none"
                    >
                      {isSubmitting ? "Đang cập nhật..." : "Đọc xong (Không làm trắc nghiệm)"}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (1/3 Width) - Floating Ghi Chép cá nhân Notepad */}
            <div className="lg:col-span-1 space-y-6 order-2">
              <div className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-xl shadow-indigo-950/5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    📝 Ghi chép cá nhân
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 font-mono transition-all duration-200">
                    {savingNotes ? "🔄 Đang lưu..." : "✓ Đã lưu"}
                  </span>
                </div>
                
                <textarea
                  rows={15}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú nhanh các từ vựng mới, bài học thực tế rút ra, hoặc kế hoạch áp dụng bài học này của riêng bạn ở đây..."
                  className="w-full px-3.5 py-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif leading-relaxed text-slate-700 bg-white/50"
                />
                
                <p className="text-[10px] text-slate-400 leading-normal italic">
                  Nội dung ghi chép của bạn được tự động sao lưu an toàn trên hệ thống đám mây để ôn tập lại bất kỳ lúc nào.
                </p>
              </div>
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
