"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    fetchLessonDetail();
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
        <span className="font-serif italic text-xs text-[#BFB8AC]">Đọc tập trung</span>
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
    </div>
  );
}
