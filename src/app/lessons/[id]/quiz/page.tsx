"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return; // Lock options after submit
    setSelectedOption(option);
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <Link
          href={`/lessons/${lessonId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          <span>←</span> Quay lại bài học
        </Link>
        <span className="font-serif italic text-xs text-[#BFB8AC]">
          {showSummary ? "Kết quả" : `Câu hỏi ${currentIndex + 1}/${totalQuestions}`}
        </span>
      </header>

      {/* Main quiz view */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-between">
        
        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
          </div>
        ) : errorMsg && !quizzes.length ? (
          <div className="space-y-4 flex-1">
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center py-2.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold"
            >
              Về Dashboard
            </Link>
          </div>
        ) : showSummary ? (
          // SUMMARY SCREEN
          <div className="space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-6 text-center pt-8">
              <span className="text-5xl">🏆</span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#3E3A35] mt-4">
                Hoàn thành thử thách!
              </h1>
              
              <div className="py-6 px-4 bg-white border border-[#EBE6DD] rounded-2xl max-w-sm mx-auto shadow-sm space-y-2">
                <div className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">
                  Điểm số của bạn
                </div>
                <div className="text-4xl font-extrabold text-[#3E3A35]">
                  {finalScore}%
                </div>
                <div className="text-xs text-[#8C8375]">
                  Chính xác: <strong>{correctAnswersCount} / {totalQuestions}</strong> câu hỏi
                </div>
              </div>

              <p className="text-sm text-[#8C8375] max-w-xs mx-auto italic">
                {finalScore === 100 
                  ? "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi trắc nghiệm hôm nay."
                  : "Khá tốt! Hãy đọc kỹ tóm tắt để đạt điểm tối đa ở lần sau."}
              </p>
            </div>

            <div className="pt-8 border-t border-[#EBE6DD] mt-12">
              <button
                onClick={handleFinishQuiz}
                disabled={isFinishing}
                className="w-full text-center py-3.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm disabled:opacity-50 focus:outline-none"
              >
                {isFinishing ? "Đang xử lý..." : "Hoàn tất & Về Dashboard"}
              </button>
            </div>
          </div>
        ) : (
          // ACTIVE QUIZ INTERFACE
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Question Text */}
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3E3A35] leading-tight">
                {currentQuiz.question}
              </h2>

              {/* Options buttons */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-[#EBE6DD]">
                {currentQuiz.options.map((option) => {
                  const isSelected = selectedOption === option;
                  
                  // Color codes after submission
                  let btnStyle = "bg-white border-[#D5CFC5] text-[#4E4941] hover:border-[#8C8375] hover:bg-[#F9F7F4]";
                  
                  if (isSelected) {
                    btnStyle = "bg-[#4E4941] text-white border-[#4E4941]";
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
                      btnStyle = "bg-white border-[#EBE6DD] text-[#BFB8AC] opacity-50";
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

              {/* Error warning */}
              {errorMsg && (
                <div className="rounded-lg bg-[#FDF3F2] p-3 text-center text-xs text-[#D32F2F] border border-[#FBE3E1]">
                  {errorMsg}
                </div>
              )}

              {/* Explanation section after submit */}
              {isSubmitted && currentResult && (
                <div className="rounded-xl border border-[#EBE6DD] bg-[#FCFAF7] p-5 space-y-2 shadow-sm animate-fade-in mt-6">
                  <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-1.5">
                    {currentResult.isCorrect ? "✅ Chính xác" : "❌ Chưa đúng"} • Giải thích
                  </h3>
                  <p className="text-sm text-[#4E4941] font-serif italic leading-relaxed">
                    {currentResult.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Next/Submit Button Trigger */}
            <div className="pt-6 border-t border-[#EBE6DD] mt-8">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full text-center py-3.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm disabled:opacity-50 focus:outline-none"
                >
                  {isSubmitting ? "Đang chấm điểm..." : "Nộp đáp án"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full text-center py-3.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm focus:outline-none"
                >
                  {currentIndex === quizzes.length - 1 ? "Xem kết quả" : "Câu hỏi tiếp theo"}
                </button>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
