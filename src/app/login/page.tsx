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
    // In MVP, we display instructions or mock since actual Google Client API takes time to setup
    setErrorMsg("Chức năng Google Auth chính thức yêu cầu Client ID. Sử dụng Dev Mode ở bên dưới để test nhanh.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#EBE6DD] bg-[#FCFAF7] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        
        {/* Header Section */}
        <div className="text-center">
          <span className="font-serif italic text-sm tracking-wide text-[#8C8375]">Daily Learn VN</span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#3E3A35] sm:text-4xl">
            Nâng tầm tri thức
          </h1>
          <p className="mt-2 text-sm text-[#8C8375]">
            Học tập tinh gọn 5-10 phút hằng ngày bằng tiếng Việt
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-[#FDF3F2] p-3 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
            {errorMsg}
          </div>
        )}

        {/* Action Button Section */}
        <div className="space-y-4">
          <button
            onClick={triggerGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#D5CFC5] bg-white px-4 py-3 font-medium text-[#4E4941] shadow-sm transition duration-200 hover:bg-[#F9F7F4] hover:border-[#BFB8AC] focus:outline-none"
          >
            {/* Google Minimalist SVG Icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FCFAF7] px-2 text-[#8C8375] font-serif italic">Dev Local Test</span>
          </div>
        </div>

        {/* Local Dev Mock Login Form */}
        <form onSubmit={handleMockLogin} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#8C8375] uppercase tracking-wider">
              Email Giả lập
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="ten-ban@gmail.com"
              value={mockEmail}
              onChange={(e) => setMockEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#D5CFC5] bg-white px-3 py-2 text-sm text-[#4E4941] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-[#8C8375] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-[#8C8375] uppercase tracking-wider">
              Tên hiển thị (Tùy chọn)
            </label>
            <input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={mockName}
              onChange={(e) => setMockName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#D5CFC5] bg-white px-3 py-2 text-sm text-[#4E4941] placeholder-[#BFB8AC] shadow-sm transition duration-200 focus:border-[#8C8375] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-[#4E4941] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#3E3A35] disabled:opacity-50 focus:outline-none"
          >
            {isSubmitting ? "Đang kết nối..." : "Đăng nhập Local"}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center text-xs text-[#BFB8AC] mt-4 font-serif italic">
          Bảo mật an toàn mã hóa qua HTTPS & HttpOnly Cookie
        </div>
      </div>
    </div>
  );
}
