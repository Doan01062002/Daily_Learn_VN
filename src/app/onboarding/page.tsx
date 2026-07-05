"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";

const TOPICS = [
  { id: "Tech", label: "Công nghệ / Lập trình", desc: "Git, Figma, Database, Coding..." },
  { id: "Business", label: "Kinh doanh / Khởi nghiệp", desc: "Economics, Startup, Chiến lược..." },
  { id: "SoftSkills", label: "Kỹ năng mềm", desc: "Giao tiếp, Quản lý thời gian..." },
  { id: "Design", label: "Thiết kế / UI/UX", desc: "Aesthetics, Layout, Wireframe..." },
  { id: "Health", label: "Sức khỏe / Đời sống", desc: "Lối sống, Chăm sóc bản thân..." },
];

const LEVELS = [
  { id: "Beginner", label: "Tập sự (Beginner)", desc: "Mới bắt đầu học tập lĩnh vực này" },
  { id: "Experienced", label: "Có kinh nghiệm (Experienced)", desc: "Đã có nền tảng hoặc đi làm thực tế" },
];

const COMMITMENTS = [
  { id: 5, label: "5 Phút / ngày", desc: "Học tinh gọn, siêu tốc độ" },
  { id: 10, label: "10 Phút / ngày", desc: "Học sâu hơn, thực hành vừa phải" },
  { id: 15, label: "15 Phút / ngày", desc: "Tập trung cao độ, thực hành sâu" },
];

export default function OnboardingPage() {
  const { refreshSession } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedCommitment, setSelectedCommitment] = useState<number>(0);

  const toggleTopic = (id: string) => {
    setErrorMsg(null);
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1 && selectedTopics.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 chủ đề bạn quan tâm.");
      return;
    }
    if (step === 2 && !selectedLevel) {
      setErrorMsg("Vui lòng chọn trình độ hiện tại của bạn.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(step - 1);
  };

  const handleFinish = async () => {
    setErrorMsg(null);
    if (selectedCommitment === 0) {
      setErrorMsg("Vui lòng chọn mức thời gian cam kết học mỗi ngày.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interestedTopics: selectedTopics,
          currentLevel: selectedLevel,
          commitmentTime: selectedCommitment,
        }),
      });

      if (res.ok) {
        // Refresh session to let AuthProvider detect isOnboarded = true
        await refreshSession();
        router.push("/dashboard");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Có lỗi xảy ra khi lưu thông tin.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Onboarding request failed:", error);
      setErrorMsg("Không thể kết nối đến máy chủ.");
      setIsSubmitting(false);
    }
  };

  const progressPercent = (step / 3) * 100;

  return (
    <div className="min-h-[100dvh] bg-[#F9F8F6] flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100/10 blur-[100px] pointer-events-none"></div>

      {/* Header Logo */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center gap-2.5 z-20">
        <div className="h-8 w-8 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-md">
          <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <span className="font-sans font-black text-xs tracking-wider text-[#2E2A24] uppercase">Daily Learn</span>
      </div>

      {/* Main Wizard Form Container */}
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto mt-8 mb-6">
        <div className="w-full rounded-[2rem] border border-[#E9E5DE] bg-white p-8 sm:p-9 shadow-[0_24px_50px_-16px_rgba(82,75,64,0.08)] space-y-6 relative z-20">
          
          {errorMsg && (
            <div className="rounded-xl bg-red-50/50 p-3.5 text-xs text-red-750 border border-red-100/60 font-semibold flex items-start gap-2 animate-pulse">
              <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: TOPICS SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#2E2A24]">
                  Chủ đề bạn quan tâm?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn những lĩnh vực bạn muốn học hỏi tinh gọn hằng ngày (Có thể chọn nhiều).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-4">
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none flex justify-between items-center cursor-pointer ${
                        isSelected
                          ? "bg-[#4F46E5] text-white border-[#2E2A24] shadow-sm"
                          : "bg-[#FAF9F6] text-slate-700 border-[#E2DDD5] hover:border-slate-400 hover:bg-[#F3EFE9]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{topic.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{topic.desc}</div>
                      </div>
                      {isSelected && (
                        <svg className="h-4.5 w-4.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: LEVEL OF USER */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#2E2A24]">
                  Trình độ hiện tại?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đánh giá năng lực của bạn để hệ thống đề xuất nội dung thực hành phù hợp.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-4">
                {LEVELS.map((level) => {
                  const isSelected = selectedLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none flex justify-between items-center cursor-pointer ${
                        isSelected
                          ? "bg-[#4F46E5] text-white border-[#2E2A24] shadow-sm"
                          : "bg-[#FAF9F6] text-slate-700 border-[#E2DDD5] hover:border-slate-400 hover:bg-[#F3EFE9]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{level.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{level.desc}</div>
                      </div>
                      {isSelected && (
                        <svg className="h-4.5 w-4.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: COMMITMENT TIME LIMIT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#2E2A24]">
                  Mục tiêu thời gian?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bạn sẵn sàng dành ra bao nhiêu phút học tập hằng ngày?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-4">
                {COMMITMENTS.map((item) => {
                  const isSelected = selectedCommitment === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCommitment(item.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none flex justify-between items-center cursor-pointer ${
                        isSelected
                          ? "bg-[#4F46E5] text-white border-[#2E2A24] shadow-sm"
                          : "bg-[#FAF9F6] text-slate-700 border-[#E2DDD5] hover:border-slate-400 hover:bg-[#F3EFE9]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{item.desc}</div>
                      </div>
                      {isSelected && (
                        <svg className="h-4.5 w-4.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS SECTION */}
          <div className="flex gap-3 pt-4 border-t border-[#E9E5DE]">
            {step > 1 && (
              <button
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-[#E2DDD5] text-xs font-bold text-slate-650 hover:bg-[#FAF9F6] transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] focus:outline-none cursor-pointer"
              >
                Quay lại
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3D3A34] transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] focus:outline-none cursor-pointer"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3D3A34] transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Đang lưu..." : "Hoàn thành"}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Upper Progress Bar Section (Positioned at bottom for layout balance) */}
      <div className="w-full max-w-md mx-auto mb-4 z-20">
        <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-100">
          <div
            className="h-full bg-[#4F46E5] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2.5 text-[9px] font-mono tracking-wider font-bold text-slate-400 uppercase">
          <span>Bước {step} / 3</span>
          <span>{Math.round(progressPercent)}% Hoàn tất</span>
        </div>
      </div>
    </div>
  );
}
