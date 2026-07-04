"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import CustomSelect from "@/components/CustomSelect";

const RANGE_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7days", label: "7 ngày qua" },
  { value: "30days", label: "30 ngày qua" },
  { value: "custom", label: "Khoảng ngày tùy chọn" },
];

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  adminUsers: number;
  totalLessons: number;
  publishedLessons: number;
  draftLessons: number;
  totalQuizzesSolved: number;
  totalRevenue: number;
  beginnerCount: number;
  experiencedCount: number;
}

interface TopicPopularity {
  topic: string;
  count: number;
}

interface StreakLeader {
  id: string;
  userId: string;
  currentStreak: number;
  maxStreak: number;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  txCode: string;
  createdAt: string;
  userName: string;
  userEmail: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl: string | null;
}

function LevelDoughnutChart({ beginner, experienced, total }: { beginner: number; experienced: number; total: number }) {
  const totalVal = total || 1;
  const beginnerPercent = (beginner / totalVal) * 100;
  const experiencedPercent = (experienced / totalVal) * 100;
  
  const r = 38;
  const circ = 2 * Math.PI * r; // ~238.76
  
  const begStroke = (beginnerPercent / 100) * circ;
  const expStroke = (experiencedPercent / 100) * circ;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={r}
            className="stroke-[#F8FAFC] fill-none"
            strokeWidth="10"
          />
          
          {/* Beginner Circle Segment */}
          {beginner > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              className="stroke-rose-800 fill-none transition-all duration-500"
              strokeWidth="10"
              strokeDasharray={`${begStroke} ${circ}`}
              strokeLinecap="round"
            />
          )}
          
          {/* Experienced Circle Segment */}
          {experienced > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              className="stroke-[#BFB8AC] fill-none transition-all duration-500"
              strokeWidth="10"
              strokeDasharray={`${expStroke} ${circ}`}
              strokeDashoffset={-begStroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Center labels */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-sans font-black text-rose-950">{total}</span>
          <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider">Học viên</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 text-xs w-full">
        <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-800" />
          <span>Beginner ({beginner})</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#64748B]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#BFB8AC]" />
          <span>Experienced ({experienced})</span>
        </div>
      </div>
    </div>
  );
}

function RevenueBarChart({ trend }: { trend: { label: string; amount: number }[] }) {
  const maxAmount = Math.max(...trend.map((t) => t.amount), 50000);
  const height = 120;
  const width = 300;
  const padding = 20;
  
  const graphHeight = height - padding * 2;
  const graphWidth = width - padding * 2;
  
  return (
    <div className="w-full">
      <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Horizontal Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + graphHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-[#E2E8F0]"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 5}
                y={y + 2.5}
                textAnchor="end"
                className="fill-[#64748B] text-[6.5px] font-mono font-bold"
              >
                {Math.round((maxAmount * ratio) / 1000) * 1000 >= 1000000 
                  ? `${((maxAmount * ratio) / 1000000).toFixed(1)}M`
                  : `${Math.round((maxAmount * ratio) / 1000)}k`}
              </text>
            </g>
          );
        })}
        
        {/* Bars */}
        {trend.map((item, index) => {
          const colWidth = graphWidth / trend.length;
          const x = padding + index * colWidth + (colWidth - 10) / 2;
          const barHeight = (item.amount / maxAmount) * graphHeight;
          const barWidth = 10;
          const y = padding + graphHeight - barHeight;
          
          return (
            <g key={index} className="group cursor-pointer">
              <title>{`${item.label}: ${item.amount.toLocaleString("vi-VN")} đ`}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1.5)}
                fill="url(#barGrad)"
                rx="2"
                ry="2"
                className="hover:opacity-85 transition-all duration-300"
              />
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                className="fill-[#64748B] text-[6.5px] font-bold"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RegistrationLineChart({ trend }: { trend: { label: string; count: number }[] }) {
  const maxCount = Math.max(...trend.map((t) => t.count), 5);
  const height = 120;
  const width = 300;
  const padding = 20;
  
  const graphHeight = height - padding * 2;
  const graphWidth = width - padding * 2;
  
  const points = trend.map((item, index) => {
    const x = padding + (index * graphWidth) / Math.max(trend.length - 1, 1);
    const y = padding + graphHeight - (item.count / maxCount) * graphHeight;
    return { x, y, label: item.label, count: item.count };
  });
  
  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";
    
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${padding + graphHeight} L ${points[0].x} ${padding + graphHeight} Z`
    : "";
    
  return (
    <div className="w-full">
      <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + graphHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-[#E2E8F0]"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 5}
                y={y + 2.5}
                textAnchor="end"
                className="fill-[#64748B] text-[6.5px] font-mono font-bold"
              >
                {Math.round(maxCount * ratio)}
              </text>
            </g>
          );
        })}
        
        {/* Area under line */}
        {areaD && (
          <path
            d={areaD}
            fill="url(#areaGrad)"
            className="transition-all duration-500"
          />
        )}
        
        {/* Stroke line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            className="stroke-blue-900 transition-all duration-500"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Points */}
        {points.map((p, index) => (
          <g key={index} className="group cursor-pointer">
            <title>{`${p.label}: ${p.count} học viên`}</title>
            <circle
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-white stroke-blue-900 hover:r-4 transition-all duration-150"
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="fill-[#64748B] text-[6.5px] font-bold"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topicPopularity, setTopicPopularity] = useState<TopicPopularity[]>([]);
  const [topStreaks, setTopStreaks] = useState<StreakLeader[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{ label: string; amount: number }[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<{ label: string; count: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportSending, setReportSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Struggling Students states
  const [strugglingStudents, setStrugglingStudents] = useState<any[]>([]);
  const [assistLoading, setAssistLoading] = useState<string | null>(null);

  // Date range filters
  const [range, setRange] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSendWeeklyReport = async () => {
    setReportSending(true);
    try {
      const res = await fetch("/api/admin/reports/send", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Đã gửi báo cáo hoạt động tuần về email: ${data.receiverEmail} thành công!`);
      } else {
        showNotification("Gửi báo cáo thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối máy chủ.", "error");
    } finally {
      setReportSending(false);
    }
  };

  const fetchStrugglingStudents = async () => {
    try {
      const res = await fetch("/api/admin/users/struggling");
      if (res.ok) {
        const data = await res.json();
        setStrugglingStudents(data.struggling || []);
      }
    } catch (e) {
      console.error("Failed to fetch struggling students:", e);
    }
  };

  const handleSendAssist = async (userId: string, lessonId: string, email: string) => {
    setAssistLoading(`${userId}_${lessonId}`);
    try {
      const res = await fetch("/api/admin/users/struggling/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lessonId }),
      });
      if (res.ok) {
        showNotification(`Đã gửi hướng dẫn ôn tập cho học viên (${email}) thành công!`);
        fetchStrugglingStudents();
      } else {
        showNotification("Gửi email hỗ trợ thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng.", "error");
    } finally {
      setAssistLoading(null);
    }
  };

  const fetchDashboardData = async (rangeVal = range, start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        range: rangeVal,
        startDate: start,
        endDate: end,
      });
      const res = await fetch(`/api/admin/stats/dashboard?${q}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTopicPopularity(data.topicPopularity);
        setTopStreaks(data.topStreaks);
        setRecentPayments(data.recentPayments);
        setRecentUsers(data.recentUsers);
        setRevenueTrend(data.revenueTrend || []);
        setRegistrationTrend(data.registrationTrend || []);
      } else {
        setErrorMsg("Không thể tải thông tin thống kê tổng quan.");
      }
    } catch (error) {
      console.error("Failed to load dashboard statistics:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      if (range !== "custom" || (startDate && endDate)) {
        fetchDashboardData(range, startDate, endDate);
      }
      fetchStrugglingStudents();
    }
  }, [user, range, startDate, endDate]);

  if (!user) return null;

  // Client-Side Authorization check
  if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-sans text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN) và Nhân viên vận hành (OPERATOR). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-[#334155] text-white text-xs font-semibold hover:bg-[#0F172A] transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  // Helper topic translation mapping
  const getTopicLabel = (tag: string) => {
    const map: Record<string, string> = {
      Tech: "Công nghệ / Lập trình",
      Business: "Kinh doanh / Khởi nghiệp",
      SoftSkills: "Kỹ năng mềm",
      Design: "Thiết kế / UI/UX",
      Health: "Sức khỏe / Đời sống",
    };
    return map[tag] || tag;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin" />

      {/* Main Viewport Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Tổng quan Quản trị</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-[#64748B] font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
              aria-label="User menu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full border border-rose-800"
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50/50 transition cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-800 border-t-transparent"></div>
            </div>
          ) : stats ? (
            <>
              {/* Welcome & Quick actions bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
                <div>
                  <h1 className="font-sans font-black text-lg text-rose-950">Chào mừng trở lại, {user?.name}!</h1>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Hôm nay là {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. Dưới đây là hoạt động hệ thống.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleSendWeeklyReport}
                    disabled={reportSending}
                    className="inline-flex items-center gap-2.5 px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {reportSending ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang gửi báo cáo...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                        </svg>
                        Gửi Báo cáo Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Filter & Export Bar */}
              <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col space-y-1 min-w-[160px]">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</span>
                    <CustomSelect
                      value={range}
                      onChange={(val) => {
                        setRange(val);
                        if (val !== "custom") {
                          setStartDate("");
                          setEndDate("");
                        }
                      }}
                      options={RANGE_OPTIONS}
                      placeholder="Chọn thời gian"
                    />
                  </div>

                  {range === "custom" && (
                    <>
                      <div className="flex flex-col space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Từ ngày</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-3 py-1 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Đến ngày</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-3 py-1 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={`/api/admin/reports/export?type=financial&range=${range}&startDate=${startDate}&endDate=${endDate}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-800 text-xs font-bold rounded-xl transition cursor-pointer"
                    download
                  >
                    📊 Xuất Báo Cáo Tài Chính
                  </a>
                  <a
                    href={`/api/admin/reports/export?type=learning&range=${range}&startDate=${startDate}&endDate=${endDate}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    download
                  >
                    🎓 Xuất Báo Cáo Học Tập
                  </a>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stats Card 1: Users */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Tổng học viên</span>
                    <h3 className="text-2xl font-sans font-black text-rose-950">{stats.totalUsers}</h3>
                    <p className="text-[10px] text-[#64748B] font-bold">
                      {stats.premiumUsers} Premium | {stats.freeUsers} Thường
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-800 shadow-inner">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>

                {/* Stats Card 2: Cumulative Revenue */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Doanh thu tích lũy</span>
                    <h3 className="text-2xl font-sans font-black text-rose-950">
                      {stats.totalRevenue.toLocaleString("vi-VN")} <span className="text-sm font-sans font-bold">đ</span>
                    </h3>
                    <p className="text-[10px] text-emerald-700 font-bold">
                      100% giao dịch hoàn tất
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shadow-inner">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>

                {/* Stats Card 3: Lessons */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Tổng bài học</span>
                    <h3 className="text-2xl font-sans font-black text-rose-950">{stats.totalLessons}</h3>
                    <p className="text-[10px] text-[#64748B] font-bold">
                      {stats.publishedLessons} Đã đăng | {stats.draftLessons} Bản nháp
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shadow-inner">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                {/* Stats Card 4: Quizzes Solved */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Trắc nghiệm đã giải</span>
                    <h3 className="text-2xl font-sans font-black text-rose-950">{stats.totalQuizzesSolved}</h3>
                    <p className="text-[10px] text-[#64748B] font-bold">
                      Số lượt hoàn tất bài học
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800 shadow-inner">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Trends Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Doanh thu 7 ngày qua</h3>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wide">Xu hướng</span>
                  </div>
                  <RevenueBarChart trend={revenueTrend} />
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Đăng ký mới 7 ngày qua</h3>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wide">Tài khoản</span>
                  </div>
                  <RegistrationLineChart trend={registrationTrend} />
                </div>
              </div>

              {/* Graphical distribution & list stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Levels & Topic Popularity */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Card: Levels Distribution */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Phân bố trình độ</h3>
                    <LevelDoughnutChart
                      beginner={stats.beginnerCount}
                      experienced={stats.experiencedCount}
                      total={stats.totalUsers}
                    />
                  </div>

                  {/* Card: Top Topics popularity */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Chủ đề ưa thích</h3>
                    <div className="space-y-3.5">
                      {topicPopularity.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic">Chưa có dữ liệu chủ đề.</p>
                      ) : (
                        topicPopularity.map((topicItem, index) => {
                          const maxCount = topicPopularity[0]?.count || 1;
                          const percent = Math.min((topicItem.count / maxCount) * 100, 100);
                          return (
                            <div key={topicItem.topic} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-[#334155]">
                                <span>{getTopicLabel(topicItem.topic)}</span>
                                <span className="text-rose-800">{topicItem.count} lượt chọn</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-[#F8FAFC] overflow-hidden shadow-inner">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    index === 0
                                      ? "from-rose-800 to-rose-700"
                                      : "from-[#BFB8AC] to-[#A0988A]"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Streak Leaders & Registrations */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Card: Top streaks */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Chuỗi Streak dẫn đầu</h3>
                    <div className="divide-y divide-[#E2E8F0] text-xs">
                      {topStreaks.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic py-2">Chưa có học viên nào giữ streak.</p>
                      ) : (
                        topStreaks.map((s, index) => (
                          <div key={s.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2.5">
                              <span className="font-sans font-black text-rose-800 w-4">{index + 1}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#0F172A]">{s.userName}</span>
                                <span className="text-[10px] text-[#64748B]">{s.userEmail}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full text-rose-800 font-extrabold text-[10px]">
                              <span>🔥</span>
                              <span>{s.currentStreak} ngày</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card: Recent users */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Học viên mới đăng ký</h3>
                    <div className="divide-y divide-[#E2E8F0] text-xs">
                      {recentUsers.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic py-2">Không có tài khoản đăng ký mới.</p>
                      ) : (
                        recentUsers.map((u) => (
                          <div key={u.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-800">
                                {u.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#0F172A] truncate max-w-[120px]">{u.name}</span>
                                <span className="text-[9px] text-[#64748B] truncate max-w-[120px]">{u.email}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-[#64748B] font-semibold">
                              {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Payment History */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4 h-full flex flex-col">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">Giao dịch Premium gần đây</h3>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Live
                      </span>
                    </div>

                    <div className="flex-1 divide-y divide-[#E2E8F0] text-xs">
                      {recentPayments.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-48 text-[#64748B] space-y-2">
                          <span>💰</span>
                          <span className="italic">Không phát sinh giao dịch thanh toán gần đây.</span>
                        </div>
                      ) : (
                        recentPayments.map((p) => (
                          <div key={p.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-[#0F172A]">{p.userName}</span>
                              <span className="text-emerald-700">+{p.amount.toLocaleString("vi-VN")} đ</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-[#64748B]">
                              <span>Mã: <strong className="font-mono text-[#334155]">{p.txCode}</strong></span>
                              <span>{new Date(p.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row: Struggling Students */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-rose-950 tracking-tight">🚨 Học viên Cần Hỗ trợ Luyện tập</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Danh sách học viên thi trượt quiz từ 3 lần trở lên của cùng một bài học.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-100 font-extrabold text-[9px] uppercase tracking-wide">
                    {strugglingStudents.length} học viên
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {strugglingStudents.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-6">Tuyệt vời! Hiện tại không có học viên nào gặp khó khăn thi trượt nhiều lần.</p>
                  ) : (
                    strugglingStudents.map((student) => {
                      const isAssisting = assistLoading === `${student.userId}_${student.lessonId}`;
                      return (
                        <div key={`${student.userId}_${student.lessonId}`} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0F172A]">{student.userName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({student.userEmail})</span>
                            </div>
                            <p className="text-slate-600 font-medium">
                              Gặp khó khăn ở bài học: <strong className="text-rose-950">"{student.lessonTitle}"</strong> (Trượt {student.failedCount} lần)
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Các điểm số đạt được: {student.failedScores.join("%, ")}%
                            </p>
                          </div>
                          
                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSendAssist(student.userId, student.lessonId, student.userEmail)}
                              disabled={isAssisting}
                              className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-[10px] font-extrabold transition shadow disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                            >
                              {isAssisting ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                                  <span>Đang gửi thư...</span>
                                </>
                              ) : (
                                <>
                                  <span>✉️ Gửi Email Hỗ trợ giải thích</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-[#64748B] italic">
              Không tìm thấy dữ liệu thống kê tổng quan.
            </div>
          )}
        </main>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
