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

const MOTIVATIONAL_QUOTES = [
  { text: "Học tập là con đường ngắn nhất để nâng cấp bản thân và mở ra những cánh cửa cơ hội mới.", author: "Daily Learn Việt Nam" },
  { text: "Kiến thức là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới.", author: "Nelson Mandela" },
  { text: "Học không bao giờ làm trí tuệ kiệt quệ.", author: "Leonardo da Vinci" },
  { text: "Đừng bao giờ ngừng học hỏi, vì cuộc đời không bao giờ ngừng giảng dạy.", author: "Khuyết danh" },
  { text: "Năng lực tư duy logic là nền tảng cốt lõi của mọi sự thành công trong thời đại số.", author: "Daily Learn Việt Nam" },
  { text: "Cách tốt nhất để dự đoán tương lai là tự mình kiến tạo ra nó.", author: "Alan Kay" },
  { text: "Học đi đôi với hành, lý thuyết không thực hành chỉ là lý thuyết suông.", author: "Hồ Chí Minh" },
  { text: "Mỗi ngày tích lũy 1% kiến thức mới, sau một năm bạn sẽ tiến bộ gấp 37 lần.", author: "James Clear (Atomic Habits)" },
  { text: "Sự đầu tư vào kiến thức luôn mang lại mức lãi suất cao nhất.", author: "Benjamin Franklin" },
  { text: "Thất bại lớn nhất là không dám thử sức và từ bỏ việc học hỏi từ những sai lầm.", author: "Daily Learn Việt Nam" },
];

export default function DashboardPage() {
  const { user, logout, refreshSession } = useAuth();
  const [lessons, setLessons] = useState<LessonFeedItem[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats and Leaderboard states
  const [activeTab, setActiveTab] = useState<"today" | "bookmarks" | "timeline">("today");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
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

  // Daily Quote state
  const [dailyQuote, setDailyQuote] = useState({ text: "", author: "" });

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
    // Pick motivational quote based on date
    const day = new Date().getDate();
    const quote = MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
    setDailyQuote(quote);
  }, []);

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

    const fetchStatsData = async () => {
      setLoadingStats(true);
      try {
        const [resStats, resLeaderboard, resHeatmap] = await Promise.all([
          fetch("/api/stats/user"),
          fetch("/api/stats/leaderboard"),
          fetch("/api/stats/heatmap"),
        ]);
        if (resStats.ok && resLeaderboard.ok && resHeatmap.ok) {
          const dataStats = await resStats.json();
          const dataLeaderboard = await resLeaderboard.json();
          const dataHeatmap = await resHeatmap.json();
          setStats(dataStats.stats);
          setTimeline(dataStats.timeline || []);
          setLeaderboard(dataLeaderboard.leaderboard);
          setHeatmapData(dataHeatmap.heatmap);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchTodayLessons();
    fetchStatsData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "bookmarks") {
      fetchBookmarksData();
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
    if (streak === 0) return "text-slate-350";
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

      {/* Main SaaS Dashboard Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (1/3 Width) - User Stats & Sidebar info */}
          {/* On mobile: Rendered below the main lessons feed to keep mobile focal point clean */}
          <div className="md:col-span-1 space-y-6 order-2 md:order-1">
            
            {/* Streak & Profile Info Card */}
            <div className="rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-indigo-950/5 flex flex-col items-center text-center gap-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                  alt="User"
                  className="h-20 w-20 rounded-full border-4 border-white shadow-md"
                />
                {user.role === "PREMIUM" && (
                  <span className="absolute bottom-0 right-0 text-xs bg-gradient-to-r from-[#4F46E5] to-[#EC4899] text-white p-1 rounded-full shadow-sm">
                    👑
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  {user.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{user.email}</p>
              </div>

              {/* Dynamic Swaying Flame widget */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-xl w-full justify-center">
                <FlameIcon className={getFlameClass(streakVal)} />
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-800">{streakVal} ngày liên tiếp</div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Kỷ lục: {stats?.maxStreak || 0} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Knowledge points & Streak freezes inventory card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-950 p-6 rounded-2xl shadow-md text-white">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200 mb-4 flex items-center gap-1.5">
                🎒 Hành trang tri thức
              </h3>
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Điểm tích lũy</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">💎</span>
                    <span className="text-lg font-extrabold font-mono text-indigo-50">{user.knowledgePoints || 0}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Thẻ bảo vệ</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">❄️</span>
                    <span className="text-lg font-extrabold font-mono text-indigo-50">{user.streakFreezes || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-indigo-800/40 space-y-3">
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Dùng <strong>50 Điểm</strong> để mua 1 <strong>Thẻ bảo vệ</strong> giúp chống đứt Streak.
                </p>
                <button
                  onClick={buyStreakFreeze}
                  disabled={buyingFreeze || (user.knowledgePoints || 0) < 50}
                  className="w-full bg-white text-indigo-900 disabled:bg-indigo-950 disabled:text-indigo-400 hover:bg-indigo-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 select-none"
                >
                  {buyingFreeze ? "Đang xử lý..." : "Mua Thẻ bảo vệ (50💎)"}
                </button>
              </div>
              {buyError && (
                <p className="text-red-300 text-[10px] font-bold mt-2 text-center">{buyError}</p>
              )}
            </div>

            {/* Contribution Graph Heatmap */}
            <div className="bg-white/80 border border-slate-100 p-5 rounded-2xl shadow-sm">
              <h3 className="font-serif text-sm font-bold text-slate-800">Nhật ký hoạt động</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 mb-3">Tần suất học tập 6 tháng qua.</p>
              
              <div className="flex gap-1.5 items-end justify-center py-2 overflow-x-auto select-none">
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
              <div className="flex items-center justify-end gap-1 mt-2 text-[8px] text-slate-400 pr-1">
                <span>Ít</span>
                <div className="h-2 w-2 rounded bg-slate-100" />
                <div className="h-2 w-2 rounded bg-indigo-200" />
                <div className="h-2 w-2 rounded bg-indigo-400" />
                <div className="h-2 w-2 rounded bg-indigo-600" />
                <span>Nhiều</span>
              </div>
            </div>

            {/* Leaderboard panel */}
            <div className="bg-white/85 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-white/40">
                <h3 className="font-serif text-sm font-bold text-slate-800">Bảng xếp hạng thi đua</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Theo chuỗi ngày học liên tục (Streak).</p>
              </div>

              <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                {leaderboard.map((item, index) => {
                  let rankIcon = `${item.rank}`;
                  if (item.rank === 1) rankIcon = "🥇";
                  if (item.rank === 2) rankIcon = "🥈";
                  if (item.rank === 3) rankIcon = "🥉";

                  const isCurrentUser = item.name === user.name;

                  return (
                    <div
                      key={index}
                      className={`px-4 py-3 flex items-center justify-between transition-all duration-150 ${
                        isCurrentUser ? "bg-indigo-50/50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-5 text-center">{rankIcon}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                          alt={item.name}
                          className="h-7 w-7 rounded-full border border-slate-200"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[100px] flex items-center gap-1">
                            {item.name.split(" ").pop()}
                            {isCurrentUser && (
                              <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">Bạn</span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block">Done: {item.completedLessons} bài</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 font-mono font-bold text-[10px] text-white bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 rounded">
                        <span>🔥</span>
                        <span>{item.currentStreak}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (2/3 Width) - Active Feed & Dynamic widgets */}
          {/* On mobile: Rendered first to display active lessons feed immediately */}
          <div className="md:col-span-2 space-y-6 order-1 md:order-2">
            
            {/* Daily Quote widget */}
            {dailyQuote.text && (
              <div className="rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-indigo-950/5 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl select-none animate-pulse">💡</div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Cảm hứng học tập mỗi ngày</span>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed font-serif italic">
                      "{dailyQuote.text}"
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold block pt-1">— {dailyQuote.author}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tag filtering categories buttons */}
            <div className="flex flex-wrap gap-2 px-1">
              {["All", "Tech", "Business", "SoftSkills", "Design", "Health"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition duration-200 ${
                    selectedTag === tag
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag === "All" ? "Tất cả" : `#${tag}`}
                </button>
              ))}
            </div>

            {/* Tab Navigation Feed Switcher */}
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
                onClick={() => setActiveTab("timeline")}
                className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 focus:outline-none ${
                  activeTab === "timeline"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Nhật ký
              </button>
            </div>

            {/* Tab Switcher Content Render */}
            {activeTab === "today" ? (
              <div className="space-y-5">
                {/* Progress bar today */}
                {totalCount > 0 && (
                  <div className="px-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span>Tiến độ hoàn thành hôm nay</span>
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

                {loadingLessons ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : errorMsg ? (
                  <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-600 border border-red-100">
                    {errorMsg}
                  </div>
                ) : filteredLessons.length === 0 ? (
                  /* SVG Illustration empty state for lessons feed */
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white/40 flex flex-col items-center justify-center p-6 space-y-4">
                    <svg className="h-16 w-16 text-indigo-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-sm font-bold text-slate-700">Không tìm thấy bài học</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Không tìm thấy bài học nào phù hợp với danh mục lọc hoặc sở thích học tập của bạn hôm nay.
                      </p>
                    </div>
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
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Bài học đã lưu ({filteredBookmarks.length})
                </h2>

                {loadingBookmarks ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : filteredBookmarks.length === 0 ? (
                  /* SVG Illustration empty state for bookmarks */
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white/40 flex flex-col items-center justify-center p-6 space-y-4">
                    <svg className="h-16 w-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-sm font-bold text-slate-700">Chưa lưu bài học nào</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Hãy nhấn biểu tượng Bookmark bên cạnh bài học để lưu lại và ôn tập bất kỳ lúc nào bạn muốn.
                      </p>
                    </div>
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
              /* Timeline / Activity Logs Tab */
              <div className="space-y-5">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Nhật ký hoạt động của bạn ({timeline.length})
                </h2>

                {loadingStats ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white/40 flex flex-col items-center justify-center p-6 space-y-4">
                    <svg className="h-16 w-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-sm font-bold text-slate-700">Chưa có hoạt động nào</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Hãy bắt đầu học và vượt qua các bài kiểm tra trắc nghiệm để ghi nhận nhật ký của bạn.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-l border-indigo-100 ml-4 pl-6 space-y-6 py-4">
                    {timeline.map((item, idx) => {
                      const date = new Date(item.completedAt);
                      const formattedDate = date.toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div key={idx} className="relative">
                          {/* Dot marker on vertical timeline line */}
                          <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400">{formattedDate}</span>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug">{item.title}</h4>
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                                Đạt {item.score}%
                              </span>
                              {item.tags.map((tag: string) => (
                                <span key={tag} className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
