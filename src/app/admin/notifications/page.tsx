"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface CampaignItem {
  id: string;
  subject: string;
  target: "ALL" | "STUDENT" | "PREMIUM";
  content: string;
  sentCount: number;
  createdAt: string;
}

interface CampaignStats {
  totalUsers: number;
  studentUsers: number;
  premiumUsers: number;
  totalCampaigns: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
}

function CustomSelect({ value, onChange, options, placeholder, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      {isOpen && (
        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white hover:border-slate-300 transition duration-200 cursor-pointer focus:border-rose-800 focus:outline-none font-bold"
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold transition duration-155 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-rose-50 text-rose-800"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="text-rose-800 text-[10px]">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleCommand = (command: string, arg: string = "") => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertVariable = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode("{name}");
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 items-center bg-slate-50 border-b border-slate-200 p-2 text-xs font-bold text-slate-700">
        <button
          type="button"
          onClick={() => handleCommand("bold")}
          className="h-7 w-7 rounded hover:bg-slate-200/85 flex items-center justify-center cursor-pointer text-slate-800 font-extrabold"
          title="In đậm (Bold)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleCommand("italic")}
          className="h-7 w-7 rounded hover:bg-slate-200/85 flex items-center justify-center italic cursor-pointer text-slate-800"
          title="In nghiêng (Italic)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleCommand("underline")}
          className="h-7 w-7 rounded hover:bg-slate-200/85 flex items-center justify-center underline cursor-pointer text-slate-800"
          title="Gạch chân (Underline)"
        >
          U
        </button>
        
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        
        <button
          type="button"
          onClick={() => handleCommand("formatBlock", "h2")}
          className="px-2 h-7 rounded hover:bg-slate-200/85 flex items-center justify-center cursor-pointer font-extrabold text-[10px] text-slate-800"
          title="Tiêu đề H2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleCommand("formatBlock", "p")}
          className="px-2 h-7 rounded hover:bg-slate-200/85 flex items-center justify-center cursor-pointer text-[10px] text-slate-800 font-bold"
          title="Văn bản thường"
        >
          Văn bản
        </button>
        
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        
        <button
          type="button"
          onClick={() => handleCommand("insertUnorderedList")}
          className="px-2 h-7 rounded hover:bg-slate-200/85 flex items-center justify-center gap-1 cursor-pointer text-[10px] text-slate-800"
          title="Danh sách gạch đầu dòng"
        >
          • Danh sách
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={insertVariable}
          className="px-2.5 h-7 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg flex items-center justify-center gap-1 cursor-pointer text-[10px]"
          title="Chèn tên học viên động"
        >
          + Chèn {"{name}"}
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        className="w-full min-h-[180px] p-4 text-xs text-slate-700 focus:outline-none bg-white prose max-w-none focus:ring-1 focus:ring-rose-800 leading-relaxed"
        style={{ outline: "none" }}
      />
    </div>
  );
}

export default function AdminNotificationsPage() {
  const { user, logout } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form states
  const [selectedTarget, setSelectedTarget] = useState("ALL");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("<h2>Chào {name},</h2><p>Đã đến giờ học bài tiếng Anh hôm nay của bạn rồi...</p>");
  const [sendLoading, setSendLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Scheduled Campaign states
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Confirm Modals
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchCampaignData = async () => {
    try {
      const res = await fetch("/api/admin/notifications/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setStats(data.stats);
      } else {
        setErrorMsg("Không thể tải thông tin chiến dịch thông báo.");
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledList = async () => {
    try {
      const res = await fetch("/api/admin/notifications/scheduled");
      if (res.ok) {
        const data = await res.json();
        setScheduledList(data.scheduled || []);
      }
    } catch (e) {
      console.error("Failed to load schedules:", e);
    }
  };

  const handleScheduleCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formContent.trim() || !scheduleDate) {
      showNotification("Vui lòng điền tiêu đề, nội dung và thời gian đặt lịch.", "error");
      return;
    }

    const schedTime = new Date(scheduleDate);
    if (isNaN(schedTime.getTime()) || schedTime <= new Date()) {
      showNotification("Thời gian gửi phải ở thời điểm tương lai.", "error");
      return;
    }

    setIsScheduling(true);
    try {
      const res = await fetch("/api/admin/notifications/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formSubject.trim(),
          content: formContent.trim(),
          target: selectedTarget,
          scheduledFor: scheduleDate,
        }),
      });

      if (res.ok) {
        showNotification("Đã đặt lịch gửi thông báo thành công!");
        setFormSubject("");
        setFormContent("<h2>Chào {name},</h2><p>Đã đến giờ học bài tiếng Anh hôm nay của bạn rồi...</p>");
        setScheduleDate("");
        fetchScheduledList();
      } else {
        const err = await res.json();
        showNotification(err.error || "Không thể đặt lịch gửi.", "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Lỗi kết nối mạng.", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy bỏ và xóa lịch gửi thông báo này?")) return;
    try {
      const res = await fetch(`/api/admin/notifications/scheduled/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Đã hủy và xóa lịch gửi thành công.");
        fetchScheduledList();
      } else {
        showNotification("Lỗi xóa lịch gửi.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng.", "error");
    }
  };

  const handleProcessSchedules = async () => {
    setProcessLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/scheduled/process", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Đã quét gửi thành công ${data.processedCount} chiến dịch, ${data.emailsSentCount} email.`);
        fetchScheduledList();
        fetchCampaignData();
      } else {
        const err = await res.json();
        showNotification(err.error || "Gửi thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng.", "error");
    } finally {
      setProcessLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchCampaignData();
      fetchScheduledList();
    }
  }, [user]);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formContent.trim()) {
      showNotification("Tiêu đề và nội dung không được để trống.", "error");
      return;
    }

    const recipientCount = 
      selectedTarget === "ALL" 
        ? stats?.totalUsers 
        : selectedTarget === "STUDENT" 
        ? stats?.studentUsers 
        : stats?.premiumUsers;

    setConfirmModal({
      title: "Gửi chiến dịch thông báo",
      message: `Bạn có chắc chắn muốn gửi chiến dịch này tới khoảng ${recipientCount || 0} học viên thuộc nhóm đối tượng mục tiêu? Hành động này sẽ gửi email đồng loạt.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setSendLoading(true);
        try {
          const res = await fetch("/api/admin/notifications/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: formSubject.trim(),
              target: selectedTarget,
              content: formContent.trim(),
            }),
          });

          if (res.ok) {
            const data = await res.json();
            showNotification(`Đã gửi thành công tới ${data.sentCount} học viên!`);
            setFormSubject("");
            setFormContent("");
            fetchCampaignData();
          } else {
            const err = await res.json();
            showNotification(err.error || "Lỗi gửi chiến dịch.", "error");
          }
        } catch (error) {
          console.error("Failed to send campaign:", error);
          showNotification("Lỗi kết nối máy chủ.", "error");
        } finally {
          setSendLoading(false);
        }
      }
    });
  };

  const handleTriggerDailyRemind = async () => {
    setConfirmModal({
      title: "Kích hoạt nhắc nhở đứt Streak",
      message: "Hệ thống sẽ quét toàn bộ những học viên chưa hoàn thành bài học nào ngày hôm nay và gửi email nhắc nhở ôn tập để giữ Streak. Bạn có muốn tiếp tục?",
      onConfirm: async () => {
        setConfirmModal(null);
        setTriggerLoading(true);
        try {
          const res = await fetch("/api/admin/notifications/remind", {
            method: "POST",
          });

          if (res.ok) {
            const data = await res.json();
            showNotification(`Đã gửi cảnh báo đứt Streak thành công tới ${data.notifiedCount} học viên!`);
          } else {
            const err = await res.json();
            showNotification(err.error || "Không có học viên nào cần nhắc nhở hôm nay.", "error");
          }
        } catch (error) {
          console.error("Failed to trigger remind:", error);
          showNotification("Lỗi kết nối máy chủ.", "error");
        } finally {
          setTriggerLoading(false);
        }
      }
    });
  };

  if (!user) return null;

  // Client-Side Authorization check
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
      <AdminSidebar currentPath="/admin/notifications" />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Quản lý Thông báo & Chiến dịch Nhắc nhở</h2>
          <div className="flex items-center gap-3 relative">
            <span className="text-xs text-slate-500 font-bold">ADMIN</span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
              aria-label="User menu"
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

          {/* Stats Summary Panel */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Học viên Free (Student)</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.studentUsers}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Đối tượng tiếp thị chính</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-inner">
                  👤
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Học viên Premium</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.premiumUsers}</h3>
                  <p className="text-[10px] text-amber-700 font-bold">Đối tượng giữ chân cốt lõi</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shadow-inner">
                  💎
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Chiến dịch đã gửi</span>
                  <h3 className="text-2xl font-serif font-black text-rose-950">{stats.totalCampaigns}</h3>
                  <p className="text-[10px] text-rose-700 font-bold">Nhật ký chiến dịch</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-800 shadow-inner">
                  ✉️
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">Kích hoạt nhanh hệ thống</h3>
              <p className="text-xs text-slate-500">Gửi cảnh báo đứt chuỗi Streak học tập cho các học viên chưa mở bài học hôm nay.</p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleTriggerDailyRemind}
                disabled={triggerLoading}
                className="px-4 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {triggerLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                    <span>Đang gửi nhắc nhở...</span>
                  </>
                ) : (
                  <>
                    <span>🔥 Kích hoạt cảnh báo đứt Streak hôm nay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Send Broadcast Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight border-b border-slate-100 pb-3">
                  Soạn thảo Chiến dịch gửi Email hàng loạt
                </h3>
                
                <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Đối tượng nhận thư</label>
                      <CustomSelect
                        value={selectedTarget}
                        onChange={setSelectedTarget}
                        options={[
                          { value: "ALL", label: `Tất cả học viên (${stats?.totalUsers || 0})` },
                          { value: "STUDENT", label: `Thành viên thường / Free (${stats?.studentUsers || 0})` },
                          { value: "PREMIUM", label: `Thành viên Premium (${stats?.premiumUsers || 0})` },
                        ]}
                        placeholder="Chọn đối tượng"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center">
                      <span className="font-bold text-slate-700 block mb-0.5">💡 Thẻ nội dung động hỗ trợ</span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Dùng thẻ <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-rose-800">{`{name}`}</code> trong nội dung để tự động thay thế bằng tên của học viên nhận thư.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tiêu đề Email (Subject)</label>
                    <input
                      type="text"
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Nhập tiêu đề thư thu hút học viên học bài..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-rose-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nội dung Email (Định dạng Word / Rich Text)</label>
                    <RichTextEditor
                      value={formContent}
                      onChange={setFormContent}
                    />
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="sendMode"
                            checked={!scheduleDate}
                            onChange={() => setScheduleDate("")}
                            className="text-rose-800 focus:ring-rose-800"
                          />
                          Gửi ngay lập tức
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="sendMode"
                            checked={!!scheduleDate}
                            onChange={() => setScheduleDate(new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16))}
                            className="text-rose-800 focus:ring-rose-800"
                          />
                          Đặt lịch hẹn giờ
                        </label>
                      </div>

                      {scheduleDate && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase shrink-0">Thời gian:</span>
                          <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-rose-800"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      {scheduleDate ? (
                        <button
                          type="button"
                          onClick={handleScheduleCampaign}
                          disabled={isScheduling}
                          className="px-5 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                        >
                          {isScheduling ? "Đang đặt lịch..." : "📅 Đặt lịch gửi"}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={sendLoading}
                          className="px-5 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                        >
                          {sendLoading ? "Đang gửi email..." : "🚀 Gửi ngay lập tức"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Column 2: History logs */}
            <div className="lg:col-span-1 space-y-6">
              {/* Scheduled Notifications list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight">
                    Chiến dịch đang Đặt lịch
                  </h3>
                  <button
                    type="button"
                    onClick={handleProcessSchedules}
                    disabled={processLoading}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-300 rounded-lg text-[9px] font-black transition uppercase cursor-pointer"
                    title="Chạy quét gửi các email hẹn giờ đến hạn ngay lập tức"
                  >
                    {processLoading ? "Đang quét..." : "⚡ Quét gửi"}
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 text-xs overflow-y-auto max-h-[220px] pr-1">
                  {scheduledList.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-6">Không có email nào đang đặt lịch.</p>
                  ) : (
                    scheduledList.map((s) => (
                      <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-800 line-clamp-1" title={s.subject}>
                            {s.subject}
                          </span>
                          <span className={`shrink-0 border font-extrabold px-1 py-0.5 rounded text-[7px] uppercase tracking-wide ${
                            s.sent 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                              : "bg-amber-50 text-amber-800 border-amber-100 animate-pulse"
                          }`}>
                            {s.sent ? "Đã gửi" : "Chờ gửi"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span>Hẹn giờ: {new Date(s.scheduledFor).toLocaleString("vi-VN")}</span>
                          {!s.sent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="text-rose-800 hover:underline font-extrabold"
                            >
                              Hủy bỏ
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* History logs card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-serif font-extrabold text-sm text-rose-950 tracking-tight border-b border-slate-100 pb-3">
                  Nhật ký Chiến dịch đã gửi
                </h3>
                
                <div className="divide-y divide-slate-100 text-xs overflow-y-auto max-h-[360px] pr-1">
                  {loading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-10">Chưa có chiến dịch nào được gửi đi.</p>
                  ) : (
                    campaigns.map((c) => (
                      <div key={c.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-800 line-clamp-1" title={c.subject}>
                            {c.subject}
                          </span>
                          <span className="shrink-0 bg-rose-50 text-rose-800 border border-rose-100 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                            {c.target}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Đã gửi thành công tới <strong>{c.sentCount}</strong> học viên
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {new Date(c.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-rose-950">{confirmModal.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-rose-800 text-white text-xs font-bold hover:bg-rose-900 transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

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
