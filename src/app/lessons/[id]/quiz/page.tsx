"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/FeedbackModal";

interface QuizItem {
  id: string;
  question: string;
  options: string[];
}

interface CheckedQuizResult {
  quizId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lessonId } = use(params);
  const { user, refreshSession } = useAuth();
  const router = useRouter();

  // State
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // 30s Countdown timer states
  const [timeLeft, setTimeLeft] = useState(30);

  // Confetti states
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<
    Array<{ id: number; left: number; delay: number; color: string; duration: number; size: number }>
  >([]);

  // Results tracking
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Array<{ quizId: string; selectedAnswer: string }>
  >([]);
  const [checkedResults, setCheckedResults] = useState<Record<string, CheckedQuizResult>>({});
  
  // Summary tracking
  const [showSummary, setShowSummary] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchQuizzes = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/quiz`);
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.quizzes);
        } else {
          setErrorMsg("Không thể tải câu hỏi trắc nghiệm của bài học.");
        }
      } catch (error) {
        console.error("Error loading quizzes:", error);
        setErrorMsg("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [lessonId, user]);

  // Countdown timer interval hook
  useEffect(() => {
    if (loading || showSummary || isSubmitted || quizzes.length === 0) return;

    setTimeLeft(30);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isSubmitted, showSummary, loading, quizzes.length]);

  // Confetti effect hook when 100% score is achieved
  useEffect(() => {
    if (showSummary && finalScore === 100) {
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
  }, [showSummary, finalScore]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return; // Lock options after submit
    setSelectedOption(option);
  };

  const handleTimeOut = async () => {
    const currentQuiz = quizzes[currentIndex];
    const optionToSubmit = selectedOption || ""; // submit currently selected or empty
    const newAnswers = [
      ...submittedAnswers,
      { quizId: currentQuiz.id, selectedAnswer: optionToSubmit },
    ];

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: newAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        const currentResult = data.results.find(
          (r: CheckedQuizResult) => r.quizId === currentQuiz.id
        );

        if (currentResult) {
          setCheckedResults((prev) => ({
            ...prev,
            [currentQuiz.id]: currentResult,
          }));
        }

        setSubmittedAnswers(newAnswers);
        setIsSubmitted(true);
        setErrorMsg("Hết giờ! Đáp án đã được tự động nộp.");

        if (currentIndex === quizzes.length - 1) {
          setFinalScore(data.score);
          setCorrectAnswersCount(data.correctAnswersCount);
        }
      }
    } catch (error) {
      console.error("Timeout submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || isSubmitting) return;

    const currentQuiz = quizzes[currentIndex];
    const newAnswers = [
      ...submittedAnswers,
      { quizId: currentQuiz.id, selectedAnswer: selectedOption },
    ];

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: newAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Find the result for the current quiz
        const currentResult = data.results.find(
          (r: CheckedQuizResult) => r.quizId === currentQuiz.id
        );

        if (currentResult) {
          setCheckedResults((prev) => ({
            ...prev,
            [currentQuiz.id]: currentResult,
          }));
        }

        setSubmittedAnswers(newAnswers);
        setIsSubmitted(true);

        // If it's the last question, store final scoring metrics
        if (currentIndex === quizzes.length - 1) {
          setFinalScore(data.score);
          setCorrectAnswersCount(data.correctAnswersCount);
        }
      } else {
        setErrorMsg("Nộp đáp án thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Failed to submit quiz answer:", error);
      setErrorMsg("Lỗi kết nối mạng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption("");
      setIsSubmitted(false);
      setErrorMsg(null);
    } else {
      setShowSummary(true);
    }
  };

  const handleFinishQuiz = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        if (refreshSession) {
          await refreshSession();
        }
        router.push("/dashboard");
      } else {
        setErrorMsg("Không thể cập nhật trạng thái hoàn thành bài học.");
        setIsFinishing(false);
      }
    } catch (error) {
      console.error("Error completing lesson after quiz:", error);
      setErrorMsg("Lỗi kết nối máy chủ khi hoàn tất bài học.");
      setIsFinishing(false);
    }
  };

  if (!user) return null;

  const currentQuiz = quizzes[currentIndex];
  const totalQuestions = quizzes.length;
  const currentResult = currentQuiz ? checkedResults[currentQuiz.id] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#FFFFFF] to-[#F5EFFF] text-slate-800 flex flex-col relative overflow-hidden">
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

      {/* Confetti Render */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
          {confettiParticles.map((p) => (
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

      {/* Decorative background shapes for extra depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-200/15 blur-[120px] pointer-events-none"></div>

      {/* Focused Navigation Header - Floating design */}
      <header className="sticky top-4 z-40 max-w-5xl w-[calc(100%-2rem)] mx-auto rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md px-5 py-3 flex justify-between items-center shadow-lg shadow-indigo-950/5 mt-4 transition-all duration-300">
        <Link
          href={`/lessons/${lessonId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition duration-200 border border-slate-200/85 px-3 py-2 rounded-xl hover:bg-slate-50"
        >
          <span>←</span> <span className="hidden sm:inline">Quay lại bài học</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-250 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition duration-150 cursor-pointer"
          >
            📬 Báo cáo lỗi
          </button>
          <span className="font-serif italic text-xs text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">
            {showSummary ? "Kết quả" : `Câu hỏi ${currentIndex + 1}/${totalQuestions}`}
          </span>
        </div>
      </header>

      {/* Main quiz view */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-center z-20">
        
        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : errorMsg && !quizzes.length ? (
          <div className="space-y-4 flex-1">
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 border border-red-100">
              {errorMsg}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition duration-200"
            >
              Về Dashboard
            </Link>
          </div>
        ) : showSummary ? (
          // SUMMARY SCREEN
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-8 shadow-xl shadow-indigo-950/5 space-y-8 text-center">
            <div className="space-y-4">
              <span className="text-5xl block animate-bounce">🏆</span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-800 mt-4">
                Hoàn thành thử thách!
              </h1>
              
              <div className="py-6 px-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl max-w-xs mx-auto shadow-inner space-y-2">
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                  Điểm số của bạn
                </div>
                <div className="text-4xl font-extrabold text-slate-800 font-mono">
                  {finalScore}%
                </div>
                <div className="text-xs text-slate-500">
                  Chính xác: <strong>{correctAnswersCount} / {totalQuestions}</strong> câu hỏi
                </div>
              </div>

              <p className="text-sm text-slate-600 max-w-xs mx-auto italic pt-2">
                {finalScore === 100 
                  ? "Tuyệt vời! Bạn đã xuất sắc trả lời đúng tất cả các câu hỏi hôm nay. 💎 +10 Điểm tri thức đã được cộng!"
                  : "Khá tốt! Hãy đọc kỹ tóm tắt để đạt điểm tối đa ở lần sau nhé."}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={handleFinishQuiz}
                disabled={isFinishing}
                className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md transition duration-200 disabled:opacity-50 focus:outline-none"
              >
                {isFinishing ? "Đang xử lý..." : "Hoàn tất & Về Dashboard"}
              </button>
            </div>
          </div>
        ) : (
          // ACTIVE QUIZ INTERFACE
          <div className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/5 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Question Countdown Timer Progress Bar */}
              {!isSubmitted && (
                <div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        timeLeft <= 10 ? "bg-red-500 animate-pulse" : "bg-indigo-600"
                      }`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Thời gian làm câu hỏi</span>
                    <span className={timeLeft <= 10 ? "text-red-500 font-mono text-xs animate-pulse" : "font-mono text-xs text-slate-500"}>
                      {timeLeft} giây
                    </span>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-800 leading-tight">
                {currentQuiz.question}
              </h2>

              {/* Options buttons */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-slate-100">
                {currentQuiz.options.map((option) => {
                  const isSelected = selectedOption === option;
                  
                  // Default option styling
                  let btnStyle = "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50";
                  
                  if (isSelected) {
                    btnStyle = "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10";
                  }

                  if (isSubmitted && currentResult) {
                    const isCorrectAnswer = option.trim().toLowerCase() === currentResult.correctAnswer.trim().toLowerCase();
                    
                    if (isCorrectAnswer) {
                      // Correct option - always highlight green
                      btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold";
                    } else if (isSelected && !currentResult.isCorrect) {
                      // Selected incorrect option - highlight red
                      btnStyle = "bg-rose-50 border-rose-500 text-rose-800 font-semibold";
                    } else {
                      // Other options
                      btnStyle = "bg-white border-slate-100 text-slate-300 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(option)}
                      disabled={isSubmitted}
                      className={`w-full text-left px-4 py-4 rounded-xl border transition duration-200 focus:outline-none ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Error warning / Timeout auto-submit notice */}
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-3 text-center text-xs text-red-600 border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* Explanation section after submit */}
              {isSubmitted && currentResult && (
                <div className={`rounded-2xl border p-5 mt-6 space-y-2.5 shadow-sm animate-fade-in ${
                  currentResult.isCorrect 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                    : "bg-rose-50/50 border-rose-100 text-rose-800"
                }`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {currentResult.isCorrect ? "✅ Chính xác" : "❌ Chưa chính xác"} • Giải thích chi tiết
                  </h3>
                  <p className={`text-sm leading-relaxed font-serif italic ${
                    currentResult.isCorrect ? "text-emerald-700" : "text-rose-700"
                  }`}>
                    {currentResult.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Next/Submit Button Trigger */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full text-center py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/10 transition duration-200 disabled:opacity-50 focus:outline-none"
                >
                  {isSubmitting ? "Đang chấm điểm..." : "Nộp đáp án"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md transition duration-200 focus:outline-none"
                >
                  {currentIndex === quizzes.length - 1 ? "Xem kết quả" : "Câu hỏi tiếp theo"}
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        lessonId={lessonId}
        quizId={quizzes[currentIndex]?.id}
      />
    </div>
  );
}

