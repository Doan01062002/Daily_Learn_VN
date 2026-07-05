"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/AuthProvider";

export default function WeeklyArenaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [challenge, setChallenge] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz running states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);

  // API submit states
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch challenge on mount
  useEffect(() => {
    if (!user) return;

    const fetchChallenge = async () => {
      try {
        const res = await fetch("/api/challenges/active");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.challenge) {
            if (data.alreadyAttempted) {
              setError(`Bạn đã tham gia thử thách này tuần này rồi. Điểm số: ${data.attemptScore}/10.`);
            } else {
              setChallenge(data.challenge);
              setQuestions(data.questions || []);
            }
          } else {
            setError("Đấu trường tuần hiện đang đóng cửa. Vui lòng quay lại vào tối Chủ Nhật!");
          }
        } else {
          setError("Không thể kết nối tới đấu trường tuần.");
        }
      } catch (err) {
        console.error("Fetch challenge error:", err);
        setError("Lỗi mạng, không thể kết nối.");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [user]);

  // Timer countdown hook
  useEffect(() => {
    if (loading || error || quizFinished || questions.length === 0) return;

    // Start timer interval
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Mark unanswered and move to next
          clearInterval(timerRef.current!);
          handleNextQuestion("");
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, error, quizFinished, questions]);

  const handleNextQuestion = (selectedOption: string) => {
    // Save answer
    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers, [currentQ.id]: selectedOption };
    setAnswers(updatedAnswers);

    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentIndex + 1 < questions.length) {
      // Go to next
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(30);
    } else {
      // Last question completed - submit!
      setQuizFinished(true);
      submitResults(updatedAnswers);
    }
  };

  const submitResults = async (finalAnswers: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data);
        if (data.passed) {
          // Dynamic confetti trigger
          import("canvas-confetti").then((confetti) => {
            confetti.default({
              particleCount: 180,
              spread: 90,
              origin: { y: 0.55 },
            });
          });
        }
      } else {
        setError(data.error || "Gửi kết quả thất bại.");
      }
    } catch (err) {
      console.error("Submit challenge results error:", err);
      setError("Không thể gửi kết quả. Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic background lighting effects */}
      <div className="absolute top-[10%] left-[5%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[10%] right-[5%] w-[45%] h-[45%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: "12s" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#030308] to-black opacity-95 -z-10" />

      {/* Header Bar */}
      <header className="max-w-4xl w-[calc(100%-2rem)] mx-auto rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-6 py-3.5 flex justify-between items-center shadow-2xl mt-6 z-30">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition duration-200 border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 active:scale-95"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span> <span>Rời Đấu trường</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400">Đấu trường Live</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono animate-pulse">
              Đang kết nối cổng đấu trường...
            </p>
          </div>
        ) : error ? (
          <div className="p-2 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl max-w-md mx-auto">
            <div className="bg-[#0b0c16]/90 border border-white/5 rounded-[calc(2rem-0.5rem)] p-8 text-center space-y-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <div className="text-4xl">🥊</div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white leading-normal uppercase tracking-tight">Thông báo Đấu trường</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              </div>
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-4 w-full bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full pl-6 pr-2.5 py-2.5 text-xs font-black transition duration-300 shadow-lg cursor-pointer"
              >
                <span>Quay về Dashboard</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  ↗
                </span>
              </Link>
            </div>
          </div>
        ) : !quizFinished ? (
          /* Active Quiz layout */
          <div className="space-y-8 w-full">
            {/* Challenge Info Header */}
            <div className="text-center space-y-3">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-slate-400">
                {challenge.title}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[9px] bg-purple-500/10 text-purple-300 font-extrabold px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-widest font-mono">
                  Câu hỏi {currentIndex + 1} / {questions.length}
                </span>
                <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-widest font-mono ${
                  timeLeft <= 10
                    ? "bg-rose-500/10 text-rose-350 border-rose-500/20 animate-pulse"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }`}>
                  Thời gian: {timeLeft}s
                </span>
              </div>
            </div>

            {/* High-tech progress indicator bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-lg ${
                    timeLeft <= 10
                      ? "bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20 animate-pulse"
                      : "bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-indigo-500/20"
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card using Double-Bezel nested architecture */}
            {questions[currentIndex] && (
              <div className="p-2 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="bg-[#0b0c16]/90 border border-white/5 rounded-[calc(2rem-0.5rem)] p-8 sm:p-10 space-y-8 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  {/* Neon laser accent bar at top */}
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                  
                  <p className="text-base sm:text-lg font-bold leading-relaxed text-center text-slate-100">
                    {questions[currentIndex].question}
                  </p>

                  {/* Multiple choice options with hover physics */}
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {questions[currentIndex].options.map((option: string, oIdx: number) => {
                      const letters = ["A", "B", "C", "D"];
                      const letter = letters[oIdx] || "";
                      return (
                        <button
                          key={option}
                          onClick={() => handleNextQuestion(option)}
                          className="group w-full flex items-center justify-between text-left p-4.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-gradient-to-r hover:from-indigo-650/30 hover:to-purple-650/20 hover:border-indigo-400 text-xs sm:text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer active:scale-[0.98] shadow-sm select-none"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-slate-350 text-[11px] font-black font-mono flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:text-white transition duration-200 shrink-0">
                              {letter}
                            </span>
                            <span className="text-slate-200 group-hover:text-white transition-colors duration-200">
                              {option}
                            </span>
                          </div>
                          <span className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-indigo-400 transition-all duration-300 translate-x-2 group-hover:translate-x-0 text-indigo-400 text-xs font-bold font-mono">
                            →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Finished & results screen */
          <div className="w-full space-y-10">
            {submitting ? (
              <div className="p-2 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl max-w-sm mx-auto">
                <div className="bg-[#0b0c16]/90 border border-white/5 rounded-[calc(2rem-0.5rem)] p-8 text-center space-y-4">
                  <div className="relative w-10 h-10 flex items-center justify-center mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest animate-pulse">
                    Đang tính toán kết quả...
                  </p>
                </div>
              </div>
            ) : results ? (
              <div className="space-y-8">
                {/* Result Summary Card using Double-Bezel nested architecture */}
                <div className="p-2 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="bg-[#0b0c16]/90 border border-white/5 rounded-[calc(2rem-0.5rem)] p-8 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                    {/* Glowing effect inside */}
                    <div className="absolute -top-20 -left-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                      {/* Reactor core neon circle icon */}
                      <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg border relative ${
                        results.passed
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/20"
                      }`}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-current" style={{ animationDuration: "3s" }} />
                        {results.passed ? "🏆" : "⚡"}
                      </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                        {results.passed ? "Vượt Qua Thử Thách!" : "Cần Rèn Luyện Thêm!"}
                      </h3>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/5 font-mono text-sm">
                        Kết quả: <span className="text-indigo-400 font-extrabold">{results.score} / 10</span>
                      </div>
                      <div className="max-w-md mx-auto pt-2">
                        {results.passed ? (
                          <p className="text-xs text-emerald-400 font-semibold leading-relaxed">
                            🎉 Xuất sắc! Bạn đã vượt qua đấu trường trí tuệ và nhận ngay <strong className="text-white">+{results.pointsEarned}💎</strong> tích lũy vào hồ sơ học tập!
                          </p>
                        ) : (
                          <p className="text-xs text-slate-450 leading-relaxed">
                            Bạn cần trả lời đúng tối thiểu <strong className="text-amber-400">8 / 10</strong> câu hỏi để mở khóa phần thưởng. Hãy ôn luyện lại các kiến thức trong tuần và tự tin thử thách ở các tuần kế tiếp!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 relative z-10">
                      <Link
                        href="/dashboard"
                        className="group inline-flex items-center gap-4 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full pl-6 pr-2.5 py-2.5 text-xs font-black transition duration-300 shadow-lg shadow-indigo-500/15 active:scale-95 cursor-pointer"
                      >
                        <span>Quay lại Dashboard</span>
                        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:scale-105">
                          ↗
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Detailed Questions Review List */}
                <div className="space-y-5">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    Xem lại chi tiết bài làm
                  </h3>
                  <div className="space-y-5">
                    {results.details.map((q: any, idx: number) => (
                      <div
                        key={q.id}
                        className={`border p-6 rounded-2.5xl space-y-4 relative overflow-hidden transition-all duration-300 ${
                          q.isCorrect
                            ? "bg-emerald-950/20 border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                            : "bg-rose-950/20 border-rose-500/20 shadow-lg shadow-rose-500/5"
                        }`}
                      >
                        {/* Status bar side accent */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          q.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                        }`} />

                        <div className="flex justify-between items-start gap-4 pl-2">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                            q.isCorrect
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-350 border-rose-500/20"
                          }`}>
                            Câu hỏi {idx + 1}: {q.isCorrect ? "Đúng ✓" : "Sai ✗"}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed pl-2">{q.question}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pl-2">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1 font-mono">Lựa chọn của bạn:</span>
                            <span className={q.isCorrect ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                              {q.userAnswer || "❌ (Không trả lời)"}
                            </span>
                          </div>
                          {!q.isCorrect && (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1 font-mono">Đáp án đúng:</span>
                              <span className="text-emerald-400 font-extrabold">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>

                        {q.explanation && (
                          <div className="bg-slate-955/80 p-3.5 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed pl-2">
                            <strong className="text-slate-200 font-mono">Giải thích:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
