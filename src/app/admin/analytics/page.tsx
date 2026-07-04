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

interface CohortItem {
  cohort: string;
  size: number;
  retention: number[];
}

interface TopicItem {
  topic: string;
  count: number;
  percentage: number;
}

interface StreakDistItem {
  range: string;
  count: number;
}

interface FunnelItem {
  stage: string;
  count: number;
  percentage: number;
}

interface TopLessonItem {
  title: string;
  level: string;
  completions: number;
}

interface ChallengingLessonItem {
  title: string;
  level: string;
  avgScore: number;
}

export default function AdminAnalyticsPage() {
  const { user, logout } = useAuth();
  const [cohorts, setCohorts] = useState<CohortItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [streakDist, setStreakDist] = useState<StreakDistItem[]>([]);
  const [avgQuizScore, setAvgQuizScore] = useState<number>(85);
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [topLessons, setTopLessons] = useState<TopLessonItem[]>([]);
  const [challengingLessons, setChallengingLessons] = useState<ChallengingLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Date range filters
  const [range, setRange] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalyticsData = async (rangeVal = range, start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        range: rangeVal,
        startDate: start,
        endDate: end,
      });
      const res = await fetch(`/api/admin/stats/analytics?${q}`);
      if (res.ok) {
        const data = await res.json();
        setCohorts(data.cohorts);
        setTopics(data.topics);
        setStreakDist(data.streakDistribution);
        setAvgQuizScore(data.avgQuizScore);
        setFunnel(data.funnel || []);
        setTopLessons(data.topLessons || []);
        setChallengingLessons(data.challengingLessons || []);
      } else {
        setErrorMsg("Không thể tải báo cáo phân tích chuyên sâu.");
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["DAILY LEARN VN - REPORT PHAN TICH HOC TAP"],
      ["Ngay xuat", new Date().toLocaleString("vi-VN")],
      [],
      ["1. THONG KE COHORT RETENTION"],
      ["Cohort Tuan Dang Ky", "Quy mo", "Tuan 0", "Tuan 1", "Tuan 2", "Tuan 3", "Tuan 4"],
      ...cohorts.map((c) => [
        c.cohort,
        `${c.size} hoc vien`,
        ...c.retention.map((v) => `${v}%`)
      ]),
      [],
      ["2. PHIEU CHUYEN DOI HOC TAP (FUNNEL)"],
      ["Giai doan", "So luong", "Ti le"],
      ...funnel.map((f) => [f.stage, `${f.count} hoc vien`, `${f.percentage}%`]),
      [],
      ["3. TOP BAI HOC HOAN THANH NHIEU NHAT"],
      ["Tieu de bai hoc", "Trinh do", "Luot hoan thanh"],
      ...topLessons.map((l) => [l.title, l.level, `${l.completions} luot`]),
      [],
      ["4. TOP BAI HOC THU THACH NHAT (DIEM QUIZ THAP NHAT)"],
      ["Tieu de bai hoc", "Trinh do", "Diem Quiz trung binh"],
      ...challengingLessons.map((l) => [l.title, l.level, `${l.avgScore}%`])
    ];

    const csvContent = "\uFEFF" + csvRows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `daily_learn_analytics_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      if (range !== "custom" || (startDate && endDate)) {
        fetchAnalyticsData(range, startDate, endDate);
      }
    }
  }, [user, range, startDate, endDate]);

  // Helper to color code retention cell backgrounds
  const getHeatmapColor = (pct: number) => {
    if (pct === 0) return "bg-slate-50 text-slate-400";
    if (pct < 30) return "bg-rose-50 text-rose-800 border-rose-100";
    if (pct < 50) return "bg-rose-100 text-rose-900 border-rose-200";
    if (pct < 70) return "bg-rose-200 text-rose-950 font-bold border-rose-300";
    if (pct < 85) return "bg-rose-300/90 text-rose-950 font-extrabold border-rose-300";
    return "bg-rose-400/90 text-rose-950 font-black border-rose-400";
  };

  if (!user) return null;

  if (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-sans text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin/analytics" />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <div className="flex items-center gap-4">
            <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Phân tích Chuyên sâu & Báo cáo</h2>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              📥 Xuất báo cáo CSV
            </button>
          </div>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
            >
              <img
                src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full border border-rose-800"
              />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
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

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-[#EBE6DD] bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#8C8375] hover:text-[#4E4941] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                📊 Xuất Báo Cáo Phân Tích (CSV)
              </button>
              <a
                href={`/api/admin/reports/export?type=learning&range=${range}&startDate=${startDate}&endDate=${endDate}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                download
              >
                🎓 Xuất Lịch Sử Học Tập (CSV)
              </a>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-800 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Cohort Heatmap Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">Học viên quay lại học bài theo Cohort (Cohort Retention)</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Phần trăm học viên trong nhóm đăng ký hàng tuần quay lại thực hiện hoàn thành bài học trong các tuần tiếp theo.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                        <th className="px-5 py-3.5">Cohort Tuần đăng ký</th>
                        <th className="px-5 py-3.5 text-center">Quy mô</th>
                        <th className="px-5 py-3.5 text-center">Tuần 0</th>
                        <th className="px-5 py-3.5 text-center">Tuần 1</th>
                        <th className="px-5 py-3.5 text-center">Tuần 2</th>
                        <th className="px-5 py-3.5 text-center">Tuần 3</th>
                        <th className="px-5 py-3.5 text-center">Tuần 4</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {cohorts.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-5 py-3 font-bold text-slate-800 whitespace-nowrap">{item.cohort}</td>
                          <td className="px-5 py-3 text-center font-mono font-bold text-slate-600">{item.size} học viên</td>
                          {item.retention.map((val, rIdx) => {
                            const isPlaceholder = val === 0 && rIdx > (4 - idx); // future weeks
                            return (
                              <td
                                key={rIdx}
                                className={`px-5 py-3 text-center font-mono text-xs border border-slate-100 transition duration-150 ${
                                  isPlaceholder ? "bg-slate-50/30 text-slate-300" : getHeatmapColor(val)
                                }`}
                              >
                                {isPlaceholder ? "-" : `${val}%`}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engagement Funnel Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">Phễu chuyển đổi tương tác (Engagement Funnel)</h3>
                  <p className="text-xs text-slate-500">
                    Tỷ lệ học viên hoạt động qua các giai đoạn từ đăng ký tài khoản đến nâng cấp Premium.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {funnel.map((item, idx) => {
                    const colors = [
                      "bg-slate-50 border-slate-200 text-slate-800",
                      "bg-rose-50/40 border-rose-100 text-rose-905",
                      "bg-rose-50/80 border-rose-100 text-rose-950",
                      "bg-rose-100/60 border-rose-200 text-rose-950",
                      "bg-rose-200/60 border-rose-200 text-rose-950"
                    ];
                    return (
                      <div key={item.stage} className={`border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden ${colors[idx % colors.length]}`}>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold block text-slate-500 uppercase tracking-wide">{item.stage}</span>
                          <h4 className="text-lg font-serif font-black">{item.count} học viên</h4>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-2">
                          <span className="text-[9px] text-slate-500 font-bold">Tỉ lệ</span>
                          <span className="font-mono font-bold text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Favorites Topics Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
                  <div>
                    <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">Chủ đề bài học được yêu thích nhất</h3>
                    <p className="text-xs text-slate-500">Tỉ lệ học viên lựa chọn chủ đề quan tâm trong hồ sơ đăng ký.</p>
                  </div>
                  
                  <div className="flex-1 space-y-4 pt-2">
                    {topics.map((t) => (
                      <div key={t.topic} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>📚 {t.topic}</span>
                          <span>{t.count} học viên ({t.percentage}%)</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-rose-700 to-rose-900 rounded-full transition-all duration-1000"
                            style={{ width: `${t.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">Phân bố chuỗi ngày Streak học tập</h3>
                    <p className="text-xs text-slate-500">Tỷ lệ học viên duy trì chuỗi học liên tiếp trên hệ thống.</p>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-4 pt-4">
                    {streakDist.map((s, idx) => {
                      const icons = ["💤", "🌱", "🔥", "👑"];
                      const colors = [
                        "border-slate-200 bg-slate-50/50 text-slate-800",
                        "border-emerald-200 bg-emerald-50/30 text-emerald-800",
                        "border-orange-200 bg-orange-50/30 text-orange-800",
                        "border-amber-200 bg-amber-50/30 text-amber-800"
                      ];
                      return (
                        <div key={s.range} className={`border rounded-2xl p-4 text-center space-y-1 ${colors[idx % colors.length]}`}>
                          <span className="text-2xl block">{icons[idx % icons.length]}</span>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider block text-slate-500">Cột mốc {s.range}</span>
                          <h4 className="text-xl font-serif font-black">{s.count} học viên</h4>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-2 text-center text-xs">
                    <span className="text-slate-500 font-bold">Chất lượng học tập trung bình:</span>{" "}
                    <span className="text-rose-900 font-extrabold font-mono">Đạt {avgQuizScore}% câu đúng</span> trong các bài trắc nghiệm.
                  </div>
                </div>
              </div>

              {/* Bottom Section: Top & Challenging Lessons */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Completed Lessons */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">🏆 Top 3 Bài học hoàn thành nhiều nhất</h3>
                    <p className="text-xs text-slate-500">Những nội dung thu hút và được học viên hoàn thành nhiều nhất.</p>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {topLessons.map((l, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="space-y-1 pr-4">
                          <span className="font-bold text-slate-800 line-clamp-1">{l.title}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{l.level}</span>
                        </div>
                        <div className="shrink-0 font-mono font-bold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          🔥 {l.completions} lượt hoàn thành
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenging Lessons */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">⚠️ Top 3 Bài học thử thách nhất</h3>
                    <p className="text-xs text-slate-500">Những nội dung thử thách nhất với học viên (điểm thi trắc nghiệm trung bình thấp nhất).</p>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {challengingLessons.map((l, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="space-y-1 pr-4">
                          <span className="font-bold text-slate-800 line-clamp-1">{l.title}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{l.level}</span>
                        </div>
                        <div className="shrink-0 font-mono font-bold text-rose-950 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          🎯 Điểm TB: {l.avgScore}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
