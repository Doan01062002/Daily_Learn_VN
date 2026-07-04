"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock login states
  const [mockEmail, setMockEmail] = useState("");
  const [mockName, setMockName] = useState("");

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockEmail) {
      setErrorMsg("Vui lòng nhập Email để đăng nhập giả lập.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await login("mock-token", mockEmail, mockName || undefined);
    if (!success) {
      setErrorMsg("Đăng nhập giả lập thất bại. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  const triggerGoogleLogin = async () => {
    setErrorMsg("Chức năng Google Auth chính thức yêu cầu Client ID. Sử dụng Dev Mode ở bên dưới để test nhanh.");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] grid md:grid-cols-2">
      {/* LEFT COLUMN: Visual Brand Illustration (Hidden on mobile) */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-[#3E3A35] text-[#FCFAF7] overflow-hidden">
        {/* Abstract background overlays */}
        <div className="absolute inset-0 bg-black/35 z-10"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login_hero.png"
          alt="Study minimalist graphic"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Small top logo mark */}
        <div className="relative z-20 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-serif font-bold text-sm tracking-wide">Daily Learn</span>
        </div>

        {/* Bottom quotes */}
        <div className="relative z-20 space-y-4 max-w-sm mt-auto">
          <p className="font-serif text-2xl font-bold leading-normal italic text-white/95">
            &ldquo;Tri thức tinh gọn mỗi ngày là chìa khóa mở ra cánh cửa trí tuệ lớn lao.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 bg-[#8C8375]"></div>
            <span className="text-xs uppercase tracking-wider font-semibold text-white/70">
              Cá nhân hóa lộ trình của bạn
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Minimalist Login Panel Card */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile branding head */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#8C8375] to-[#4E4941] flex items-center justify-center shadow-sm">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#3E3A35]">
                Nâng tầm tri thức
              </h1>
              <p className="text-xs text-[#8C8375] mt-1">
                Học tập tinh gọn 5-10 phút hằng ngày bằng tiếng Việt
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-xs text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
          )}

          {/* Login Actions */}
          <div className="space-y-4 pt-2">
            <button
              onClick={triggerGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#D5CFC5] bg-white px-4 py-3 text-xs font-semibold text-[#4E4941] shadow-sm transition duration-200 hover:bg-[#FAF8F5] focus:outline-none"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.76 5.76 0 0 1 8.2 12.8a5.76 5.76 0 0 1 5.79-5.8c1.47 0 2.8.53 3.82 1.41l3.07-3.07A9.87 9.87 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12a9.99 9.99 0 0 0 9.99 10c5.36 0 9.86-3.87 9.86-10 0-.68-.06-1.34-.17-1.715H12.24z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#EBE6DD]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#FAF8F5] px-2 text-[#8C8375] font-serif italic">Thử nghiệm Nhà phát triển</span>
            </div>
          </div>

          {/* Developer Mock Form */}
          <form onSubmit={handleMockLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">
                Email giả lập
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="ten-cua-ban@gmail.com"
                value={mockEmail}
                onChange={(e) => setMockEmail(e.target.value)}
                className="block w-full rounded-lg border border-[#D5CFC5] bg-white px-3 py-2 text-xs text-[#4E4941] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-[#8C8375] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">
                Tên hiển thị (Tùy chọn)
              </label>
              <input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={mockName}
                onChange={(e) => setMockName(e.target.value)}
                className="block w-full rounded-lg border border-[#D5CFC5] bg-white px-3 py-2 text-xs text-[#4E4941] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-[#8C8375] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-lg bg-[#4E4941] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-[#3E3A35] disabled:opacity-50 focus:outline-none"
            >
              {isSubmitting ? "Đang kết nối giả lập..." : "Đăng nhập thử nghiệm"}
            </button>
          </form>

          <div className="text-center text-[10px] text-[#BFB8AC] font-serif italic pt-4">
            Dữ liệu được lưu trữ an toàn trong SQLite/PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}
