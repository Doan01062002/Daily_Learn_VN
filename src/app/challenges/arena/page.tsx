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
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);
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
          // Trigger custom CSS confetti particles
          const colors = ["#4F46E5", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
          const particles = Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            duration: 2 + Math.random() * 2.5,
            size: 6 + Math.random() * 8,
          }));
          setConfettiParticles(particles);
          setShowConfetti(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] text-white flex flex-col relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="max-w-4xl w-[calc(100%-2rem)] mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-3 flex justify-between items-center shadow-lg mt-4 z-20">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-350 hover:text-white transition duration-200 border border-white/10 px-3 py-2 rounded-xl hover:bg-white/5"
        >
          <span>←</span> <span>Rời Đấu trường</span>
        </Link>
        <span className="font-serif italic text-xs text-indigo-200">Đấu trường trí tuệ Tuần</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center z-20">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-6 max-w-md mx-auto shadow-2xl">
            <div className="text-4xl animate-pulse">🥊</div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white leading-normal">Thông báo từ Đấu trường</h3>
              <p className="text-xs text-slate-350 leading-relaxed">{error}</p>
            </div>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold transition duration-200 shadow-lg text-center"
            >
              Về Dashboard
            </Link>
          </div>
        ) : !quizFinished ? (
          /* Active Quiz layout */
          <div className="space-y-6 w-full">
            {/* Challenge Info Header */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-black tracking-tight">{challenge.title}</h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30 uppercase">
                  Câu hỏi {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase font-mono">
                  Thời gian: {timeLeft}s
                </span>
              </div>
            </div>

            {/* Radial countdown timer bar visual */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  timeLeft <= 10 ? "bg-rose-500" : "bg-indigo-500"
                }`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              ></div>
            </div>

            {/* Question Card */}
            {questions[currentIndex] && (
              <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <p className="text-base sm:text-lg font-bold leading-relaxed text-center">
                  {questions[currentIndex].question}
                </p>

                {/* Multiple choice options */}
                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {questions[currentIndex].options.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => handleNextQuestion(option)}
                      className="w-full text-left p-4 rounded-2xl border border-white/10 hover:border-indigo-400 bg-white/5 hover:bg-indigo-600/20 text-xs sm:text-sm font-semibold transition duration-150 cursor-pointer active:scale-[0.99]"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Finished & results screen */
          <div className="w-full space-y-8">
            {submitting ? (
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent mx-auto"></div>
                <p className="text-xs text-slate-350">Đang chấm điểm bài thi của bạn...</p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Result Summary Card */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="text-5xl">{results.passed ? "🏆" : "💪"}</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">{results.passed ? "Đạt Thử Thách Thành Công!" : "Cố Gắng Lần Sau!"}</h3>
                    <p className="text-xs text-slate-350">
                      Điểm số của bạn: <strong className="text-white text-base font-mono">{results.score} / 10</strong>
                    </p>
                    {results.passed ? (
                      <p className="text-xs text-emerald-400 font-bold">
                        🎉 Chúc mừng! Bạn trả lời chính xác {results.score} câu hỏi và nhận được +{results.pointsEarned}💎 vào ví tri thức!
                      </p>
                    ) : (
                      <p className="text-xs text-amber-400 font-medium">
                        Bạn cần tối thiểu 8 / 10 câu trả lời chính xác để nhận phần thưởng điểm tri thức. Hãy ôn tập kỹ và thử lại vào tuần tới!
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/dashboard"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-xs font-bold transition duration-200 shadow-md hover:scale-[1.02]"
                    >
                      Quay lại Dashboard
                    </Link>
                  </div>
                </div>

                {/* Detailed Questions Review List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Xem lại bài thi</h3>
                  <div className="space-y-4.5">
                    {results.details.map((q: any, idx: number) => (
                      <div
                        key={q.id}
                        className={`border p-6 rounded-2xl space-y-3.5 relative overflow-hidden ${
                          q.isCorrect ? "bg-emerald-500/5 border-emerald-500/30" : "bg-rose-500/5 border-rose-500/30"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            q.isCorrect ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            Câu hỏi {idx + 1}: {q.isCorrect ? "Đúng" : "Sai"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-100">{q.question}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] text-slate-450 uppercase tracking-widest block mb-0.5">Câu trả lời của bạn:</span>
                            <span className={q.isCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-semibold"}>
                              {q.userAnswer || "(Không trả lời)"}
                            </span>
                          </div>
                          {!q.isCorrect && (
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                              <span className="text-[9px] text-slate-455 uppercase tracking-widest block mb-0.5">Đáp án đúng:</span>
                              <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>

                        {q.explanation && (
                          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-[11px] text-slate-350 leading-relaxed">
                            <strong>Giải thích:</strong> {q.explanation}
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
      {/* Confetti Render */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
          {confettiParticles.map((p: any) => (
            <div
              key={p.id}
              className="confetti-particle"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-particle {
          position: fixed;
          top: -20px;
          z-index: 999;
          border-radius: 2px;
          animation-name: fall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `}} />
    </div>
  );
}
