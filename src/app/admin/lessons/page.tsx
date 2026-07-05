"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface AdminLessonItem {
  id: string;
  title: string;
  tags: string[];
  level: string;
  status: "DRAFT" | "PUBLISHED";
  sourceDomain: string;
  summary: string[];
  actionableStep: string;
  createdAt: string;
  _count: {
    quizzes: number;
  };
  mediaFiles?: any[];
}

const TOPICS = [
  { id: "Tech", label: "Công nghệ / Lập trình" },
  { id: "Business", label: "Kinh doanh / Khởi nghiệp" },
  { id: "SoftSkills", label: "Kỹ năng mềm" },
  { id: "Design", label: "Thiết kế / UI/UX" },
  { id: "Health", label: "Sức khỏe / Đời sống" },
];

import CustomSelect from "@/components/CustomSelect";

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [lessons, setLessons] = useState<AdminLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Media integration states
  const [attachedMediaFiles, setAttachedMediaFiles] = useState<any[]>([]);
  const [originalMediaFiles, setOriginalMediaFiles] = useState<any[]>([]);
  const [isMediaLookupOpen, setIsMediaLookupOpen] = useState(false);
  const [allMediaFiles, setAllMediaFiles] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Backend stats & pagination counters
  const [totalLessons, setTotalLessons] = useState(0);
  const [publishedLessons, setPublishedLessons] = useState(0);
  const [draftLessons, setDraftLessons] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSourceDomain, setFormSourceDomain] = useState("");
  const [formLevel, setFormLevel] = useState("Beginner");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formSummary, setFormSummary] = useState<string[]>([""]);
  const [formActionableStep, setFormActionableStep] = useState("");
  const [formStatus, setFormStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSteps, setFormSteps] = useState<any[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Preview Lesson state
  const [previewLesson, setPreviewLesson] = useState<AdminLessonItem | null>(null);

  const fetchAllMediaFiles = async () => {
    setLookupLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setAllMediaFiles(data.files || []);
      }
    } catch (e) {
      console.error("Failed to fetch all media files:", e);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUploadMediaDirect = async (file: File) => {
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (editingLessonId) {
        formData.append("lessonId", editingLessonId);
      }
      
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedMediaFiles((prev) => [...prev, data.file]);
        showNotification("Đã tải tệp lên và đính kèm thành công!");
      } else {
        const data = await res.json();
        showNotification(data.error || "Tải tệp lên thất bại.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi mạng khi tải lên tệp.", "error");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleToggleMediaAssociation = (file: any) => {
    const isAttached = attachedMediaFiles.some((f) => f.id === file.id);
    if (isAttached) {
      setAttachedMediaFiles((prev) => prev.filter((f) => f.id !== file.id));
    } else {
      setAttachedMediaFiles((prev) => [...prev, file]);
    }
  };

    const handleAddStep = () => {
    setFormSteps([
      ...formSteps,
      {
        stepNumber: formSteps.length + 1,
        title: "",
        instruction: "",
        imageUrl: "/figma_preset.png",
        hotspotX: 50,
        hotspotY: 50,
        hotspotRadius: 5
      }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = formSteps.filter((_, idx) => idx !== index);
    const recalculated = updated.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1
    }));
    setFormSteps(recalculated);
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const updated = [...formSteps];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setFormSteps(updated);
  };

  const handleImageClick = (index: number, e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    handleStepChange(index, "hotspotX", x);
    handleStepChange(index, "hotspotY", y);
  };

  const resetForm = () => {
    setEditingLessonId(null);
    setFormTitle("");
    setFormSourceDomain("");
    setFormLevel("Beginner");
    setFormTags([]);
    setFormSummary([""]);
    setFormActionableStep("");
    setFormStatus("DRAFT");
    setAttachedMediaFiles([]);
    setOriginalMediaFiles([]);
    setFormSteps([]);
  };

  const handleCreateClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setFormTitle(lesson.title);
    setFormSourceDomain(lesson.sourceDomain);
    setFormLevel(lesson.level);
    setFormTags(lesson.tags);
    setFormSummary(lesson.summary);
    setFormActionableStep(lesson.actionableStep);
    setFormStatus(lesson.status);
    setAttachedMediaFiles(lesson.mediaFiles || []);
    setOriginalMediaFiles(lesson.mediaFiles || []);
    setFormSteps(lesson.steps || []);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    const titleClean = formTitle.trim();
    const domainClean = formSourceDomain.trim();
    const actionClean = formActionableStep.trim();
    const summaryArray = formSummary
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!titleClean) {
      showNotification("Tiêu đề bài học không được để trống.", "error");
      return;
    }
    if (!domainClean) {
      showNotification("Nguồn bài học (domain) không được để trống.", "error");
      return;
    }
    if (!actionClean) {
      showNotification("Hành động áp dụng không được để trống.", "error");
      return;
    }

    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainClean)) {
      showNotification("Nguồn bài học (domain) không hợp lệ (Ví dụ: techcrunch.com).", "error");
      return;
    }

    if (formTags.length === 0) {
      showNotification("Vui lòng chọn ít nhất 1 chủ đề (tag).", "error");
      return;
    }

    if (summaryArray.length === 0) {
      showNotification("Bài viết phải có ít nhất 1 ý tóm tắt.", "error");
      return;
    }

    setConfirmModal({
      title: editingLessonId ? "Lưu thay đổi bài học" : "Tạo bài học mới",
      message: editingLessonId
        ? "Bạn có chắc chắn muốn lưu lại các chỉnh sửa cho bài viết này?"
        : "Bạn có chắc chắn muốn tạo thêm một bài viết mới không?",
      onConfirm: async () => {
        setConfirmModal(null);
        setFormSubmitting(true);
        setErrorMsg(null);

        const payload = {
          title: titleClean,
          sourceDomain: domainClean,
          level: formLevel,
          tags: formTags,
          summary: summaryArray,
          actionableStep: actionClean,
          status: formStatus,
          steps: formSteps.map((s, idx) => ({
            stepNumber: idx + 1,
            title: s.title || "",
            instruction: s.instruction || "",
            imageUrl: s.imageUrl || "/figma_preset.png",
            hotspotX: s.hotspotX || 50,
            hotspotY: s.hotspotY || 50,
            hotspotRadius: s.hotspotRadius || 5
          })),
        };

        try {
          const url = editingLessonId 
            ? `/api/admin/lessons/${editingLessonId}`
            : "/api/admin/lessons";
          const method = editingLessonId ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            const savedLessonId = data.lesson.id;

            // Sync media file assignments
            const filesToLink = attachedMediaFiles.filter(
              (file) => !originalMediaFiles.some((orig) => orig.id === file.id)
            );
            const filesToUnlink = originalMediaFiles.filter(
              (orig) => !attachedMediaFiles.some((file) => file.id === orig.id)
            );

            // Execute links
            for (const file of filesToLink) {
              await fetch("/api/admin/media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: file.id, lessonId: savedLessonId }),
              });
            }

            // Execute unlinks
            for (const file of filesToUnlink) {
              await fetch("/api/admin/media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: file.id, lessonId: null }),
              });
            }

            setIsModalOpen(false);
            resetForm();
            await fetchLessons();
            showNotification(
              editingLessonId
                ? "Đã cập nhật bài học thành công!"
                : "Đã tạo bài học mới thành công!"
            );
          } else {
            const data = await res.json();
            setErrorMsg(data.error || "Không thể lưu thông tin bài học.");
            showNotification(data.error || "Không thể lưu thông tin bài học.", "error");
          }
        } catch (error) {
          console.error("Save lesson error:", error);
          setErrorMsg("Lỗi kết nối mạng.");
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setFormSubmitting(false);
        }
      }
    });
  };

  const fetchLessons = async (page = 1, search = "", topic = "", level = "", status = "") => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        q: search,
        topic,
        level,
        status,
      });
      const res = await fetch(`/api/admin/lessons?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons);
        setTotalLessons(data.stats.totalLessons);
        setPublishedLessons(data.stats.publishedLessons);
        setDraftLessons(data.stats.draftLessons);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setErrorMsg("Không thể tải danh sách bài viết quản trị.");
      }
    } catch (error) {
      console.error("Failed to load admin lessons:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters or page changes
  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchLessons(currentPage, searchQuery, selectedTopic, selectedLevel, selectedStatus);
    }
  }, [user, currentPage, searchQuery, selectedTopic, selectedLevel, selectedStatus]);

  // Reset page index on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, selectedLevel, selectedStatus]);

  const handlePublish = async (id: string, title: string) => {
    if (actionLoading) return;
    setConfirmModal({
      title: "Phát hành bài viết",
      message: `Bạn có chắc chắn muốn phát hành bài học "${title}"? Học viên sẽ xem được bài viết này ngay lập tức.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(id);
        try {
          const res = await fetch(`/api/admin/lessons/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PUBLISHED" }),
          });

          if (res.ok) {
            await fetchLessons();
            showNotification("Đã phát hành bài học thành công!");
          } else {
            setErrorMsg("Không thể phát hành bài học.");
            showNotification("Không thể phát hành bài học.", "error");
          }
        } catch (error) {
          console.error("Failed to publish lesson:", error);
          setErrorMsg("Lỗi kết nối.");
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (actionLoading) return;
    setConfirmModal({
      title: "Xóa bài viết",
      message: `Bạn có chắc chắn muốn xóa bài học "${title}" cùng toàn bộ câu hỏi trắc nghiệm liên quan? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(id);
        try {
          const res = await fetch(`/api/admin/lessons/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            await fetchLessons();
            showNotification("Đã xóa bài học thành công!");
          } else {
            setErrorMsg("Không thể xóa bài học.");
            showNotification("Không thể xóa bài học.", "error");
          }
        } catch (error) {
          console.error("Failed to delete lesson:", error);
          setErrorMsg("Lỗi kết nối.");
          showNotification("Lỗi kết nối mạng.", "error");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  if (!user) return null;

  // 1. Client-Side Authorization check
  if (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-sans text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
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



  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <AdminSidebar currentPath="/admin/lessons" />

      {/* Main Viewport Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Quản lý Bài học</h2>
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
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition duration-150 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
          {/* Page Title & Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-sans text-2xl font-bold tracking-tight">Quản lý nội dung bài học</h1>
              <p className="text-xs text-[#64748B] mt-0.5">Biên soạn, xuất bản bài học và trắc nghiệm củng cố.</p>
            </div>
            <button
              onClick={handleCreateClick}
              className="bg-[#334155] text-white hover:bg-[#0F172A] px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition duration-200 cursor-pointer"
            >
              + Thêm bài học mới
            </button>
          </div>

          {/* Stats card banner grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm text-center">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng số bài viết</div>
              <div className="text-2xl font-extrabold text-[#0F172A] mt-1">{totalLessons}</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm text-center">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã phát hành</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{publishedLessons}</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm text-center">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Bản nháp</div>
              <div className="text-2xl font-extrabold text-[#64748B] mt-1">{draftLessons}</div>
            </div>
          </div>

          {/* Error alerting */}
          {errorMsg && (
            <div className="rounded-lg bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
          )}

          {/* Filters Panel */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative col-span-1 md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề hoặc nguồn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#334155] bg-white placeholder-[#BFB8AC] transition focus:border-rose-800 focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-[#64748B]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              {/* Topic Select */}
              <CustomSelect
                value={selectedTopic}
                onChange={setSelectedTopic}
                options={[
                  { value: "", label: "Tất cả chủ đề" },
                  ...TOPICS.map((t) => ({ value: t.id, label: t.label }))
                ]}
                placeholder="Chọn chủ đề"
              />

              {/* Level / Status Selects (Combined) */}
              <div className="grid grid-cols-2 gap-2">
                <CustomSelect
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                  options={[
                    { value: "", label: "Trình độ" },
                    { value: "Beginner", label: "Beginner" },
                    { value: "Experienced", label: "Experienced" },
                  ]}
                  placeholder="Trình độ"
                />

                <CustomSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: "", label: "Trạng thái" },
                    { value: "DRAFT", label: "Bản nháp" },
                    { value: "PUBLISHED", label: "Đã phát hành" },
                  ]}
                  placeholder="Trạng thái"
                />
              </div>
            </div>
          </div>

          {/* Lessons List Table Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64748B] border-t-transparent"></div>
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-20 text-[#64748B] italic">
                {totalLessons === 0
                  ? "Chưa có bài viết nào được tạo. Hãy nhấn nút thêm bài viết mới để bắt đầu."
                  : "Không tìm thấy bài viết nào phù hợp với bộ lọc."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="px-6 py-4">Bài học</th>
                      <th className="px-6 py-4">Chủ đề</th>
                      <th className="px-6 py-4">Trình độ</th>
                      <th className="px-6 py-4 text-center">Trắc nghiệm</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#334155]">
                    {lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-[#F8FAFC] transition duration-150">
                        <td className="px-6 py-4 font-semibold text-[#0F172A]">
                          <div>{lesson.title}</div>
                          <div className="text-[10px] font-normal text-[#64748B] font-sans italic mt-0.5">
                            nguồn: {lesson.sourceDomain}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {lesson.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#64748B]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">{lesson.level}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-[#0F172A]">
                          {lesson._count.quizzes}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              lesson.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-500 border border-gray-200"
                            }`}
                          >
                            {lesson.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => setPreviewLesson(lesson)}
                              className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100/60 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer"
                            >
                              Xem
                            </button>
                            {lesson.status === "DRAFT" && (
                              <button
                                onClick={() => handlePublish(lesson.id, lesson.title)}
                                disabled={actionLoading !== null}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/60 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer disabled:opacity-50"
                              >
                                Phát hành
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(lesson)}
                              disabled={actionLoading !== null}
                              className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/60 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer disabled:opacity-50"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(lesson.id, lesson.title)}
                              disabled={actionLoading !== null}
                              className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/60 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition duration-150 cursor-pointer disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#F1F5F9]">
                  <div className="text-xs text-[#64748B]">
                    Hiển thị từ <span className="font-bold text-[#0F172A]">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
                    <span className="font-bold text-[#0F172A]">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    trong tổng số <span className="font-bold text-[#0F172A]">{totalCount}</span> bài viết
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-rose-800 text-white"
                              : "border border-[#CBD5E1] text-[#64748B] hover:bg-white"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </main>

        {/* Create/Edit Lesson Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F1F5F9]">
                <h3 className="font-sans font-extrabold text-lg text-rose-950">
                  {editingLessonId ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A] focus:outline-none cursor-pointer text-sm font-bold"
                >
                  Đóng
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tiêu đề bài học</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="block w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#334155] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-rose-800 focus:outline-none"
                    placeholder="Nhập tiêu đề học tập..."
                  />
                </div>

                {/* Source Domain */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Nguồn bài học (Domain)</label>
                  <input
                    type="text"
                    required
                    value={formSourceDomain}
                    onChange={(e) => setFormSourceDomain(e.target.value)}
                    className="block w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#334155] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-rose-800 focus:outline-none"
                    placeholder="Ví dụ: techcrunch.com"
                  />
                </div>

                {/* Level selection */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Trình độ bài viết</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                      <input
                        type="radio"
                        name="formLevel"
                        value="Beginner"
                        checked={formLevel === "Beginner"}
                        onChange={() => setFormLevel("Beginner")}
                        className="cursor-pointer"
                      />
                      <span>Beginner</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                      <input
                        type="radio"
                        name="formLevel"
                        value="Experienced"
                        checked={formLevel === "Experienced"}
                        onChange={() => setFormLevel("Experienced")}
                        className="cursor-pointer"
                      />
                      <span>Experienced</span>
                    </label>
                  </div>
                </div>

                {/* Topic tags checkboxes */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Chủ đề (Tags)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPICS.map((topic) => {
                      const isSelected = formTags.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormTags(formTags.filter((t) => t !== topic.id));
                            } else {
                              setFormTags([...formTags, topic.id]);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-2xs font-bold transition duration-155 cursor-pointer ${
                            isSelected
                              ? "bg-rose-50 border-rose-500 text-rose-800"
                              : "bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:border-[#BFB8AC]"
                          }`}
                        >
                          <span>{topic.label}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary points list (Dynamic inputs) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    Các ý tóm tắt bài học (Mỗi ý một dòng)
                  </label>
                  <div className="space-y-2">
                    {formSummary.map((point, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#64748B] w-4">{index + 1}.</span>
                        <input
                          type="text"
                          required
                          value={point}
                          onChange={(e) => {
                            const newSummary = [...formSummary];
                            newSummary[index] = e.target.value;
                            setFormSummary(newSummary);
                          }}
                          className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#334155] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-rose-800 focus:outline-none"
                          placeholder={`Nhập ý tóm tắt thứ ${index + 1}...`}
                        />
                        {formSummary.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormSummary(formSummary.filter((_, i) => i !== index));
                            }}
                            className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition duration-150 cursor-pointer"
                            title="Xóa ý này"
                          >
                            {/* Trash Icon */}
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formSummary.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setFormSummary([...formSummary, ""])}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition duration-150 cursor-pointer"
                    >
                      + Thêm ý tóm tắt
                    </button>
                  )}
                </div>

                {/* Actionable Step */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Hành động áp dụng (Actionable Step)</label>
                  <input
                    type="text"
                    required
                    value={formActionableStep}
                    onChange={(e) => setFormActionableStep(e.target.value)}
                    className="block w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#334155] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-rose-800 focus:outline-none"
                    placeholder="Hành động cụ thể người học cần thực hành..."
                  />
                </div>

                {/* Status selection */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Trạng thái phát hành</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                      <input
                        type="radio"
                        name="formStatus"
                        value="DRAFT"
                        checked={formStatus === "DRAFT"}
                        onChange={() => setFormStatus("DRAFT")}
                        className="cursor-pointer"
                      />
                      <span>Nháp (DRAFT)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                      <input
                        type="radio"
                        name="formStatus"
                        value="PUBLISHED"
                        checked={formStatus === "PUBLISHED"}
                        onChange={() => setFormStatus("PUBLISHED")}
                        className="cursor-pointer"
                      />
                      <span>Xuất bản (PUBLISHED)</span>
                    </label>
                  </div>
                </div>

                {/* SECTION 2: INTERACTIVE STEPS EDITOR */}
                <div className="border-t border-[#E2E8F0] pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Các bước thao tác thực hành (Hotspots)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>+</span> Thêm bước thao tác
                    </button>
                  </div>

                  {formSteps.length === 0 ? (
                    <p className="text-2xs text-[#BFB8AC] italic">Chưa có bước thực hành thao tác nào cho bài học này.</p>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {formSteps.map((step, index) => (
                        <div key={index} className="border border-[#E2E8F0] rounded-xl p-3 bg-slate-50/50 space-y-3 relative">
                          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                              Bước {step.stepNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(index)}
                              className="text-[9px] font-bold text-red-500 hover:text-red-700 transition cursor-pointer"
                            >
                              Xóa bước
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-[#4E4941] uppercase tracking-wider block">Tiêu đề bước</label>
                                <input
                                  type="text"
                                  placeholder="Ví dụ: Chọn công cụ Frame"
                                  value={step.title || ""}
                                  onChange={(e) => handleStepChange(index, "title", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-rose-800"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-[#4E4941] uppercase tracking-wider block">Nội dung hướng dẫn</label>
                                <textarea
                                  rows={2}
                                  placeholder="Hướng dẫn học viên..."
                                  value={step.instruction || ""}
                                  onChange={(e) => handleStepChange(index, "instruction", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-rose-800 resize-none"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-[#4E4941] uppercase tracking-wider block">Ảnh chụp giao diện</label>
                                <select
                                  value={step.imageUrl || "/figma_preset.png"}
                                  onChange={(e) => handleStepChange(index, "imageUrl", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-rose-800 cursor-pointer"
                                >
                                  <option value="/figma_preset.png">Figma (/figma_preset.png)</option>
                                  <option value="/git_terminal.png">Terminal (/git_terminal.png)</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                <div>
                                  <label className="text-[8px] font-bold text-[#8C8375] uppercase block text-center">X (%)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={step.hotspotX}
                                    onChange={(e) => handleStepChange(index, "hotspotX", parseFloat(e.target.value) || 0)}
                                    className="w-full px-1 py-0.5 rounded border border-[#CBD5E1] bg-white text-xs font-mono text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-[#8C8375] uppercase block text-center">Y (%)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={step.hotspotY}
                                    onChange={(e) => handleStepChange(index, "hotspotY", parseFloat(e.target.value) || 0)}
                                    className="w-full px-1 py-0.5 rounded border border-[#CBD5E1] bg-white text-xs font-mono text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-[#8C8375] uppercase block text-center">R (%)</label>
                                  <input
                                    type="number"
                                    value={step.hotspotRadius}
                                    onChange={(e) => handleStepChange(index, "hotspotRadius", parseInt(e.target.value) || 5)}
                                    className="w-full px-1 py-0.5 rounded border border-[#CBD5E1] bg-white text-xs font-mono text-center"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 flex flex-col justify-between items-center">
                              <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block text-center">
                                Click ảnh để định vị Hotspot
                              </span>
                              <div className="relative border border-[#CBD5E1] rounded-lg overflow-hidden shadow bg-black max-w-[180px] select-none">
                                <img
                                  src={step.imageUrl || "/figma_preset.png"}
                                  alt="Click to pick hotspot"
                                  onClick={(e) => handleImageClick(index, e)}
                                  className="w-full h-auto object-contain cursor-crosshair opacity-85 select-none"
                                />
                                <div
                                  className="absolute h-4 w-4 rounded-full border border-red-500 bg-red-500/35 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-pulse"
                                  style={{ left: `${step.hotspotX}%`, top: `${step.hotspotY}%` }}
                                >
                                  <div className="h-1 w-1 rounded-full bg-red-600" />
                                </div>
                              </div>
                              <span className="text-[8px] text-[#8C8375] italic block text-center">
                                X: {step.hotspotX}% | Y: {step.hotspotY}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media Attachments Section */}
                <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Bài giảng & Tệp phương tiện đính kèm
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          fetchAllMediaFiles();
                          setIsMediaLookupOpen(true);
                        }}
                        className="px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg text-2xs font-bold text-[#64748B] bg-white hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        Chọn từ Thư viện
                      </button>
                      <label className="px-2.5 py-1.5 bg-[#4E4941] text-white rounded-lg text-2xs font-bold transition hover:bg-[#3E3A35] shadow-sm cursor-pointer text-center">
                        {uploadingMedia ? "Đang tải..." : "Tải lên tệp mới"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingMedia}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadMediaDirect(e.target.files[0]);
                            }
                          }}
                          accept="image/*,audio/*,video/*,application/pdf"
                        />
                      </label>
                    </div>
                  </div>

                  {attachedMediaFiles.length === 0 ? (
                    <p className="text-2xs text-[#BFB8AC] italic">Chưa có tệp đính kèm nào cho bài học này.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {attachedMediaFiles.map((file) => {
                        const isImg = file.mimeType.startsWith("image/");
                        const isVid = file.mimeType.startsWith("video/");
                        const isAud = file.mimeType.startsWith("audio/");
                        const isPdfDoc = file.mimeType === "application/pdf" || file.fileName.endsWith(".pdf");

                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-[#334155]"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>
                                {isImg ? "🖼️" : isVid ? "🎥" : isAud ? "🎵" : isPdfDoc ? "📄" : "📁"}
                              </span>
                              <span className="truncate font-medium text-[#0F172A]" title={file.fileName}>
                                {file.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                ({Math.round(file.fileSize / 1024)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedMediaFiles(attachedMediaFiles.filter((f) => f.id !== file.id));
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-2xs cursor-pointer px-1.5 py-0.5 rounded border border-red-100 bg-red-50/50 hover:bg-red-50 transition"
                            >
                              Gỡ bỏ
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full flex justify-center py-2.5 rounded-lg bg-gradient-to-r from-rose-800 to-rose-900 hover:from-rose-900 hover:to-rose-950 text-white text-xs font-bold transition-all duration-200 active:translate-y-[1px] shadow-md uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? "Đang xử lý..." : editingLessonId ? "Lưu thay đổi" : "Tạo bài học mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm shadow-2xl p-6 space-y-4">
              <h3 className="font-sans font-extrabold text-base text-rose-950">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition duration-150 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-rose-800 text-white rounded-lg text-xs font-bold hover:bg-rose-900 transition duration-150 cursor-pointer"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Lesson Modal */}
        {previewLesson && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F1F5F9]">
                <h3 className="font-sans font-extrabold text-lg text-rose-950">
                  Chi tiết bài học
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewLesson(null)}
                  className="text-[#64748B] hover:text-[#0F172A] focus:outline-none cursor-pointer text-sm font-bold"
                >
                  Đóng
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[#334155]">
                <div>
                  <h4 className="font-sans text-lg font-bold text-[#0F172A]">{previewLesson.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[#64748B]">
                    <span className="font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded text-[10px]">
                      {previewLesson.sourceDomain}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-rose-800">{previewLesson.level}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Chủ đề (Tags)</span>
                  <div className="flex flex-wrap gap-1">
                    {previewLesson.tags.map((tag) => (
                      <span key={tag} className="bg-[#FAF2EB] text-[#BF753F] border border-[#F0DDC5] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Summaries */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Nội dung tóm tắt</span>
                  <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                    {previewLesson.summary.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Step */}
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-xl space-y-1">
                  <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">Hành động áp dụng</span>
                  <p className="font-sans italic text-sm leading-relaxed text-[#0F172A]">{previewLesson.actionableStep}</p>
                </div>

                {/* Attached Media files display in Preview */}
                {previewLesson.mediaFiles && previewLesson.mediaFiles.length > 0 && (
                  <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
                    <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Bài giảng & Tệp phương tiện đính kèm ({previewLesson.mediaFiles.length})
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {previewLesson.mediaFiles.map((file: any) => {
                        const isImg = file.mimeType.startsWith("image/");
                        const isVid = file.mimeType.startsWith("video/");
                        const isAud = file.mimeType.startsWith("audio/");
                        const isPdfDoc = file.mimeType === "application/pdf" || file.fileName.endsWith(".pdf");

                        return (
                          <div
                            key={file.id}
                            className="p-3 border border-[#E2E8F0] rounded-2xl bg-slate-50 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span className="truncate" title={file.fileName}>
                                {isImg ? "🖼️" : isVid ? "🎥" : isAud ? "🎵" : isPdfDoc ? "📄" : "📁"} {file.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({Math.round(file.fileSize / 1024)} KB)
                              </span>
                            </div>

                            {/* Dynamic Previews */}
                            {isImg && (
                              <div className="max-w-xs rounded-xl overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={file.fileUrl}
                                  alt={file.fileName}
                                  className="object-cover max-h-40 w-auto"
                                />
                              </div>
                            )}

                            {isVid && (
                              <div className="max-w-md rounded-xl overflow-hidden border bg-black">
                                <video
                                  src={file.fileUrl}
                                  controls
                                  className="w-full max-h-60"
                                />
                              </div>
                            )}

                            {isAud && (
                              <div className="max-w-xs">
                                <audio
                                  src={file.fileUrl}
                                  controls
                                  className="w-full h-8"
                                />
                              </div>
                            )}

                            {isPdfDoc && (
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-rose-800 hover:text-rose-950 font-bold"
                              >
                                📥 Tải xuống Slide / Tài liệu PDF
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <span className="block text-[10px] text-[#64748B]">Trắc nghiệm củng cố</span>
                    <span className="text-sm font-bold font-mono text-[#0F172A]">{previewLesson._count.quizzes} câu hỏi</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#64748B]">Trạng thái</span>
                    <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      previewLesson.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}>
                      {previewLesson.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        {toast && (
          <div className="fixed top-4 right-4 z-55 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-250 bg-white border-[#E2E8F0]">
            <div className={`h-2 w-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <p className="text-xs font-bold text-[#0F172A]">{toast.message}</p>
          </div>
        )}

        {/* Media Lookup Overlay Modal */}
        {isMediaLookupOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F1F5F9]">
                <h3 className="font-sans font-extrabold text-base text-rose-950">
                  Chọn tệp từ Thư viện Media
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMediaLookupOpen(false)}
                  className="px-3 py-1.5 bg-rose-800 text-white rounded-lg text-2xs font-bold hover:bg-rose-950 transition cursor-pointer"
                >
                  Xong
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {lookupLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-800 border-t-transparent"></div>
                  </div>
                ) : allMediaFiles.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center italic py-10">Thư viện phương tiện trống.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allMediaFiles.map((file) => {
                      const isAttached = attachedMediaFiles.some((f) => f.id === file.id);
                      const isImg = file.mimeType.startsWith("image/");
                      const isVid = file.mimeType.startsWith("video/");
                      const isAud = file.mimeType.startsWith("audio/");
                      const isPdfDoc = file.mimeType === "application/pdf" || file.fileName.endsWith(".pdf");

                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => handleToggleMediaAssociation(file)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                            isAttached
                              ? "bg-rose-50 border-rose-500 text-rose-800"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-10 w-10 flex-shrink-0 bg-white border rounded-lg flex items-center justify-center relative overflow-hidden">
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={file.fileUrl} alt="" className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-xl">
                                {isVid ? "🎥" : isAud ? "🎵" : isPdfDoc ? "📄" : "📁"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 truncate">
                            <p className="font-bold truncate text-slate-800" title={file.fileName}>
                              {file.fileName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {Math.round(file.fileSize / 1024)} KB • {file.lesson ? `Gán: ${file.lesson.title}` : "Chưa gán"}
                            </p>
                          </div>
                          <div className="h-4 w-4 rounded-full border border-[#CBD5E1] flex items-center justify-center bg-white flex-shrink-0">
                            {isAttached && <span className="text-rose-800 text-[10px] font-bold">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
