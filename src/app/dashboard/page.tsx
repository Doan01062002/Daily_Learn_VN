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

const TAG_COLORS: { [key: string]: string } = {
  Tech: "bg-blue-50 text-blue-600 border-blue-200",
  Business: "bg-amber-50 text-amber-600 border-amber-200",
  SoftSkills: "bg-purple-50 text-purple-600 border-purple-200",
  Design: "bg-pink-50 text-pink-600 border-pink-200",
  Health: "bg-teal-50 text-teal-600 border-teal-200",
};

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
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#FFFFFF] to-[#F5EFFF] text-slate-800 flex flex-col relative overflow-hidden">
      {/* Decorative background shapes for extra depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-200/15 blur-[120px] pointer-events-none"></div>

      {/* Header Layout */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#EC4899] flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-base tracking-tight text-slate-800 leading-none">Daily Learn</span>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Việt Nam</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-xs font-semibold text-rose-600 border border-rose-100 bg-rose-50/50 px-3 py-1.5 rounded-lg hover:bg-rose-100/50 transition duration-200"
            >
              ⚙ Quản trị
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition duration-200"
          >
            ⚙ Cài đặt
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
            alt="Avatar"
            className="h-8 w-8 rounded-full border border-slate-200"
          />
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition duration-200"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6 z-20">
        
        {/* Banner Upgrade Premium */}
        {user.role === "STUDENT" && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] p-5 flex items-center justify-between gap-4 shadow-md text-white shadow-indigo-500/10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-100">
                👑 Đặc quyền học tập Premium
              </h3>
              <p className="text-sm font-medium mt-1 leading-normal max-w-md text-white/95">
                Học tập không giới hạn bài học hằng ngày, tự tạo lộ trình ôn tập nâng cao và làm Quiz không giới hạn.
              </p>
            </div>
            <Link
              href="/checkout"
              className="bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 shrink-0 uppercase tracking-wider"
            >
              Nâng cấp ngay
            </Link>
          </div>
        )}

        {/* Streak & Header Section */}
        <div className="rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-indigo-950/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
              alt="User"
              className="h-14 w-14 rounded-full border-2 border-indigo-500"
            />
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
                Chào {user.name.split(" ").pop()}!
                {user.role === "PREMIUM" && (
                  <span className="text-[9px] bg-gradient-to-r from-[#4F46E5] to-[#EC4899] text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm uppercase tracking-wider">
                    ★ Premium
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 italic">
                {isFinishedToday 
                  ? "Tuyệt vời! Bạn đã hoàn thành chỉ tiêu học hôm nay 🎉" 
                  : "Dành ra 5 phút để nâng cấp bản thân hôm nay nhé."}
              </p>
            </div>
          </div>

          {/* Gamified Streak box */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/10 border border-orange-500/10">
            <span className="text-2xl drop-shadow-sm select-none">🔥</span>
            <div>
              <div className="text-sm font-bold tracking-tight">
                {user.streak?.currentStreak || 0} Ngày liên tiếp
              </div>
              <div className="text-[9px] text-white/80 uppercase tracking-widest font-extrabold">
                Kỷ lục: {user.streak?.maxStreak || 0} ngày
              </div>
            </div>
          </div>
        </div>

        {/* Progress tracker bar */}
        {activeTab === "today" && totalCount > 0 && (
          <div className="px-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Tiến độ học hôm nay</span>
              <span className="font-mono text-xs">{completedCount} / {totalCount} bài học</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 gap-6 px-1">
          <button
            onClick={() => setActiveTab("today")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 focus:outline-none ${
              activeTab === "today"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Học tập
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 focus:outline-none ${
              activeTab === "stats"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Thống kê & Thi đua
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "today" ? (
          <div className="space-y-5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Bài học dành riêng cho bạn hôm nay
            </h2>

            {loadingLessons ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : errorMsg ? (
              <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-600 border border-red-100">
                {errorMsg}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic bg-white/40">
                Không có bài học nào phù hợp. Vui lòng cập nhật cài đặt sở thích.
              </div>
            ) : (
              <div className="space-y-5">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`rounded-2xl border p-6 transition-all duration-300 ease-out relative ${
                      lesson.completed
                        ? "bg-emerald-50/30 border-emerald-100 opacity-95 shadow-none"
                        : "bg-white/80 border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-950/5 hover:-translate-y-1 shadow-sm"
                    }`}
                  >
                    {/* Topic tag chips */}
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                      {lesson.tags.map((tag) => {
                        const colorClass = TAG_COLORS[tag] || "bg-gray-50 text-gray-600 border-gray-200";
                        return (
                          <span
                            key={tag}
                            className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${colorClass}`}
                          >
                            #{tag}
                          </span>
                        );
                      })}
                      <span className="text-[10px] text-slate-400 font-serif italic ml-auto">
                        nguồn: {lesson.sourceDomain}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-slate-800 mb-2.5 leading-snug tracking-tight">
                      {lesson.title}
                    </h3>

                    {/* Summary takeaways list */}
                    <ul className="space-y-2 mb-6 text-sm text-slate-600">
                      {lesson.summary.slice(0, 2).map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-orange-500 mt-1.5 text-xs select-none">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                      {lesson.summary.length > 2 && (
                        <li className="text-xs text-slate-400 font-serif italic list-none pl-4 mt-1">
                          + {lesson.summary.length - 2} điểm tóm tắt khác...
                        </li>
                      )}
                    </ul>

                    {/* Action trigger button */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Trình độ: {lesson.level}
                      </span>
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className={`px-4.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 active:translate-y-[1px] focus:outline-none ${
                          lesson.completed
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-250 hover:bg-emerald-100"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-[1.02]"
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 border border-slate-100 border-t-4 border-t-emerald-500 p-5 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài học hoàn thành</div>
                    <div className="text-2xl font-extrabold text-slate-800 mt-1.5 font-mono">{stats?.completedLessons || 0} bài</div>
                  </div>
                  <div className="bg-white/80 border border-slate-100 border-t-4 border-t-blue-500 p-5 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Quiz trung bình</div>
                    <div className="text-2xl font-extrabold text-slate-800 mt-1.5 font-mono">{stats?.averageQuizScore || 0}%</div>
                  </div>
                  <div className="bg-white/80 border border-slate-100 border-t-4 border-t-orange-500 p-5 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chuỗi học hiện tại</div>
                    <div className="text-2xl font-extrabold text-orange-500 mt-1.5 font-mono">🔥 {stats?.currentStreak || 0} ngày</div>
                  </div>
                  <div className="bg-white/80 border border-slate-100 border-t-4 border-t-purple-500 p-5 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chuỗi kỷ lục</div>
                    <div className="text-2xl font-extrabold text-slate-500 mt-1.5 font-mono">🏆 {stats?.maxStreak || 0} ngày</div>
                  </div>
                </div>

                {/* Leaderboard list */}
                <div className="bg-white/85 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-white/40">
                    <h3 className="font-serif text-sm font-bold text-slate-800">Bảng xếp hạng thi đua</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Xếp hạng theo số ngày học liên tục (Streak) cao nhất toàn quốc.</p>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {leaderboard.map((item, index) => {
                      let rankIcon = `${item.rank}`;
                      if (item.rank === 1) rankIcon = "🥇";
                      if (item.rank === 2) rankIcon = "🥈";
                      if (item.rank === 3) rankIcon = "🥉";

                      const isCurrentUser = item.name === user.name;

                      return (
                        <div
                          key={index}
                          className={`px-6 py-3.5 flex items-center justify-between transition-all duration-150 ${
                            isCurrentUser ? "bg-indigo-50/50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-6 text-center">{rankIcon}</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                              alt={item.name}
                              className="h-8 w-8 rounded-full border border-slate-200"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {item.name}
                                {item.role === "PREMIUM" && (
                                  <span className="text-[8px] bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 border border-orange-200/50 font-bold px-1 rounded uppercase tracking-wide">
                                    ★ Premium
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold px-1 rounded uppercase tracking-wide">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-serif italic">
                                Đã hoàn thành {item.completedLessons} bài học
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 rounded-lg">
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
