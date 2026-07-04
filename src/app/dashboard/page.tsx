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
  const { user, logout, refreshSession } = useAuth();
  const [lessons, setLessons] = useState<LessonFeedItem[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats and Leaderboard states
  const [activeTab, setActiveTab] = useState<"today" | "stats" | "bookmarks">("today");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Bookmarks states
  const [bookmarks, setBookmarks] = useState<LessonFeedItem[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string>("All");

  // Buy freeze states
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<{ [dateStr: string]: number }>({});
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  const fetchBookmarksData = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await fetch("/api/user/bookmarks");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

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

  useEffect(() => {
    if (!user) return;
    if (activeTab === "bookmarks") {
      fetchBookmarksData();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "stats") {
      const fetchHeatmap = async () => {
        setLoadingHeatmap(true);
        try {
          const res = await fetch("/api/stats/heatmap");
          if (res.ok) {
            const data = await res.json();
            setHeatmapData(data.heatmap);
          }
        } catch (err) {
          console.error("Failed to load heatmap:", err);
        } finally {
          setLoadingHeatmap(false);
        }
      };
      fetchHeatmap();
    }
  }, [activeTab, user]);

  if (!user) return null;

  // Count progress
  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const isFinishedToday = totalCount > 0 && completedCount === totalCount;

  // Toggle bookmark handler
  const handleToggleBookmark = async (lessonId: string) => {
    setBookmarkingId(lessonId);
    try {
      const res = await fetch("/api/user/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (res.ok) {
        await refreshSession();
        if (activeTab === "bookmarks") {
          await fetchBookmarksData();
        }
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setBookmarkingId(null);
    }
  };

  // Buy streak freeze handler
  const buyStreakFreeze = async () => {
    setBuyingFreeze(true);
    setBuyError(null);
    try {
      const res = await fetch("/api/user/streak-freeze/buy", { method: "POST" });
      if (res.ok) {
        await refreshSession();
        const resStats = await fetch("/api/stats/user");
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats.stats);
        }
      } else {
        const data = await res.json();
        setBuyError(data.error || "Mua thẻ bảo vệ thất bại.");
      }
    } catch (err) {
      setBuyError("Lỗi kết nối.");
    } finally {
      setBuyingFreeze(false);
    }
  };

  // Filter lists by selected tag
  const filteredLessons = lessons.filter((l) => {
    if (selectedTag === "All") return true;
    return l.tags.includes(selectedTag);
  });

  const filteredBookmarks = bookmarks.filter((l) => {
    if (selectedTag === "All") return true;
    return l.tags.includes(selectedTag);
  });

  // SVG Flame Component
  const FlameIcon = ({ className }: { className: string }) => (
    <svg
      className={`h-7 w-7 transition-all duration-300 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C8 6 6 8.5 6 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-3.5-2-6-6-10zm2.5 12.3c-.6.6-1.5.8-2.3.5-.8-.3-1.2-1-1.2-1.8 0-.8.4-1.5 1-2 .2-.2.3-.5.2-.7-.1-.2-.3-.4-.5-.4-.6 0-1.1-.3-1.4-.7s-.3-.9-.1-1.4c.1-.2 0-.4-.1-.5-.2-.1-.4 0-.5.1C8.7 8 8 9.5 8 11.2c0 2.6 2.1 4.8 4.8 4.8 1.2 0 2.3-.4 3.1-1.2.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7-.1z" />
    </svg>
  );

  const getFlameClass = (streak: number) => {
    if (streak === 0) return "text-slate-300";
    if (streak < 7) return "animate-flame-orange";
    if (streak < 14) return "animate-flame-red";
    if (streak < 30) return "animate-flame-purple";
    return "animate-flame-blue";
  };

  // Generate GitHub Heatmap grid dates
  const getHeatmapGrid = () => {
    const gridDates = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 125);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const totalCells = 18 * 7;
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      gridDates.push(d);
    }
    return gridDates;
  };

  const getCellColor = (date: Date) => {
    const dateStr = date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    const count = heatmapData[dateStr] || 0;
    if (count === 0) return "bg-slate-100 hover:bg-slate-200";
    if (count === 1) return "bg-indigo-200 hover:bg-indigo-300";
    if (count === 2) return "bg-indigo-400 hover:bg-indigo-500";
    return "bg-indigo-600 hover:bg-indigo-700";
  };

  const streakVal = stats?.currentStreak !== undefined ? stats.currentStreak : (user.streak?.currentStreak || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#FFFFFF] to-[#F5EFFF] text-slate-800 flex flex-col relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flame-sway {
          0% { transform: scale(1) rotate(-1deg); }
          50% { transform: scale(1.06) rotate(2deg); }
          100% { transform: scale(1) rotate(-1deg); }
        }
        .animate-flame-orange {
          animation: flame-sway 1.2s ease-in-out infinite;
          color: #FF6B35;
          filter: drop-shadow(0 2px 4px rgba(255,107,53,0.3));
        }
        .animate-flame-red {
          animation: flame-sway 0.8s ease-in-out infinite;
          color: #EF4444;
          filter: drop-shadow(0 0 8px rgba(239,68,68,0.6));
        }
        .animate-flame-purple {
          animation: flame-sway 0.6s ease-in-out infinite;
          color: #A855F7;
          filter: drop-shadow(0 0 12px rgba(168,85,247,0.8));
        }
        .animate-flame-blue {
          animation: flame-sway 0.4s ease-in-out infinite;
          color: #3B82F6;
          filter: drop-shadow(0 0 16px rgba(59,130,246,0.9));
        }
      `}} />

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

          {/* Gamified Dynamic Streak Flame Box */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm">
            <FlameIcon className={getFlameClass(streakVal)} />
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-800">
                {streakVal} Ngày liên tiếp
              </div>
              <div className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">
                Kỷ lục: {stats?.maxStreak !== undefined ? stats.maxStreak : (user.streak?.maxStreak || 0)} ngày
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
            onClick={() => setActiveTab("bookmarks")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 focus:outline-none ${
              activeTab === "bookmarks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Đã lưu
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
            {/* Tag filtering buttons */}
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {["All", "Tech", "Business", "SoftSkills", "Design", "Health"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition duration-200 ${
                    selectedTag === tag
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag === "All" ? "Tất cả" : `#${tag}`}
                </button>
              ))}
            </div>

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
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic bg-white/40">
                Không có bài học nào phù hợp với chủ đề đã chọn.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredLessons.map((lesson) => {
                  const isSaved = user.savedLessonIds?.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className={`rounded-2xl border p-6 transition-all duration-300 ease-out relative ${
                        lesson.completed
                          ? "bg-emerald-50/30 border-emerald-100 opacity-95 shadow-none"
                          : "bg-white/80 border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-950/5 hover:-translate-y-1 shadow-sm"
                      }`}
                    >
                      {/* Bookmark Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleBookmark(lesson.id);
                        }}
                        disabled={bookmarkingId === lesson.id}
                        className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition duration-200 z-10"
                        title={isSaved ? "Bỏ lưu bài học" : "Lưu bài học"}
                      >
                        <svg
                          className={`h-5 w-5 ${isSaved ? "text-indigo-600 fill-indigo-600" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      {/* Topic tag chips */}
                      <div className="flex flex-wrap gap-2 items-center mb-4 pr-8">
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
                        <span className="text-[10px] text-slate-400 font-serif italic">
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
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "bookmarks" ? (
          <div className="space-y-5">
            {/* Tag filtering buttons */}
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {["All", "Tech", "Business", "SoftSkills", "Design", "Health"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition duration-200 ${
                    selectedTag === tag
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag === "All" ? "Tất cả" : `#${tag}`}
                </button>
              ))}
            </div>

            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Bài học đã lưu của bạn ({filteredBookmarks.length})
            </h2>

            {loadingBookmarks ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic bg-white/40">
                Chưa có bài học nào được lưu ở danh mục này.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredBookmarks.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`rounded-2xl border p-6 transition-all duration-300 ease-out relative ${
                      lesson.completed
                        ? "bg-emerald-50/30 border-emerald-100 opacity-95 shadow-none"
                        : "bg-white/80 border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-950/5 hover:-translate-y-1 shadow-sm"
                    }`}
                  >
                    {/* Bookmark Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleBookmark(lesson.id);
                      }}
                      disabled={bookmarkingId === lesson.id}
                      className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition duration-200 z-10"
                      title="Bỏ lưu bài học"
                    >
                      <svg
                        className="h-5 w-5 text-indigo-600 fill-indigo-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>

                    {/* Topic tag chips */}
                    <div className="flex flex-wrap gap-2 items-center mb-4 pr-8">
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
                      <span className="text-[10px] text-slate-400 font-serif italic">
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

                {/* Gamified items dashboard card (Streak Freezes & Knowledge Points balance) */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-950 p-6 rounded-2xl shadow-md text-white">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200 mb-4 flex items-center gap-1.5">
                    🎒 Hành trang tri thức của bạn
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6 items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Điểm tri thức tích lũy</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">💎</span>
                        <span className="text-2xl font-extrabold font-mono text-indigo-50">{user.knowledgePoints || 0} Điểm</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Thẻ bảo vệ Streak</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">❄️</span>
                        <span className="text-2xl font-extrabold font-mono text-indigo-50">{user.streakFreezes || 0} Thẻ</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-indigo-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-indigo-200/80 leading-normal max-w-sm">
                      Dùng <strong>50 Điểm tri thức</strong> để đổi 1 <strong>Thẻ bảo vệ Streak</strong>. Thẻ sẽ tự động kích hoạt khi bạn quên học bài để bảo toàn chuỗi học.
                    </p>
                    <button
                      onClick={buyStreakFreeze}
                      disabled={buyingFreeze || (user.knowledgePoints || 0) < 50}
                      className="bg-white text-indigo-900 disabled:bg-indigo-950 disabled:text-indigo-400 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 shrink-0 select-none"
                    >
                      {buyingFreeze ? "Đang xử lý..." : "Mua Thẻ bảo vệ (50💎)"}
                    </button>
                  </div>
                  {buyError && (
                    <p className="text-red-300 text-[10px] font-bold mt-2">{buyError}</p>
                  )}
                </div>

                {/* Contribution Heatmap Calendar card */}
                <div className="bg-white/80 border border-slate-100 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-slate-800">Nhật ký hoạt động học tập</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 mb-4">Nhìn lại nỗ lực của bạn trong 6 tháng qua (Rê chuột để xem số bài đã học).</p>
                  
                  {loadingHeatmap ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div>
                      {/* Lưới lịch */}
                      <div className="flex gap-2 items-end justify-center py-2 overflow-x-auto select-none">
                        <div className="flex flex-col justify-between text-[8px] text-slate-400 h-[105px] pr-1 pb-1">
                          <span>CN</span>
                          <span>T3</span>
                          <span>T5</span>
                          <span>T7</span>
                        </div>
                        <div className="grid grid-flow-col grid-rows-7 gap-1 h-[105px]">
                          {getHeatmapGrid().map((d, index) => {
                            const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
                            const count = heatmapData[dateStr] || 0;
                            const formattedDate = d.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
                            const titleText = `${formattedDate}: Hoàn thành ${count} bài học`;
                            
                            return (
                              <div
                                key={index}
                                className={`h-3 w-3 rounded-sm transition-all duration-150 cursor-pointer ${getCellColor(d)}`}
                                title={titleText}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Chú thích màu sắc */}
                      <div className="flex items-center justify-end gap-1.5 mt-2.5 text-[9px] text-slate-400 pr-2">
                        <span>Ít</span>
                        <div className="h-2.5 w-2.5 rounded-sm bg-slate-100" />
                        <div className="h-2.5 w-2.5 rounded-sm bg-indigo-200" />
                        <div className="h-2.5 w-2.5 rounded-sm bg-indigo-400" />
                        <div className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
                        <span>Nhiều</span>
                      </div>
                    </div>
                  )}
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
