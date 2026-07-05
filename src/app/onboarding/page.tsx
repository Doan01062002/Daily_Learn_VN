"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";

const TOPICS = [
  { id: "Tech", label: "Công nghệ / Lập trình" },
  { id: "Business", label: "Kinh doanh / Khởi nghiệp" },
  { id: "SoftSkills", label: "Kỹ năng mềm" },
  { id: "Design", label: "Thiết kế / UI/UX" },
  { id: "Health", label: "Sức khỏe / Đời sống" },
];

const LEVELS = [
  { id: "Beginner", label: "Beginner", desc: "Mới bắt đầu tìm hiểu lĩnh vực này" },
  { id: "Experienced", label: "Experienced", desc: "Đã có nền tảng/kinh nghiệm thực tế" },
];

const COMMITMENTS = [
  { id: 5, label: "5 Phút / ngày", desc: "Tinh gọn, siêu tốc độ" },
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
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1 && selectedTopics.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 chủ đề quan tâm.");
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
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#3E3A35] px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Upper Progress Bar Section */}
      <div className="w-full max-w-md mx-auto mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EBE6DD]">
          <div
            className="h-full bg-[#8C8375] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs font-serif italic text-[#8C8375]">
          <span>Bước {step} trên 3</span>
          <span>{Math.round(progressPercent)}% Hoàn tất</span>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="flex-1 flex items-center justify-center mt-8">
        <div className="w-full max-w-md rounded-2xl border border-[#EBE6DD] bg-[#FCFAF7] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
          
          {errorMsg && (
            <div className="rounded-lg bg-[#FDF3F2] p-3 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: TOPICS INCLUDED */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#3E3A35]">
                  Chủ đề bạn quan tâm?
                </h2>
                <p className="text-sm text-[#8C8375] mt-1">
                  Chọn những lĩnh vực bạn muốn cập nhật tri thức hằng ngày (Có thể chọn nhiều).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-4">
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border font-medium transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                        isSelected
                          ? "bg-[#4E4941] text-white border-[#4E4941]"
                          : "bg-white text-[#4E4941] border-[#D5CFC5] hover:border-[#8C8375] hover:bg-[#F9F7F4]"
                      }`}
                    >
                      {topic.label}
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
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#3E3A35]">
                  Trình độ hiện tại?
                </h2>
                <p className="text-sm text-[#8C8375] mt-1">
                  Đánh giá năng lực của bạn để AI đề xuất bài viết có chiều sâu phù hợp.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-4">
                {LEVELS.map((level) => {
                  const isSelected = selectedLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                        isSelected
                          ? "bg-[#4E4941] text-white border-[#4E4941]"
                          : "bg-white border-[#D5CFC5] hover:border-[#8C8375] hover:bg-[#F9F7F4]"
                      }`}
                    >
                      <div className={`font-semibold ${isSelected ? "text-white" : "text-[#3E3A35]"}`}>
                        {level.label}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? "text-[#D5CFC5]" : "text-[#8C8375]"}`}>
                        {level.desc}
                      </div>
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
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#3E3A35]">
                  Mục tiêu thời gian?
                </h2>
                <p className="text-sm text-[#8C8375] mt-1">
                  Bạn sẵn sàng dành ra bao nhiêu phút học mỗi ngày?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-4">
                {COMMITMENTS.map((item) => {
                  const isSelected = selectedCommitment === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCommitment(item.id)}
                      className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] focus:outline-none ${
                        isSelected
                          ? "bg-[#4E4941] text-white border-[#4E4941]"
                          : "bg-white border-[#D5CFC5] hover:border-[#8C8375] hover:bg-[#F9F7F4]"
                      }`}
                    >
                      <div className={`font-semibold ${isSelected ? "text-white" : "text-[#3E3A35]"}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? "text-[#D5CFC5]" : "text-[#8C8375]"}`}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS SECTION */}
          <div className="flex gap-3 pt-4 border-t border-[#EBE6DD]">
            {step > 1 && (
              <button
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg border border-[#D5CFC5] text-sm font-semibold text-[#4E4941] hover:bg-[#F9F7F4] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] focus:outline-none"
              >
                Quay lại
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex-1 py-2.5 rounded-lg bg-[#4E4941] text-sm font-semibold text-white hover:bg-[#3E3A35] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] focus:outline-none"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-[#4E4941] text-sm font-semibold text-white hover:bg-[#3E3A35] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Hoàn thành"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
