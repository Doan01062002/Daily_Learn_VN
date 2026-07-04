import React, { useState } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: string;
  quizId?: string;
}

export default function FeedbackModal({ isOpen, onClose, lessonId, quizId }: FeedbackModalProps) {
  const [type, setType] = useState("TYPO");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg("Vui lòng nhập chi tiết lỗi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          quizId,
          type,
          content,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setContent("");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Gửi báo cáo lỗi thất bại.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
          📬 Báo cáo lỗi học liệu
        </h3>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-3xl">✨</span>
            <p className="text-xs font-bold text-emerald-700">Cảm ơn bạn! Báo cáo đã được gửi tới Ban quản trị.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Phân loại lỗi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-1 focus:ring-[#8C8375]"
              >
                <option value="TYPO">Sai chính tả / lỗi gõ phím</option>
                <option value="WRONG_QUIZ">Đáp án Quiz chưa chuẩn</option>
                <option value="TRANSLATION">Lỗi dịch nghĩa / học thuật</option>
                <option value="OTHER">Lỗi khác</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Chi tiết nội dung lỗi
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả chi tiết lỗi bạn phát hiện..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C8375] font-serif"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 text-xs font-bold bg-[#4E4941] text-white hover:bg-[#3E3A35] rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
