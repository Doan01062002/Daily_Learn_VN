"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/FeedbackModal";
import simulatorsData from "@/data/simulators.json";

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

  // Reading theme switcher states
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");

  // Simulator states
  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState("start");
  const [simMeters, setSimMeters] = useState<any[]>([]);
  const [simHistory, setSimHistory] = useState<string[]>([]);
  const [simFinished, setSimFinished] = useState(false);
  const [simScore, setSimScore] = useState(0);

  // Prompt Practice states
  const [promptInput, setPromptInput] = useState("");
  const [promptTested, setPromptTested] = useState(false);
  const [promptScore, setPromptScore] = useState(0);
  const [promptFeedback, setPromptFeedback] = useState<any | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Get simulator configuration if matching this lesson title
  const simulatorConfig = lesson ? (simulatorsData as any)[lesson.title] : null;

  useEffect(() => {
    if (simulatorConfig) {
      setSimMeters(JSON.parse(JSON.stringify(simulatorConfig.meters)));
      setSimStage("start");
      setSimFinished(false);
      setSimActive(false);
      setSimHistory([]);
    }
  }, [lesson]);

  const handleSimChoice = (option: any) => {
    setSimHistory((prev) => [...prev, `👉 Bạn chọn: "${option.text}"`, `💬 ${option.effectText}`]);

    let isGameOver = false;
    const updatedMeters = simMeters.map((m) => {
      const change = option.changes[m.id] || 0;
      const newVal = Math.min(100, Math.max(0, m.val + change));
      if (newVal <= 0) {
        isGameOver = true;
      }
      return { ...m, val: newVal };
    });
    setSimMeters(updatedMeters);

    if (isGameOver) {
      setSimStage("game_over");
      setSimFinished(true);
      setSimScore(0);
      return;
    }

    const next = option.nextStage;
    setSimStage(next);

    const stageConfig = simulatorConfig.stages[next];
    if (stageConfig && stageConfig.isTerminal) {
      setSimFinished(true);
      setSimScore(stageConfig.score);
    }
  };

  const handleTestPrompt = () => {
    if (!promptInput.trim()) return;

    const text = promptInput.toLowerCase();
    
    // Check components
    const hasRole = text.includes("vai trò") || text.includes("bạn là") || text.includes("acting as") || text.includes("đóng vai") || text.includes("chuyên gia") || text.includes("expert");
    const hasConstraints = text.includes("không") || text.includes("tránh") || text.includes("chỉ") || text.includes("yêu cầu") || text.includes("ràng buộc") || text.includes("must not") || text.includes("only");
    const hasFormat = text.includes("định dạng") || text.includes("markdown") || text.includes("json") || text.includes("bảng") || text.includes("table") || text.includes("output");
    const hasExample = text.includes("ví dụ") || text.includes("như sau") || text.includes("mẫu") || text.includes("example") || text.includes("sau đây");
    const wordsCount = promptInput.trim().split(/\s+/).length;
    const isLongEnough = wordsCount >= 25;

    let score = 0;
    const criteria = [];

    if (hasRole) { score += 20; criteria.push({ name: "Vai trò / Bối cảnh (Role/Context)", pass: true }); }
    else { criteria.push({ name: "Vai trò / Bối cảnh (Role/Context)", pass: false, tip: "Mên mô tả vai trò cụ thể, ví dụ: 'Bạn là chuyên gia về...'" }); }

    if (hasConstraints) { score += 20; criteria.push({ name: "Ràng buộc & Giới hạn (Constraints)", pass: true }); }
    else { criteria.push({ name: "Ràng buộc & Giới hạn (Constraints)", pass: false, tip: "Nên thêm các giới hạn, ví dụ: 'Đoạn văn không quá 200 từ...'" }); }

    if (hasFormat) { score += 20; criteria.push({ name: "Định dạng đầu ra (Output Format)", pass: true }); }
    else { criteria.push({ name: "Định dạng đầu ra (Output Format)", pass: false, tip: "Nên yêu cầu định dạng đầu ra cụ thể, ví dụ: 'Xuất kết quả dạng bảng...'" }); }

    if (hasExample) { score += 20; criteria.push({ name: "Ví dụ minh họa (Few-Shot Example)", pass: true }); }
    else { criteria.push({ name: "Ví dụ minh họa (Few-Shot Example)", pass: false, tip: "Nên cung cấp 1 ví dụ cụ thể dạng: 'Ví dụ: Đầu vào X -> Đầu ra Y'" }); }

    if (isLongEnough) { score += 20; criteria.push({ name: "Mức độ chi tiết (>25 từ)", pass: true }); }
    else { criteria.push({ name: "Mức độ chi tiết (>25 từ)", pass: false, tip: "Prompt hiện tại hơi ngắn, nên mô tả thêm chi tiết ngữ cảnh để AI hiểu sâu." }); }

    setPromptScore(score);
    setPromptTested(true);
    setPromptFeedback({
      criteria,
      wordCount: wordsCount,
      advice: score === 100 
        ? "Xuất sắc! Prompt của bạn đã đạt tiêu chuẩn chuyên nghiệp, sẵn sàng gửi cho bất kỳ AI nào."
        : "Khá tốt! Bạn hãy tham khảo các gợi ý tích đỏ ở trên để hoàn thiện thêm prompt nhé."
    });
  };

  const getPromptChallenge = () => {
    if (!lesson) return "";
    if (lesson.tags.includes("Tech")) {
      return `Viết một prompt yêu cầu AI tạo ra cấu trúc API và sơ đồ database tối giản cho đối tượng '${lesson.title}'.`;
    }
    if (lesson.tags.includes("Business")) {
      return `Viết một prompt yêu cầu AI thiết kế mô hình Unit Economics hoặc phân tích đối thủ cạnh tranh cho chủ đề '${lesson.title}'.`;
    }
    if (lesson.tags.includes("Design")) {
      return `Viết một prompt yêu cầu AI phân tích khoảng cách và tư vấn bảng màu (Color Palette) tinh giản cho chủ đề '${lesson.title}'.`;
    }
    return `Viết một prompt yêu cầu AI tóm tắt bài viết '${lesson.title}' dưới dạng sơ đồ tư duy dạng text Markdown.`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("reading-theme");
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "sepia") {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: "light" | "dark" | "sepia") => {
    setTheme(newTheme);
    localStorage.setItem("reading-theme", newTheme);
  };

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
    <div className={`min-h-screen flex flex-col relative overflow-hidden theme-container ${theme}`}>
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-200/15 blur-[120px] pointer-events-none"></div>

      {/* Focused Navigation Header - Floating design */}
      <header className="sticky top-4 z-40 max-w-7xl w-[calc(100%-2rem)] mx-auto rounded-2xl border px-5 py-3 flex justify-between items-center shadow-lg shadow-indigo-950/5 mt-4 transition-all duration-300 theme-header">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold transition-all duration-200 border border-[#D5CFC5]/85 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-slate-800/50 hover:scale-[1.03] active:scale-[0.96] shadow-sm theme-muted"
        >
          <span>←</span> <span className="hidden sm:inline">Quay lại Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Theme Switcher Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border theme-input text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.96] cursor-pointer shadow-sm">
              <span>{theme === "light" ? "☀️ Sáng" : theme === "dark" ? "🌙 Tối" : "📜 Cổ điển"}</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-32 theme-card border rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 p-1 space-y-1">
              <button
                onClick={() => changeTheme("light")}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#F0ECE4]/50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>☀️</span> Sáng
              </button>
              <button
                onClick={() => changeTheme("dark")}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-150/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🌙</span> Tối
              </button>
              <button
                onClick={() => changeTheme("sepia")}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-150/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>📜</span> Cổ điển
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-250 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.96] cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            Báo cáo lỗi
          </button>
          <span className="font-serif italic text-xs bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-slate-150 theme-muted">Đọc tập trung</span>
        </div>
      </header>

      {/* Main Focus Reading Responsive Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 z-20">
        
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 w-full relative overflow-hidden">
            {/* Shimmer animation style definition keyframe */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
              .animate-shimmer {
                animation: shimmer 1.6s infinite;
              }
            `}} />

            {/* Left Column Shimmer (2/3 width) */}
            <div className="lg:col-span-2 space-y-6 relative overflow-hidden bg-white/70 border border-[#EBE6DD] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-205/20 to-transparent animate-shimmer" style={{ animation: 'shimmer 1.6s infinite' }} />
              {/* Meta tags shimmer */}
              <div className="flex gap-2 mb-4">
                <div className="h-5 w-16 bg-[#F0ECE4] rounded-full" />
                <div className="h-5 w-24 bg-[#F0ECE4] rounded-full" />
              </div>
              {/* Title shimmer */}
              <div className="space-y-2.5">
                <div className="h-8 w-3/4 bg-[#F0ECE4] rounded-md" />
                <div className="h-8 w-1/2 bg-slate-150 rounded-md" />
              </div>
              {/* Takeaways lines shimmer */}
              <div className="space-y-4 pt-6 border-t border-[#EBE6DD]">
                <div className="h-4 w-1/4 bg-[#F0ECE4] rounded" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-[#EBE6DD]/50 bg-white/50 space-y-2">
                    <div className="h-6 w-6 rounded-lg bg-[#F0ECE4] shrink-0" />
                    <div className="space-y-2 flex-1 pt-1">
                      <div className="h-4 w-full bg-[#F0ECE4] rounded" />
                      <div className="h-4 w-5/6 bg-[#F0ECE4] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Shimmer (1/3 width) */}
            <div className="lg:col-span-1 space-y-6 relative overflow-hidden bg-white/70 border border-[#EBE6DD] rounded-3xl p-6 shadow-sm">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-205/20 to-transparent animate-shimmer" style={{ animation: 'shimmer 1.6s infinite' }} />
              <div className="h-6 w-1/3 bg-[#F0ECE4] rounded mb-4" />
              <div className="h-32 bg-[#F0ECE4] rounded-xl" />
              <div className="h-10 bg-slate-150 rounded-xl mt-6" />
            </div>
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
              
              <div className="backdrop-blur-md border rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/5 space-y-6 theme-card">
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
                  <span className="text-xs font-serif italic ml-auto theme-muted">
                    nguồn: {lesson.sourceDomain}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-serif text-2xl sm:text-3.5xl font-bold tracking-tight leading-tight theme-text">
                  {lesson.title}
                </h1>

                {/* Progress bar today */}
                {!lesson.completed && (
                  <div className="mt-4 pt-4 border-t border-[#EBE6DD]/60 dark:border-slate-800">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2 theme-muted">
                      <span>Tiến độ đọc hiểu bài viết</span>
                      <span className="font-mono text-xs theme-text">{checkedCount} / {totalTakeaways} ý đã tích chọn</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE4] dark:bg-slate-850 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${readingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Takeaways bullet points list */}
                <div className="space-y-4 pt-4 border-t border-[#EBE6DD] dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider theme-muted">
                    Điểm tóm tắt quan trọng (Tích chọn để đánh dấu đã đọc)
                  </h3>
                  <ul className="space-y-3 text-base leading-relaxed font-serif theme-text">
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
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                            isChecked 
                              ? "bg-indigo-500/10 border-indigo-500/50" 
                              : "theme-card border hover:bg-indigo-500/5"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={lesson.completed}
                            className={`h-6 w-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-150 active:scale-90 ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-[#D5CFC5] text-slate-400"
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
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2 shadow-sm mt-8">
                  <h3 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                    Hành động gợi ý hôm nay
                  </h3>
                  <p className="text-sm font-serif italic leading-relaxed theme-text">
                    &quot;{lesson.actionableStep}&quot;
                  </p>
                </div>

              </div>

              {/* Assignment widget */}
              {assignment && (
                <div className="border rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/5 space-y-4 font-sans theme-card">
                  <div className="flex items-center justify-between border-b border-[#EBE6DD] dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 theme-muted">
                      <svg className="w-3.5 h-3.5 text-[#8C8375]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      Bài tập tự luận ({assignment.type === "WRITING" ? "Viết" : "Nói/Phát âm"})
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
                    <span className="text-[9px] font-bold uppercase tracking-widest theme-muted">Đề bài</span>
                    <p className="text-xs font-serif leading-relaxed italic theme-text">
                      &quot;{assignment.prompt}&quot;
                    </p>
                  </div>

                  {/* Submission Form */}
                  {(!submission || submission.status === "SUBMITTED") ? (
                    <form onSubmit={handleSubmitAssignment} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold uppercase tracking-widest theme-muted">
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
                          className="w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif theme-input"
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
                    <div className="space-y-4 pt-3 border-t border-[#EBE6DD] dark:border-slate-800 text-xs leading-relaxed">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest theme-muted">Bài làm của bạn</span>
                        <p className="p-3 bg-[#F0ECE4]/50 dark:bg-slate-850/50 rounded-xl font-serif italic theme-text">{submission.content}</p>
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
                          <p className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-[#3E3A35] italic">"{submission.comment}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Case-Study Simulator widget */}
              {simulatorConfig && (
                <div className="border border-[#EBE6DD] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 bg-[#FAF8F5]/30 theme-card">
                  <div className="flex justify-between items-center border-b border-[#EBE6DD] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 theme-text">
                      🎮 Giả lập Tình huống Quyết định (Simulator)
                    </h3>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Thử thách
                    </span>
                  </div>

                  {!simActive ? (
                    <div className="space-y-4 text-center py-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Bài viết này đi kèm kịch bản giả lập giúp bạn rèn luyện đưa ra quyết định thực tế của một Kỹ sư / Nhà quản trị.
                      </p>
                      <button
                        onClick={() => setSimActive(true)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                      >
                        Bắt đầu giả lập quyết định
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Meters status bar */}
                      <div className="grid grid-cols-3 gap-3">
                        {simMeters.map((m) => (
                          <div key={m.id} className="p-3 bg-white/70 border border-[#EBE6DD] rounded-2xl text-center space-y-1.5 shadow-sm">
                            <span className="text-lg block">{m.icon}</span>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{m.name}</span>
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="h-1.5 w-12 sm:w-16 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    m.val <= 30 ? "bg-red-500" : m.val <= 60 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${m.val}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold font-mono">{m.val}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Scenario console log and text */}
                      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 font-mono text-[11px] leading-relaxed space-y-3 max-h-56 overflow-y-auto">
                        <div className="text-indigo-300">== CONSOLE KHỞI TẠO HỆ THỐNG ==</div>
                        {simHistory.map((h, i) => (
                          <div key={i} className={h.startsWith("👉") ? "text-amber-300" : "text-slate-350"}>
                            {h}
                          </div>
                        ))}
                        
                        {!simFinished && (
                          <div className="text-slate-100 font-bold border-t border-slate-800 pt-2.5">
                            {simulatorConfig.stages[simStage]?.text}
                          </div>
                        )}

                        {simFinished && (
                          <div className={`text-center font-bold text-[11px] p-2.5 rounded-xl ${
                            simScore >= 70 ? "text-emerald-400 border border-emerald-900 bg-emerald-950/20" : "text-red-400 border border-red-900 bg-red-950/20"
                          }`}>
                            {simStage === "game_over" || simStage === "stage_fail"
                              ? "❌ GAME OVER: Bạn đã thất bại khi xử lý kịch bản này!"
                              : `🎉 THÀNH CÔNG: Hoàn thành kịch bản! Điểm số: ${simScore}/100`}
                          </div>
                        )}
                      </div>

                      {/* Decisions controls */}
                      {!simFinished ? (
                        <div className="space-y-2">
                          {simulatorConfig.stages[simStage]?.options.map((opt: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleSimChoice(opt)}
                              className="w-full text-left p-3.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-semibold hover:bg-slate-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                            >
                              {idx === 0 ? "A" : "B"}. {opt.text}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSimStage("start");
                            setSimMeters(JSON.parse(JSON.stringify(simulatorConfig.meters)));
                            setSimHistory([]);
                            setSimFinished(false);
                            setSimScore(0);
                          }}
                          className="w-full py-2.5 rounded-xl border border-[#D5CFC5] text-xs font-bold text-slate-650 hover:bg-[#F9F7F4] transition-all duration-200 active:scale-98"
                        >
                          Chơi lại giả lập
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Engineering Practice widget */}
              {lesson && (
                <div className="border border-[#EBE6DD] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 bg-[#FAF8F5]/30 theme-card">
                  <div className="flex justify-between items-center border-b border-[#EBE6DD] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 theme-text">
                      💡 Thực hành viết Prompt AI (Prompt Engineering)
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-2.5">
                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Thử thách viết Prompt</span>
                      <p className="text-xs font-serif italic text-slate-700 leading-relaxed">
                        {getPromptChallenge()}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Thiết kế Prompt của bạn</label>
                      <textarea
                        rows={4}
                        value={promptInput}
                        onChange={(e) => {
                          setPromptInput(e.target.value);
                          setPromptTested(false);
                        }}
                        placeholder="Ví dụ: Bạn là một chuyên gia RESTful API. Hãy phân tích bối cảnh... Ràng buộc là... Hãy định dạng đầu ra dạng bảng Markdown như sau..."
                        className="w-full px-3 py-2.5 text-xs border border-[#EBE6DD] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-slate-800"
                      />
                    </div>

                    <button
                      onClick={handleTestPrompt}
                      disabled={!promptInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-[#4E4941] text-white text-xs font-bold hover:bg-[#3E3A35] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
                    >
                      Đánh giá & Chấm điểm Prompt
                    </button>

                    {promptTested && promptFeedback && (
                      <div className="space-y-3.5 border-t border-[#EBE6DD] pt-4 animate-fade-in-up">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">Điểm số Prompt:</span>
                          <span className={`text-xs font-extrabold font-mono rounded px-2.5 py-0.5 border ${
                            promptScore >= 80 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : promptScore >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}>
                            {promptScore} / 100
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {promptFeedback.criteria.map((c: any, i: number) => (
                            <div key={i} className="flex flex-col space-y-1 bg-white/70 border border-[#EBE6DD]/60 rounded-xl p-2.5 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className={c.pass ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                                  {c.pass ? "✓" : "✗"}
                                </span>
                                <span className="font-semibold text-slate-700">{c.name}</span>
                              </div>
                              {!c.pass && (
                                <p className="text-[10px] text-rose-700 pl-4">{c.tip}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic bg-[#FAF8F5] border border-[#EBE6DD] p-3 rounded-xl text-center">
                          {promptFeedback.advice}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-[#EBE6DD] dark:border-slate-800 mt-6">
                {lesson.completed ? (
                  <div className="space-y-4">
                    <div className="text-center text-xs font-serif italic theme-muted">
                      Bạn đã hoàn thành bài học này hôm nay. Hãy tiếp tục ôn tập và ghi chú nhé!
                    </div>
                    <Link
                      href="/dashboard"
                      className="block w-full text-center py-3 rounded-xl border text-sm font-semibold transition-all duration-200 theme-input hover:scale-[1.02] active:scale-[0.97] shadow-sm"
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
                          showToast("Vui lòng đọc và tích chọn hoàn thành tất cả các ý tóm tắt quan trọng để mở khóa Quiz nhé!");
                        }
                      }}
                      className={`block w-full text-center py-3.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 focus:outline-none ${
                        isQuizUnlocked
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-[1.02] active:scale-[0.97]"
                          : "bg-slate-200 text-slate-400 border border-slate-350 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {isQuizUnlocked ? "Làm trắc nghiệm củng cố (Kiếm điểm)" : "🔒 Tích chọn đủ Takeaways để mở khóa Quiz"}
                    </Link>
 
                    <button
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="w-full text-center py-3 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 focus:outline-none theme-input hover:scale-[1.02] active:scale-[0.97]"
                    >
                      {isSubmitting ? "Đang cập nhật..." : "Đọc xong (Không làm trắc nghiệm)"}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (1/3 Width) - Floating Ghi Chép cá nhân Notepad */}
            <div className="lg:col-span-1 space-y-6 order-2">
              <div className="backdrop-blur-md border rounded-3xl p-6 shadow-xl shadow-indigo-950/5 space-y-4 theme-card">
                <div className="flex justify-between items-center border-b border-[#EBE6DD] dark:border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 theme-text">
                    <svg className="w-3.5 h-3.5 text-[#8C8375]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    Ghi chép cá nhân
                  </h3>
                  <span className="text-[10px] font-bold font-mono transition-all duration-200 theme-muted">
                    {savingNotes ? "🔄 Đang lưu..." : "✓ Đã lưu"}
                  </span>
                </div>
                
                <textarea
                  rows={15}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú nhanh các từ vựng mới, bài học thực tế rút ra, hoặc kế hoạch áp dụng bài học này của riêng bạn ở đây..."
                  className="w-full px-3.5 py-3.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif leading-relaxed theme-input"
                />
                
                <p className="text-[10px] leading-normal italic theme-muted">
                  Nội dung ghi chép của bạn được tự động sao lưu an toàn trên hệ thống đám mây để ôn tập lại bất kỳ lúc nào.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up bg-[#3E3A35] text-[#FAF8F5] border border-stone-700/80 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 max-w-sm">
          <span className="text-sm">🔔</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        lessonId={lessonId}
      />
    </div>
  );
}
