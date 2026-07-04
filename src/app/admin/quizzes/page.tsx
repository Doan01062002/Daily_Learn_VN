"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface QuizItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface SimpleLesson {
  id: string;
  title: string;
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
        <ul className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
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
                  <span className="truncate pr-4">{opt.label}</span>
                  {isSelected && (
                    <span className="text-rose-800 text-[10px] shrink-0">✓</span>
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

export default function AdminQuizzesPage() {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [lessons, setLessons] = useState<SimpleLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [globalTotalCount, setGlobalTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // CRUD Modal states
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);

  // Form states
  const [formLessonId, setFormLessonId] = useState("");
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptions, setFormOptions] = useState<string[]>(["", "", "", ""]);
  const [formCorrectAnswerIndex, setFormCorrectAnswerIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState("");
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // Bulk Import Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMethod, setImportMethod] = useState<"file" | "json">("file");
  const [importJson, setImportJson] = useState("");
  const [previewQuizzes, setPreviewQuizzes] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const fetchQuizzes = async (page = 1, q = "", lessonId = "") => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        q,
        lessonId,
      });
      const res = await fetch(`/api/admin/quizzes?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes);
        setLessons(data.lessons);
        setTotalCount(data.totalCount);
        setGlobalTotalCount(data.globalTotalCount);
        setTotalPages(data.totalPages);
      } else {
        setErrorMsg("Không thể tải danh sách trắc nghiệm.");
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "CTV" || user.role === "OPERATOR")) {
      fetchQuizzes(currentPage, searchQuery, selectedLesson);
    }
  }, [user, currentPage, searchQuery, selectedLesson]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLesson]);

  // Open Form modal for Add / Edit
  const openFormModal = (quiz: QuizItem | null = null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setFormLessonId(quiz.lessonId);
      setFormQuestion(quiz.question);
      setFormOptions([...quiz.options]);
      
      const correctIdx = quiz.options.indexOf(quiz.correctAnswer);
      setFormCorrectAnswerIndex(correctIdx !== -1 ? correctIdx : 0);
      setFormExplanation(quiz.explanation);
    } else {
      setEditingQuiz(null);
      setFormLessonId(lessons[0]?.id || "");
      setFormQuestion("");
      setFormOptions(["", "", "", ""]);
      setFormCorrectAnswerIndex(0);
      setFormExplanation("");
    }
    setShowCrudModal(true);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...formOptions];
    next[idx] = val;
    setFormOptions(next);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLessonId) {
      showNotification("Vui lòng chọn bài học liên kết.", "error");
      return;
    }
    if (!formQuestion.trim()) {
      showNotification("Nội dung câu hỏi không được để trống.", "error");
      return;
    }
    
    // Check options are filled
    const cleanOptions = formOptions.map(o => o.trim());
    if (cleanOptions.some(o => !o)) {
      showNotification("Vui lòng điền đầy đủ nội dung cho các tùy chọn đáp án.", "error");
      return;
    }

    const correctAnswer = cleanOptions[formCorrectAnswerIndex];
    if (!correctAnswer) {
      showNotification("Đáp án chính xác được chỉ định không hợp lệ.", "error");
      return;
    }

    setFormSubmitLoading(true);
    try {
      const payload = {
        id: editingQuiz?.id,
        lessonId: formLessonId,
        question: formQuestion.trim(),
        options: cleanOptions,
        correctAnswer,
        explanation: formExplanation.trim(),
      };

      const method = editingQuiz ? "PUT" : "POST";
      const res = await fetch("/api/admin/quizzes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(editingQuiz ? "Đã cập nhật câu hỏi thành công!" : "Đã tạo câu hỏi trắc nghiệm thành công!");
        setShowCrudModal(false);
        fetchQuizzes(currentPage, searchQuery, selectedLesson);
      } else {
        const err = await res.json();
        showNotification(err.error || "Không thể lưu thông tin câu hỏi.", "error");
      }
    } catch (error) {
      console.error("Failed to submit quiz form:", error);
      showNotification("Lỗi kết nối máy chủ.", "error");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleDeleteQuiz = (id: string, name: string) => {
    setConfirmModal({
      title: "Xóa câu hỏi trắc nghiệm",
      message: `Bạn có chắc chắn muốn xóa câu hỏi "${name.length > 50 ? name.slice(0, 50) + "..." : name}"? Thao tác này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/admin/quizzes?id=${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showNotification("Đã xóa câu hỏi thành công!");
            fetchQuizzes(currentPage, searchQuery, selectedLesson);
          } else {
            const err = await res.json();
            showNotification(err.error || "Không thể xóa câu hỏi.", "error");
          }
        } catch (error) {
          console.error("Failed to delete quiz:", error);
          showNotification("Lỗi kết nối mạng.", "error");
        }
      }
    });
  };

  const downloadSampleExcel = () => {
    const headers = [
      "Mã bài học (lessonId)",
      "Câu hỏi (question)",
      "Đáp án A (optionA)",
      "Đáp án B (optionB)",
      "Đáp án C (optionC)",
      "Đáp án D (optionD)",
      "Đáp án đúng (Điền A hoặc B hoặc C hoặc D)",
      "Giải thích (explanation)"
    ];
    
    const sampleRows = [
      [
        lessons[0]?.id || "dan-ma-bai-hoc-vao-day",
        "What is the synonym of 'beautiful'?",
        "Ugly",
        "Pretty",
        "Sad",
        "Happy",
        "B",
        "Pretty is a synonym of beautiful."
      ],
      [
        lessons[0]?.id || "dan-ma-bai-hoc-vao-day",
        "Which word is a verb?",
        "Quickly",
        "Run",
        "Beautiful",
        "Elephant",
        "B",
        "Run is an action verb."
      ]
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    // UTF-8 BOM to ensure Excel displays Vietnamese characters correctly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "daily_learn_quizzes_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = parseCSV(text);
      if (lines.length <= 1) {
        showNotification("File trống hoặc không hợp lệ.", "error");
        return;
      }
      
      const parsedQuizzes: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i];
        if (columns.length < 7) continue;
        
        const lessonId = columns[0]?.trim();
        const question = columns[1]?.trim();
        const optA = columns[2]?.trim();
        const optB = columns[3]?.trim();
        const optC = columns[4]?.trim();
        const optD = columns[5]?.trim();
        const correctInput = columns[6]?.trim().toUpperCase();
        const explanation = columns[7]?.trim() || "";
        
        if (!lessonId || !question || !optA || !optB || !correctInput) continue;
        
        const options = [optA, optB];
        if (optC) options.push(optC);
        if (optD) options.push(optD);
        
        let correctAnswer = "";
        if (correctInput === "A") correctAnswer = optA;
        else if (correctInput === "B") correctAnswer = optB;
        else if (correctInput === "C") correctAnswer = optC || "";
        else if (correctInput === "D") correctAnswer = optD || "";
        else {
          correctAnswer = columns[6]?.trim();
        }
        
        if (!correctAnswer) continue;
        
        parsedQuizzes.push({
          lessonId,
          question,
          options,
          correctAnswer,
          explanation
        });
      }
      
      if (parsedQuizzes.length === 0) {
        showNotification("Không tìm thấy câu hỏi hợp lệ trong file.", "error");
        return;
      }
      
      setPreviewQuizzes(parsedQuizzes);
      showNotification(`Đọc thành công ${parsedQuizzes.length} câu hỏi từ file!`);
    };
    reader.readAsText(file, "UTF-8");
    // reset input
    e.target.value = "";
  };

  function parseCSV(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let col = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          col += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(col);
        col = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(col);
        result.push(row);
        row = [];
        col = "";
      } else {
        col += char;
      }
    }
    if (col || row.length > 0) {
      row.push(col);
      result.push(row);
    }
    return result;
  }

  const handleBulkImport = async () => {
    let importList: any[] = [];
    if (importMethod === "json") {
      if (!importJson.trim()) {
        showNotification("Nội dung JSON import trống.", "error");
        return;
      }
      try {
        importList = JSON.parse(importJson.trim());
      } catch (e) {
        showNotification("Định dạng JSON không hợp lệ.", "error");
        return;
      }
      if (!Array.isArray(importList)) {
        showNotification("Dữ liệu JSON phải là mảng các câu hỏi.", "error");
        return;
      }
    } else {
      if (previewQuizzes.length === 0) {
        showNotification("Vui lòng tải lên file Excel hoặc CSV hợp lệ trước.", "error");
        return;
      }
      importList = previewQuizzes;
    }

    setImportLoading(true);
    try {
      const res = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizzes: importList }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(`Đã import thành công ${data.count} câu hỏi trắc nghiệm!`);
        setShowImportModal(false);
        setImportJson("");
        setPreviewQuizzes([]);
        fetchQuizzes(currentPage, searchQuery, selectedLesson);
      } else {
        const err = await res.json();
        showNotification(err.error || "Lỗi import câu hỏi.", "error");
      }
    } catch (error) {
      console.error("Failed to import quizzes:", error);
      showNotification("Lỗi kết nối máy chủ.", "error");
    } finally {
      setImportLoading(false);
    }
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
      <AdminSidebar currentPath="/admin/quizzes" />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm h-16">
          <h2 className="font-sans font-extrabold text-base tracking-tight text-rose-950">Ngân hàng Câu hỏi Trắc nghiệm</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Tổng câu hỏi hệ thống</span>
                <h3 className="text-2xl font-serif font-black text-rose-950">{globalTotalCount}</h3>
                <p className="text-[10px] text-slate-500 font-bold">Toàn bộ kho lưu trữ</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-800 shadow-inner">
                📚
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between col-span-2">
              <div className="flex-1 flex flex-col justify-between h-full">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Thao tác dữ liệu</span>
                  <p className="text-xs text-slate-600 font-medium">Bổ sung câu hỏi đơn lẻ hoặc nạp nhanh hàng trăm câu hỏi qua JSON.</p>
                </div>
                <div className="flex gap-2.5 mt-3 sm:mt-0">
                  <button
                    onClick={() => openFormModal(null)}
                    className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    + Thêm câu hỏi
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    📥 Import hàng loạt
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative col-span-1 md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo nội dung câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white placeholder-slate-400 transition focus:border-rose-800 focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              <CustomSelect
                value={selectedLesson}
                onChange={setSelectedLesson}
                options={[
                  { value: "", label: "Tất cả bài học" },
                  ...lessons.map((l) => ({ value: l.id, label: l.title })),
                ]}
                placeholder="Lọc theo bài học"
              />
            </div>
          </div>

          {/* Quizzes Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-20 text-slate-500 italic">
                Chưa có câu hỏi trắc nghiệm nào trong ngân hàng.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-4">Nội dung Câu hỏi</th>
                        <th className="px-6 py-4">Bài học liên kết</th>
                        <th className="px-6 py-4">Số lựa chọn</th>
                        <th className="px-6 py-4">Đáp án đúng</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {quizzes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="px-6 py-4 font-bold text-slate-800 max-w-sm truncate" title={item.question}>
                            {item.question}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold max-w-xs truncate" title={item.lessonTitle}>
                            📚 {item.lessonTitle}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-600">
                            {item.options.length} đáp án
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-800">
                            {item.correctAnswer}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => openFormModal(item)}
                                className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition duration-150 cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteQuiz(item.id, item.question)}
                                className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition duration-150 cursor-pointer"
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50">
                    <div className="text-xs text-slate-500">
                      Hiển thị từ <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
                      <span className="font-bold text-slate-800">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>{" "}
                      trong tổng số <span className="font-bold text-slate-800">{totalCount}</span> câu hỏi
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
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
                                : "border border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
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
      </div>

      {/* CRUD Form Modal */}
      {showCrudModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-sans font-extrabold text-sm text-rose-950">
                {editingQuiz ? "Cập nhật câu hỏi trắc nghiệm" : "Tạo câu hỏi trắc nghiệm mới"}
              </h3>
              <button
                onClick={() => setShowCrudModal(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-bold focus:outline-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bài học liên kết</label>
                <CustomSelect
                  value={formLessonId}
                  onChange={setFormLessonId}
                  options={lessons.map((l) => ({ value: l.id, label: l.title }))}
                  placeholder="Chọn bài học"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nội dung câu hỏi</label>
                <textarea
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Điền nội dung câu hỏi tiếng Anh ở đây..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-rose-800 focus:outline-none"
                />
              </div>

              {/* Options */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700 block mb-1">Các tùy chọn đáp án</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-500 flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctAnswerIndex"
                          checked={formCorrectAnswerIndex === idx}
                          onChange={() => setFormCorrectAnswerIndex(idx)}
                          className="text-rose-800 focus:ring-rose-800"
                        />
                        <span>Lựa chọn {String.fromCharCode(65 + idx)}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Nội dung tùy chọn ${String.fromCharCode(65 + idx)}...`}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-rose-800 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Giải thích chi tiết (Không bắt buộc)</label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án đã chọn lại chính xác..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-rose-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCrudModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-sans font-extrabold text-sm text-rose-950">📥 Nhập câu hỏi hàng loạt</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewQuizzes([]);
                  setImportJson("");
                }}
                className="text-slate-500 hover:text-slate-700 text-sm font-bold focus:outline-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tabs selection */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setImportMethod("file")}
                className={`flex-1 py-2 text-center border-b-2 transition ${
                  importMethod === "file"
                    ? "border-rose-800 text-rose-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📁 Nhập từ tệp Excel / CSV
              </button>
              <button
                onClick={() => setImportMethod("json")}
                className={`flex-1 py-2 text-center border-b-2 transition ${
                  importMethod === "json"
                    ? "border-rose-800 text-rose-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                💻 Nhập chuỗi JSON
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {importMethod === "file" ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                    <div className="space-y-0.5 pr-2">
                      <span className="font-bold text-rose-950 text-xs">Tệp mẫu chuẩn Excel (.csv)</span>
                      <p className="text-[10px] text-rose-800 leading-normal">
                        Tải xuống file mẫu chuẩn đã điền sẵn cấu trúc cột để nhập liệu chính xác nhất.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleExcel}
                      className="shrink-0 px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold transition duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      📥 Tải mẫu
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-rose-800 rounded-xl p-6 text-center cursor-pointer transition relative bg-slate-50/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleExcelUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-2xl block mb-1">📊</span>
                    <span className="text-xs font-bold text-slate-700 block">Chọn tệp Excel / CSV của bạn</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Nhấp vào đây hoặc kéo thả file để tải lên</span>
                  </div>

                  {previewQuizzes.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Xem trước ({previewQuizzes.length} câu hỏi):</span>
                        <button
                          type="button"
                          onClick={() => setPreviewQuizzes([])}
                          className="text-rose-800 font-bold hover:underline"
                        >
                          Xóa tệp
                        </button>
                      </div>
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px] max-h-40 overflow-y-auto">
                        <table className="w-full text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                              <th className="px-3 py-2">Câu hỏi</th>
                              <th className="px-3 py-2">Số đáp án</th>
                              <th className="px-3 py-2">Đáp án đúng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {previewQuizzes.slice(0, 3).map((pq, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 truncate max-w-[200px]" title={pq.question}>{pq.question}</td>
                                <td className="px-3 py-2 font-mono">{pq.options.length}</td>
                                <td className="px-3 py-2 text-emerald-800 font-bold">{pq.correctAnswer}</td>
                              </tr>
                            ))}
                            {previewQuizzes.length > 3 && (
                              <tr>
                                <td colSpan={3} className="px-3 py-2 text-center text-slate-500 italic bg-slate-50/50">
                                  ... và {previewQuizzes.length - 3} câu hỏi khác
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Dán chuỗi JSON hợp lệ cấu trúc dạng mảng các câu hỏi trắc nghiệm tiếng Anh.
                  </p>
                  <pre className="bg-slate-50 text-[10px] p-3 rounded-lg font-mono text-slate-600 max-h-28 overflow-y-auto border border-slate-200 leading-normal">
{`[
  {
    "lessonId": "dán-id-bài-học-vào-đây",
    "question": "What is the capital of Vietnam?",
    "options": ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hue"],
    "correctAnswer": "Hanoi",
    "explanation": "Hanoi is the capital..."
  }
]`}
                  </pre>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Nội dung JSON trắc nghiệm</label>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Dán chuỗi JSON của bạn vào đây..."
                      rows={4}
                      className="w-full font-mono text-[10px] px-3 py-2 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-rose-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewQuizzes([]);
                  setImportJson("");
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={importLoading}
                className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {importLoading ? "Đang xử lý..." : "Bắt đầu Import"}
              </button>
            </div>
          </div>
        </div>
      )}

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
