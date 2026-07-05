"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StepForm {
  stepNumber: number;
  title: string;
  instruction: string;
  imageUrl: string;
  hotspotX: number;
  hotspotY: number;
  hotspotRadius: number;
}

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

  // Interactive Steps State
  const [steps, setSteps] = useState<StepForm[]>([]);

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

  // Assignment States
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentType, setAssignmentType] = useState("WRITING");
  const [assignmentPrompt, setAssignmentPrompt] = useState("");

  // AI Sidebar States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedSteps, setSuggestedSteps] = useState<any[]>([]);

  if (!user) return null;

  // Authorization check
  if (user.role !== "ADMIN" && user.role !== "CTV" && user.role !== "OPERATOR") {
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

  // Adding step handlers
  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        title: "",
        instruction: "",
        imageUrl: "/figma_preset.png", // default template
        hotspotX: 50,
        hotspotY: 50,
        hotspotRadius: 5
      }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, idx) => idx !== index);
    // recalculate step numbers
    const recalculated = updated.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1
    }));
    setSteps(recalculated);
  };

  const handleStepChange = (index: number, field: keyof StepForm, value: any) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSteps(updated);
  };

  // Hotspot canvas click handler
  const handleImageClick = (index: number, e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    handleStepChange(index, "hotspotX", x);
    handleStepChange(index, "hotspotY", y);
  };

  // Simulated AI prompt generation
  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    // Simulated typewriter generation response
    setTimeout(() => {
      let mockTitle = "";
      let mockTags = "";
      let mockSummary = ["", "", ""];
      let mockActionableStep = "";
      let mockGenSteps: any[] = [];

      const query = aiPrompt.toLowerCase();
      if (query.includes("figma") || query.includes("design") || query.includes("frame")) {
        mockTitle = "Thiết kế Frame đầu tiên trên Figma";
        mockTags = "Design, UI/UX";
        mockSummary = [
          "Frame trong Figma là vùng chứa bố cục (Artboard) chứa các thành phần thiết kế.",
          "Phím tắt F mở nhanh công cụ chọn kích thước Frame chuẩn ở bảng điều khiển bên phải.",
          "Sử dụng Auto Layout để thiết kế giao diện tự động căn lề và co giãn linh hoạt."
        ];
        mockActionableStep = "Mở Figma, tạo một file mới và vẽ một Frame iPhone 14 Pro Max chuẩn.";
        mockGenSteps = [
          {
            stepNumber: 1,
            title: "Chọn Công cụ vẽ Frame",
            instruction: "Nhấp chuột vào biểu tượng **Frame** trên thanh công cụ góc trái phía trên hoặc nhấn phím tắt **F** để kích hoạt chế độ vẽ vùng chứa.",
            imageUrl: "/figma_preset.png",
            hotspotX: 18.0,
            hotspotY: 22.5,
            hotspotRadius: 5
          },
          {
            stepNumber: 2,
            title: "Chọn Kích thước Thiết bị chuẩn",
            instruction: "Tại bảng tùy chọn xuất hiện ở menu bên phải, nhấp chọn mục **Phone** và chọn kích thước **iPhone 14 / 15 Pro** để tự động tạo kích thước Canvas chuẩn.",
            imageUrl: "/figma_preset.png",
            hotspotX: 82.5,
            hotspotY: 38.0,
            hotspotRadius: 5
          },
          {
            stepNumber: 3,
            title: "Áp dụng Màu nền & Bo góc",
            instruction: "Nhấp chọn Frame vừa tạo, di chuyển sang bảng Fill để đổi màu nền thành `#F9F7F4`, đồng thời thiết lập Corner Radius (bo góc) bằng `24px` ở bảng Design.",
            imageUrl: "/figma_preset.png",
            hotspotX: 86.0,
            hotspotY: 64.5,
            hotspotRadius: 5
          }
        ];
      } else {
        // Git template default
        mockTitle = "Thực hành khởi tạo Git & GitHub";
        mockTags = "Tech, Git";
        mockSummary = [
          "Lệnh git init dùng để khởi tạo một local repository mới.",
          "Lệnh git commit ghi lại các thay đổi của bạn kèm thông điệp rõ ràng.",
          "Lệnh git push đẩy lịch sử code cục bộ lên máy chủ đám mây GitHub."
        ];
        mockActionableStep = "Mở Terminal và gõ 'git init' để bắt đầu quản lý phiên bản mã nguồn của bạn.";
        mockGenSteps = [
          {
            stepNumber: 1,
            title: "Khởi tạo Kho chứa cục bộ (git init)",
            instruction: "Hãy mở ứng dụng Terminal trên máy tính, di chuyển đến thư mục dự án và gõ lệnh sau để khởi tạo Git:\n\n`git init`",
            imageUrl: "/git_terminal.png",
            hotspotX: 25.5,
            hotspotY: 42.0,
            hotspotRadius: 6
          },
          {
            stepNumber: 2,
            title: "Theo dõi tệp tin và Đóng gói (git commit)",
            instruction: "Sử dụng lệnh sau để thêm tất cả các tệp thay đổi vào vùng chờ (Staging Area), sau đó đóng gói chúng kèm thông điệp:\n\n`git add .`  \n`git commit -m 'initial commit'`",
            imageUrl: "/git_terminal.png",
            hotspotX: 42.5,
            hotspotY: 55.0,
            hotspotRadius: 6
          },
          {
            stepNumber: 3,
            title: "Đẩy mã nguồn lên GitHub (git push)",
            instruction: "Liên kết kho chứa cục bộ với kho chứa từ xa trên GitHub và đẩy mã nguồn lên nhánh chính (main):\n\n`git remote add origin <url>`  \n`git push -u origin main`",
            imageUrl: "/git_terminal.png",
            hotspotX: 68.0,
            hotspotY: 72.0,
            hotspotRadius: 6
          }
        ];
      }

      setSuggestedSteps(mockGenSteps);
      setAiResponse(`🤖 **Trợ lý AI DailyLearn**: Đã tự động phân tích và tạo bài học thực hành tương tác!

✨ **Kế hoạch 3 bước được phát sinh**:
- **Bước 1**: ${mockGenSteps[0].title}
- **Bước 2**: ${mockGenSteps[1].title}
- **Bước 3**: ${mockGenSteps[2].title}

*Hotspot tọa độ nhấp chuột đã được AI tính toán khớp với ảnh chụp màn hình.*`);
      
      // Auto apply text values for mock convenience
      setTitle(mockTitle);
      setTagsInput(mockTags);
      setSummary1(mockSummary[0]);
      setSummary2(mockSummary[1]);
      setSummary3(mockSummary[2]);
      setActionableStep(mockActionableStep);
      setAiLoading(false);
    }, 1500);
  };

  const applyAISuggestions = () => {
    if (suggestedSteps.length > 0) {
      setSteps(suggestedSteps);
      setAiResponse("✅ Đã áp dụng bài giảng AI thành công vào danh sách các bước soạn thảo!");
    }
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
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
      steps: steps.map((s, idx) => ({
        stepNumber: idx + 1,
        title: s.title,
        instruction: s.instruction,
        imageUrl: s.imageUrl,
        hotspotX: s.hotspotX,
        hotspotY: s.hotspotY,
        hotspotRadius: s.hotspotRadius
      })),
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
      assignment: hasAssignment && assignmentPrompt
        ? {
            type: assignmentType,
            prompt: assignmentPrompt.trim(),
          }
        : null,
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
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm select-none">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          <span>←</span> Quay lại trang Admin
        </Link>
        <span className="font-serif italic text-xs text-[#BFB8AC]">Soạn thảo bài học</span>
      </header>

      {/* Main split dashboard pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#EBE6DD]">
        
        {/* Left Side: Forms Editor (2/3 Width) */}
        <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">Thêm bài học mới</h1>
            <p className="text-xs text-[#8C8375] mt-0.5">Tạo bài học vi mô tích hợp câu hỏi trắc nghiệm và các bước thao tác thực tế.</p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-xs font-semibold text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            {/* SECTION 1: CORE ARTICLE DETAILS */}
            <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider border-b border-[#F0ECE4] pb-2">
                1. Nội dung bài viết vi mô
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tiêu đề bài học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thực hành khởi tạo Git & GitHub"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Trình độ</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Experienced">Experienced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tên miền Nguồn tham khảo</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: github.com"
                    value={sourceDomain}
                    onChange={(e) => setSourceDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Nhãn chủ đề (Tags - Ngăn cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tech, Git"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Tóm tắt bài học (3 ý chính cốt lõi)</label>
                <input
                  type="text"
                  placeholder="Ý tóm tắt 1 (Bắt buộc)"
                  value={summary1}
                  onChange={(e) => setSummary1(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
                <input
                  type="text"
                  placeholder="Ý tóm tắt 2 (Tùy chọn)"
                  value={summary2}
                  onChange={(e) => setSummary2(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
                <input
                  type="text"
                  placeholder="Ý tóm tắt 3 (Tùy chọn)"
                  value={summary3}
                  onChange={(e) => setSummary3(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Hành động gợi ý (Actionable Step)</label>
                <textarea
                  rows={2}
                  placeholder="Một câu hành động ngắn gọn. Ví dụ: Hãy tự viết lệnh init để thiết lập phiên bản code."
                  value={actionableStep}
                  onChange={(e) => setActionableStep(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition resize-none"
                />
              </div>
            </div>

            {/* SECTION 2: INTERACTIVE STEPS EDITOR */}
            <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">
                  2. Trình thiết kế thao tác (Interactive Screenshot Hotspots)
                </h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100/70 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span> Thêm bước thao tác
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#D5CFC5] rounded-2xl bg-[#FCFAF7]">
                  <span className="text-2xl block mb-2">📸</span>
                  <p className="text-xs text-[#8C8375] leading-relaxed">
                    Chưa có bước thực hành thao tác nào. Học viên sẽ đọc lý thuyết chuẩn. <br />
                    Hãy thêm bước thủ công hoặc sử dụng <strong>Trợ lý AI</strong> ở bảng bên phải để sinh tự động.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={index} className="border border-[#EBE6DD] rounded-2xl p-4 bg-[#FCFAF7]/40 space-y-4 relative">
                      <div className="flex justify-between items-center border-b border-[#EBE6DD] pb-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                          Bước {step.stepNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                        >
                          Xóa bước
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Step Details Inputs */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#4E4941] uppercase tracking-wider block">Tiêu đề bước</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: Chọn công cụ Frame"
                              value={step.title}
                              onChange={(e) => handleStepChange(index, "title", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#D5CFC5] bg-white text-xs focus:outline-none focus:border-[#8C8375]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#4E4941] uppercase tracking-wider block">Nội dung hướng dẫn chi tiết</label>
                            <textarea
                              rows={3}
                              placeholder="Hướng dẫn học viên làm gì trên ảnh..."
                              value={step.instruction}
                              onChange={(e) => handleStepChange(index, "instruction", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#D5CFC5] bg-white text-xs focus:outline-none focus:border-[#8C8375] resize-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#4E4941] uppercase tracking-wider block">Đường dẫn ảnh chụp màn hình</label>
                            <select
                              value={step.imageUrl}
                              onChange={(e) => handleStepChange(index, "imageUrl", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#D5CFC5] bg-white text-xs focus:outline-none focus:border-[#8C8375] cursor-pointer"
                            >
                              <option value="/figma_preset.png">Giao diện Figma (/figma_preset.png)</option>
                              <option value="/git_terminal.png">Giao diện Terminal (/git_terminal.png)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-[#8C8375] uppercase block">Tọa độ X (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={step.hotspotX}
                                onChange={(e) => handleStepChange(index, "hotspotX", parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded border border-[#D5CFC5] bg-white text-xs font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-[#8C8375] uppercase block">Tọa độ Y (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={step.hotspotY}
                                onChange={(e) => handleStepChange(index, "hotspotY", parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded border border-[#D5CFC5] bg-white text-xs font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-[#8C8375] uppercase block">Bán kính (%)</label>
                              <input
                                type="number"
                                value={step.hotspotRadius}
                                onChange={(e) => handleStepChange(index, "hotspotRadius", parseInt(e.target.value) || 5)}
                                className="w-full px-2 py-1 rounded border border-[#D5CFC5] bg-white text-xs font-mono text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Picker Image Canvas */}
                        <div className="space-y-1 flex flex-col justify-between">
                          <label className="text-[10px] font-bold text-[#4E4941] uppercase tracking-wider block text-center">
                            🎯 CLICK LÊN HÌNH ĐỂ ĐỊNH VỊ HOTSPOT:
                          </label>
                          <div className="relative border border-[#D5CFC5] rounded-xl overflow-hidden shadow bg-black max-w-[280px] mx-auto select-none">
                            <img
                              src={step.imageUrl}
                              alt="Click to pick hotspot"
                              onClick={(e) => handleImageClick(index, e)}
                              className="w-full h-auto object-contain cursor-crosshair opacity-85 select-none pointer-events-auto"
                            />
                            {/* Hotspot target marker overlay */}
                            <div
                              className="absolute h-5 w-5 rounded-full border-2 border-red-500 bg-red-500/35 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                              style={{ left: `${step.hotspotX}%`, top: `${step.hotspotY}%` }}
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-red-650" />
                            </div>
                          </div>
                          <span className="text-[9px] text-[#8C8375] italic block text-center mt-1">
                            Tọa độ đã chọn: X: {step.hotspotX}% | Y: {step.hotspotY}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: QUIZ */}
            <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider border-b border-[#F0ECE4] pb-2">
                3. Soạn câu hỏi trắc nghiệm (Quiz - Không bắt buộc)
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Nội dung câu hỏi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phím tắt nào kích hoạt công cụ vẽ Frame trong Figma?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] transition"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Các phương án lựa chọn</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Phương án A"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#8C8375]"
                  />
                  <input
                    type="text"
                    placeholder="Phương án B"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#8C8375]"
                  />
                  <input
                    type="text"
                    placeholder="Phương án C"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#8C8375]"
                  />
                  <input
                    type="text"
                    placeholder="Phương án D"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#8C8375]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Đáp án Đúng</label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#8C8375] cursor-pointer"
                  >
                    <option value="A">Phương án A</option>
                    <option value="B">Phương án B</option>
                    <option value="C">Phương án C</option>
                    <option value="D">Phương án D</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Giải thích chi tiết</label>
                  <input
                    type="text"
                    placeholder="Giải thích tại sao đáp án này là đúng..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: ASSIGNMENT */}
            <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                <h2 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">
                  4. Bài tập tự luận đi kèm (Không bắt buộc)
                </h2>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#4E4941]">
                  <input
                    type="checkbox"
                    checked={hasAssignment}
                    onChange={(e) => setHasAssignment(e.target.checked)}
                    className="rounded border-[#D5CFC5] text-rose-800 focus:ring-rose-800 h-3.5 w-3.5"
                  />
                  Kích hoạt bài tập
                </label>
              </div>

              {hasAssignment && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Loại bài tập</label>
                    <select
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#8C8375] cursor-pointer"
                    >
                      <option value="WRITING">Viết đoạn văn ngắn (Writing)</option>
                      <option value="SPEAKING">Phát âm / Nói (Speaking)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4E4941] uppercase tracking-wider block">Đề bài / Câu hỏi hướng dẫn</label>
                    <textarea
                      rows={3}
                      placeholder="Nhập hướng dẫn chi tiết bài tập tự luận cho học viên..."
                      value={assignmentPrompt}
                      onChange={(e) => setAssignmentPrompt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC5] bg-[#FCFAF7] text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[#EBE6DD]">
              <button
                onClick={() => handleSubmit("DRAFT")}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[#D5CFC5] bg-white text-xs font-bold text-[#8C8375] hover:bg-[#FAF8F5] hover:text-[#3E3A35] transition disabled:opacity-50 cursor-pointer"
              >
                Lưu bản nháp
              </button>
              <button
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#4E4941] text-white text-xs font-bold hover:bg-[#3E3A35] transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu và Phát hành"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: AI Lecture Assistant Sidebar (1/3 Width) */}
        <div className="p-6 bg-white overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-[#F0ECE4] pb-3">
              <span className="text-xl">🤖</span>
              <div>
                <h2 className="text-sm font-serif font-bold text-slate-800">Trợ lý soạn bài AI</h2>
                <p className="text-[10px] text-[#8C8375] leading-relaxed">
                  Nhập chủ đề thao tác phần mềm, AI sẽ tự động sinh bài giảng có hotspot ảnh chụp phù hợp.
                </p>
              </div>
            </div>

            {/* Prompt input field */}
            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Ví dụ: Thiết kế Figma iPhone 14 preset..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full p-3 border border-[#D5CFC5] rounded-xl text-xs bg-[#FCFAF7] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
              />

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setAiPrompt("Thiết kế Figma: Chọn Frame iPhone 14")}
                  className="px-2 py-1 rounded bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[9px] font-bold text-slate-600 transition"
                >
                  💡 Mẫu Figma Frame
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt("Tech: Thực hành chạy git init terminal")}
                  className="px-2 py-1 rounded bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[9px] font-bold text-slate-600 transition"
                >
                  💡 Mẫu Terminal Git init
                </button>
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              disabled={aiLoading || !aiPrompt.trim()}
              onClick={handleGenerateAI}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
            >
              {aiLoading ? "🤖 AI đang phân tích thiết kế..." : "✨ Tạo bài giảng tương tác bằng AI"}
            </button>

            {/* AI Response output logs */}
            {aiResponse && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 whitespace-pre-line space-y-3 leading-relaxed">
                {aiResponse}

                {suggestedSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={applyAISuggestions}
                    className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                  >
                    ⚡ Áp dụng bài giảng AI vào bài viết
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 italic text-center select-none pt-6 border-t border-[#F0ECE4]">
            Công nghệ hỗ trợ bài giảng tương tác Hotspot Ảnh chụp màn hình. Powered by DailyLearn AI.
          </div>
        </div>

      </div>
    </div>
  );
}
