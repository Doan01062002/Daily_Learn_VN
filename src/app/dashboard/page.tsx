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

interface UserStats {
  completedLessons: number;
  averageQuizScore: number;
  currentStreak: number;
  maxStreak: number;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  avatarUrl: string | null;
  role: string;
  currentStreak: number;
  completedLessons: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [lessons, setLessons] = useState<LessonFeedItem[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats and Leaderboard states
  const [activeTab, setActiveTab] = useState<"today" | "stats">("today");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    if (activeTab === "stats" && !stats) {
      const fetchStatsData = async () => {
        setLoadingStats(true);
        try {
          const [resStats, resLeaderboard] = await Promise.all([
            fetch("/api/stats/user"),
            fetch("/api/stats/leaderboard"),
          ]);
          if (resStats.ok && resLeaderboard.ok) {
            const dataStats = await resStats.json();
            const dataLeaderboard = await resLeaderboard.json();
            setStats(dataStats.stats);
            setLeaderboard(dataLeaderboard.leaderboard);
          }
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStatsData();
    }
  }, [activeTab, stats, user]);

  if (!user) return null;

  // Count progress
  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const isFinishedToday = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header Layout */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#8C8375] to-[#4E4941] flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-base tracking-tight text-[#3E3A35] leading-none">Daily Learn</span>
            <span className="text-[9px] font-bold text-[#8C8375] tracking-widest uppercase mt-0.5">Việt Nam</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-xs font-semibold text-rose-800 border border-rose-200 bg-rose-50/50 px-3 py-1.5 rounded-lg hover:bg-rose-100/50 transition duration-200"
            >
              ⚙ Quản trị
            </Link>
          )}
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
        {activeTab === "today" && totalCount > 0 && (
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EBE6DD] gap-6 px-1">
          <button
            onClick={() => setActiveTab("today")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition focus:outline-none ${
              activeTab === "today"
                ? "border-[#4E4941] text-[#3E3A35]"
                : "border-transparent text-[#8C8375] hover:text-[#3E3A35]"
            }`}
          >
            Học tập
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition focus:outline-none ${
              activeTab === "stats"
                ? "border-[#4E4941] text-[#3E3A35]"
                : "border-transparent text-[#8C8375] hover:text-[#3E3A35]"
            }`}
          >
            Thống kê & Thi đua
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "today" ? (
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
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            {loadingStats ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Bài học hoàn thành</div>
                    <div className="text-xl font-extrabold text-[#3E3A35] mt-1">{stats?.completedLessons || 0} bài</div>
                  </div>
                  <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Điểm Quiz trung bình</div>
                    <div className="text-xl font-extrabold text-[#3E3A35] mt-1">{stats?.averageQuizScore || 0}%</div>
                  </div>
                  <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Chuỗi học hiện tại</div>
                    <div className="text-xl font-extrabold text-[#D35400] mt-1">🔥 {stats?.currentStreak || 0} ngày</div>
                  </div>
                  <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">Chuỗi kỷ lục</div>
                    <div className="text-xl font-extrabold text-[#8C8375] mt-1">🏆 {stats?.maxStreak || 0} ngày</div>
                  </div>
                </div>

                {/* Leaderboard list */}
                <div className="bg-white border border-[#EBE6DD] rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#EBE6DD]">
                    <h3 className="font-serif text-sm font-bold text-[#3E3A35]">Bảng xếp hạng thi đua</h3>
                    <p className="text-[10px] text-[#8C8375] mt-0.5">Xếp hạng theo số ngày học liên tục (Streak) cao nhất toàn quốc.</p>
                  </div>

                  <div className="divide-y divide-[#F0ECE4]">
                    {leaderboard.map((item, index) => {
                      let rankIcon = `${item.rank}`;
                      if (item.rank === 1) rankIcon = "🥇";
                      if (item.rank === 2) rankIcon = "🥈";
                      if (item.rank === 3) rankIcon = "🥉";

                      const isCurrentUser = item.name === user.name;

                      return (
                        <div
                          key={index}
                          className={`px-6 py-3.5 flex items-center justify-between transition duration-150 ${
                            isCurrentUser ? "bg-[#FAF2EB]/50" : "hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-6 text-center">{rankIcon}</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                              alt={item.name}
                              className="h-8 w-8 rounded-full border border-[#D5CFC5]"
                            />
                            <div>
                              <div className="text-xs font-bold text-[#3E3A35] flex items-center gap-1.5">
                                {item.name}
                                {item.role === "PREMIUM" && (
                                  <span className="text-[8px] bg-[#FAF2EB] text-[#BF753F] border border-[#F0DDC5] font-bold px-1 rounded uppercase tracking-wide">
                                    ★ Premium
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1 rounded uppercase tracking-wide">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#8C8375] font-serif italic">
                                Đã hoàn thành {item.completedLessons} bài học
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#D35400] bg-[#FAF2EB] px-2.5 py-1 rounded-lg">
                            <span>🔥</span>
                            <span>{item.currentStreak} ngày</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
