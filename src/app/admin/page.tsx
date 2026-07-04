"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";

interface AdminLessonItem {
  id: string;
  title: string;
  tags: string[];
  level: string;
  status: "DRAFT" | "PUBLISHED";
  sourceDomain: string;
  createdAt: string;
  _count: {
    quizzes: number;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<AdminLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLessons = async () => {
    try {
      const res = await fetch("/api/admin/lessons");
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons);
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

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      const loadData = async () => {
        await fetchLessons();
      };
      loadData();
    }
  }, [user]);

  const handlePublish = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });

      if (res.ok) {
        await fetchLessons();
      } else {
        setErrorMsg("Không thể phát hành bài học.");
      }
    } catch (error) {
      console.error("Failed to publish lesson:", error);
      setErrorMsg("Lỗi kết nối.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (actionLoading) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này và toàn bộ câu hỏi trắc nghiệm liên quan?")) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchLessons();
      } else {
        setErrorMsg("Không thể xóa bài học.");
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      setErrorMsg("Lỗi kết nối.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  // 1. Client-Side Authorization check
  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-sm w-full space-y-4 shadow-sm">
          <span className="text-4xl block">🚫</span>
          <h1 className="font-serif text-xl font-bold text-rose-950">Quyền truy cập bị từ chối</h1>
          <p className="text-xs text-rose-800 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Bạn không có quyền truy cập vào giao diện này.
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-[#4E4941] text-white text-xs font-semibold hover:bg-[#3E3A35] transition duration-200"
          >
            Quay lại Học viên
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats metrics
  const totalLessons = lessons.length;
  const publishedLessons = lessons.filter((l) => l.status === "PUBLISHED").length;
  const draftLessons = lessons.filter((l) => l.status === "DRAFT").length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-800 to-rose-950 flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-base tracking-tight text-rose-950 leading-none">Quản trị</span>
            <span className="text-[9px] font-bold text-rose-800 tracking-widest uppercase mt-0.5">Hệ thống</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#8C8375] hover:text-[#3E3A35] border border-[#D5CFC5] px-3 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition duration-200"
          >
            Giao diện Học viên
          </Link>
        </div>
      </header>

      {/* Main content container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Page Title & Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">Quản lý nội dung bài học</h1>
            <p className="text-xs text-[#8C8375] mt-0.5">Biên soạn, xuất bản bài học và trắc nghiệm củng cố.</p>
          </div>
          <Link
            href="/admin/lessons/new"
            className="bg-[#4E4941] text-white hover:bg-[#3E3A35] px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition duration-200"
          >
            + Thêm bài học mới
          </Link>
        </div>

        {/* Stats card banner grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">Tổng số bài viết</div>
            <div className="text-2xl font-extrabold text-[#3E3A35] mt-1">{totalLessons}</div>
          </div>
          <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã phát hành</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{publishedLessons}</div>
          </div>
          <div className="bg-white border border-[#EBE6DD] p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">Bản nháp</div>
            <div className="text-2xl font-extrabold text-[#8C8375] mt-1">{draftLessons}</div>
          </div>
        </div>

        {/* Error alerting */}
        {errorMsg && (
          <div className="rounded-lg bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
            {errorMsg}
          </div>
        )}

        {/* Lessons List Table Card */}
        <div className="bg-white border border-[#EBE6DD] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-20 text-[#8C8375] italic">
              Chưa có bài viết nào được tạo. Hãy nhấn nút thêm bài viết mới để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FCFAF7] border-b border-[#EBE6DD] text-xs font-bold text-[#8C8375] uppercase tracking-wider">
                    <th className="px-6 py-4">Bài học</th>
                    <th className="px-6 py-4">Chủ đề</th>
                    <th className="px-6 py-4">Trình độ</th>
                    <th className="px-6 py-4 text-center">Trắc nghiệm</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4] text-sm text-[#4E4941]">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-[#FAF8F5] transition duration-150">
                      <td className="px-6 py-4 font-semibold text-[#3E3A35]">
                        <div>{lesson.title}</div>
                        <div className="text-[10px] font-normal text-[#8C8375] font-serif italic mt-0.5">
                          nguồn: {lesson.sourceDomain}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {lesson.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#8C8375]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">{lesson.level}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-[#3E3A35]">
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
                      <td className="px-6 py-4 text-right space-x-2 shrink-0">
                        {lesson.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(lesson.id)}
                            disabled={actionLoading !== null}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus:outline-none disabled:opacity-50"
                          >
                            Phát hành
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          disabled={actionLoading !== null}
                          className="text-xs font-bold text-red-600 hover:text-red-800 focus:outline-none disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
