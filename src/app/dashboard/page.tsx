"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";

interface LessonFeedItem {
  id: string;
  title: string;
  tags: string[];
  sourceDomain: string;
  summary: string[];
  actionableStep: string;
  level: string;
  completed: boolean;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [lessons, setLessons] = useState<LessonFeedItem[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTodayLessons = async () => {
      try {
        const res = await fetch("/api/lessons/today");
        if (res.ok) {
          const data = await res.json();
          setLessons(data.lessons);
        } else {
          setErrorMsg("Không thể tải danh sách bài học hôm nay.");
        }
      } catch (error) {
        console.error("Error loading today lessons:", error);
        setErrorMsg("Lỗi kết nối máy chủ.");
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchTodayLessons();
  }, [user]);

  if (!user) return null;

  // Count progress
  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const isFinishedToday = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header Layout */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#8C8375]"></span>
          <span className="font-serif font-bold text-lg tracking-wide">Daily Learn VN</span>
        </div>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
            alt="Avatar"
            className="h-8 w-8 rounded-full border border-[#D5CFC5]"
          />
          <button
            onClick={logout}
            className="text-xs font-semibold text-[#8C8375] hover:text-[#3E3A35] border border-[#D5CFC5] px-3 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition duration-200"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Banner Upgrade Premium */}
        {user.role === "STUDENT" && (
          <div className="rounded-2xl border border-[#EBE6DD] bg-[#FAF2EB] p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-1.5">
                👑 Mở khóa giới hạn Premium
              </h3>
              <p className="text-sm text-[#4E4941] font-serif italic mt-1 leading-normal">
                Học không giới hạn bài học hằng ngày, tự tạo chủ đề nâng cao và làm trắc nghiệm chuyên sâu.
              </p>
            </div>
            <Link
              href="/checkout"
              className="bg-[#4E4941] text-white hover:bg-[#3E3A35] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition duration-200 shrink-0"
            >
              Nâng cấp
            </Link>
          </div>
        )}

        {/* Streak & Header Section */}
        <div className="rounded-2xl border border-[#EBE6DD] bg-[#FCFAF7] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
              alt="User"
              className="h-14 w-14 rounded-full border-2 border-[#8C8375]"
            />
            <div>
              <h1 className="font-serif text-xl font-bold text-[#3E3A35] flex items-center gap-2 justify-center sm:justify-start">
                Chào {user.name.split(" ").pop()}!
                {user.role === "PREMIUM" && (
                  <span className="text-[10px] bg-[#F5EBE6] text-[#8C8375] border border-[#E3D5C5] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm uppercase tracking-wide">
                    ★ Premium
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#8C8375] italic">
                {isFinishedToday 
                  ? "Tuyệt vời! Bạn đã hoàn thành chỉ tiêu học hôm nay 🎉" 
                  : "Dành ra 5 phút để nâng cấp bản thân hôm nay nhé."}
              </p>
            </div>
          </div>

          {/* Gamified Streak box */}
          <div className="flex items-center gap-3 bg-white border border-[#EBE6DD] px-4 py-2.5 rounded-xl shadow-sm">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-sm font-bold text-[#D35400]">
                {user.streak?.currentStreak || 0} Ngày liên tiếp
              </div>
              <div className="text-[10px] text-[#8C8375] uppercase tracking-wider font-semibold">
                Kỷ lục: {user.streak?.maxStreak || 0} ngày
              </div>
            </div>
          </div>
        </div>

        {/* Progress tracker bar */}
        {totalCount > 0 && (
          <div className="px-1">
            <div className="flex justify-between items-center text-xs font-semibold text-[#8C8375] mb-1.5">
              <span>TIẾN ĐỘ HÔM NAY</span>
              <span>{completedCount} / {totalCount} bài học</span>
            </div>
            <div className="h-2 w-full bg-[#EBE6DD] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Lessons Feed List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider px-1">
            Bài học dành riêng cho bạn hôm nay
          </h2>

          {loadingLessons ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#D5CFC5] rounded-xl text-[#8C8375]">
              Không có bài học nào phù hợp. Vui lòng cập nhật Onboarding.
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`rounded-2xl border p-6 transition duration-300 relative ${
                    lesson.completed
                      ? "bg-[#FAF9F6] border-[#EBE6DD] opacity-75 shadow-none"
                      : "bg-[#FCFAF7] border-[#EBE6DD] hover:border-[#BFB8AC] hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] shadow-sm"
                  }`}
                >
                  {/* Topic tag chips */}
                  <div className="flex flex-wrap gap-2 items-center mb-3.5">
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

                  <h3 className="font-serif text-lg font-bold text-[#3E3A35] mb-2 leading-tight">
                    {lesson.title}
                  </h3>

                  {/* Summary takeaways list */}
                  <ul className="space-y-1.5 mb-5 text-sm text-[#5C554B]">
                    {lesson.summary.slice(0, 2).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#8C8375] mt-1 text-xs">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                    {lesson.summary.length > 2 && (
                      <li className="text-xs text-[#8C8375] font-serif italic list-none pl-3.5">
                        + {lesson.summary.length - 2} điểm tóm tắt khác...
                      </li>
                    )}
                  </ul>

                  {/* Action trigger button */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#F0ECE4]">
                    <span className="text-xs font-semibold text-[#8C8375] uppercase tracking-wide">
                      Trình độ: {lesson.level}
                    </span>
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition duration-200 focus:outline-none ${
                        lesson.completed
                          ? "bg-[#FAF8F5] text-[#8C8375] border border-[#D5CFC5]"
                          : "bg-[#4E4941] text-white hover:bg-[#3E3A35]"
                      }`}
                    >
                      {lesson.completed ? "✓ Đã xong" : "Bắt đầu học"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
