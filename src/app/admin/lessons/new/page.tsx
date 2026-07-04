"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLessonPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Lesson Fields State
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [sourceDomain, setSourceDomain] = useState("");
  const [summary1, setSummary1] = useState("");
  const [summary2, setSummary2] = useState("");
  const [summary3, setSummary3] = useState("");
  const [actionableStep, setActionableStep] = useState("");

  // Quiz Fields State
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("A");
  const [explanation, setExplanation] = useState("");

  // General States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  // 1. Client-Side Authorization guard check
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

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    // Form verification
    if (!title || !tagsInput || !sourceDomain || !summary1 || !actionableStep) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin cốt lõi của bài học.");
      return;
    }

    if (question && (!optionA || !optionB || !optionC || !optionD || !explanation)) {
      setErrorMsg("Nếu đã soạn trắc nghiệm, vui lòng điền đủ 4 phương án và lời giải thích.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Map correct option back to the actual string option content
    let correctAnswer = "";
    if (correctOption === "A") correctAnswer = optionA;
    if (correctOption === "B") correctAnswer = optionB;
    if (correctOption === "C") correctAnswer = optionC;
    if (correctOption === "D") correctAnswer = optionD;

    const payload = {
      title,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      level,
      sourceDomain,
      summary: [summary1, summary2, summary3].map((s) => s.trim()).filter(Boolean),
      actionableStep,
      status,
      quizzes: question
        ? [
            {
              question,
              options: [optionA, optionB, optionC, optionD].map((o) => o.trim()),
              correctAnswer,
              explanation,
            },
          ]
        : [],
    };

    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Tạo bài học thất bại.");
      }
    } catch (error) {
      console.error("Failed to create lesson:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          <span>←</span> Quay lại trang Admin
        </Link>
        <span className="font-serif italic text-xs text-[#BFB8AC]">Soạn thảo bài học</span>
      </header>

      {/* Form Area container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Thêm bài học mới</h1>
          <p className="text-xs text-[#8C8375] mt-0.5">Tạo bài học vi mô kèm 1 câu hỏi trắc nghiệm tương tác củng cố.</p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-[#FDF3F2] p-4 text-sm text-[#D32F2F] border border-[#FBE3E1]">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          
          {/* SECTION 1: LESSON CONTENT */}
          <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider border-b border-[#F0ECE4] pb-2">
              1. Nội dung bài viết vi mô
            </h2>

            {/* Title input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tiêu đề bài học</label>
              <input
                type="text"
                placeholder="Ví dụ: Hiểu nhanh về RESTful API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Level select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Trình độ</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </div>

              {/* Source domain input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tên miền Nguồn tham khảo</label>
                <input
                  type="text"
                  placeholder="Ví dụ: medium.com"
                  value={sourceDomain}
                  onChange={(e) => setSourceDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
              </div>
            </div>

            {/* Tags input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Nhãn chủ đề (Tags - Ngăn cách bởi dấu phẩy)</label>
              <input
                type="text"
                placeholder="Ví dụ: Tech, Business"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
              />
            </div>

            {/* Bullet point summaries */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tóm tắt bài học (3 ý chính cốt lõi)</label>
              <input
                type="text"
                placeholder="Ý tóm tắt 1 (Bắt buộc)"
                value={summary1}
                onChange={(e) => setSummary1(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150 mb-2"
              />
              <input
                type="text"
                placeholder="Ý tóm tắt 2 (Tùy chọn)"
                value={summary2}
                onChange={(e) => setSummary2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150 mb-2"
              />
              <input
                type="text"
                placeholder="Ý tóm tắt 3 (Tùy chọn)"
                value={summary3}
                onChange={(e) => setSummary3(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
              />
            </div>

            {/* Actionable Step input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Hành động gợi ý (Actionable Step)</label>
              <textarea
                rows={2}
                placeholder="Một câu hành động ngắn gọn. Ví dụ: Hãy tự viết 3 Endpoint RESTful chuẩn cho thực thể Posts."
                value={actionableStep}
                onChange={(e) => setActionableStep(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150 resize-none"
              />
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE QUIZ */}
          <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider border-b border-[#F0ECE4] pb-2">
              2. Soạn câu hỏi trắc nghiệm (Quiz - Không bắt buộc)
            </h2>

            {/* Question input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Nội dung câu hỏi</label>
              <input
                type="text"
                placeholder="Ví dụ: RESTful API sử dụng phương thức HTTP nào để tạo mới tài nguyên?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
              />
            </div>

            {/* Options inputs */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Các phương án lựa chọn</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Phương án A"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
                <input
                  type="text"
                  placeholder="Phương án B"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
                <input
                  type="text"
                  placeholder="Phương án C"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
                <input
                  type="text"
                  placeholder="Phương án D"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Correct answer select */}
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Đáp án Đúng</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                >
                  <option value="A">Phương án A</option>
                  <option value="B">Phương án B</option>
                  <option value="C">Phương án C</option>
                  <option value="D">Phương án D</option>
                </select>
              </div>

              {/* Explanation textarea */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Giải thích chi tiết</label>
                <input
                  type="text"
                  placeholder="Giải thích tại sao đáp án này là đúng..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition duration-150"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#EBE6DD]">
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-[#D5CFC5] bg-white text-xs font-semibold text-[#8C8375] hover:bg-[#FAF8F5] hover:text-[#3E3A35] transition duration-200 disabled:opacity-50 focus:outline-none"
            >
              Lưu bản nháp
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-[#4E4941] text-white text-xs font-semibold hover:bg-[#3E3A35] transition duration-200 disabled:opacity-50 focus:outline-none"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu và Phát hành"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
