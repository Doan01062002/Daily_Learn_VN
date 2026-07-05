"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";

export default function LoginPage() {
  const { login, refreshSession } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Capture ref query parameter on load
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) {
        localStorage.setItem("referredByCode", ref.trim().toUpperCase());
      }
    }
  }, []);

  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email / Password inputs (Register & Login)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // OTP Verification states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Forgot Password states
  const [showForgotPasswordOtp, setShowForgotPasswordOtp] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState("");
  const [forgotPasswordOtpCode, setForgotPasswordOtpCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
    otpCode?: string;
    forgotPasswordEmail?: string;
    forgotPasswordNewPassword?: string;
    forgotPasswordConfirmPassword?: string;
    forgotPasswordOtpCode?: string;
  }>({});

  // Countdown Timer for OTP Resend
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Clean error and success messages when changing modes
  const clearMsgs = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!cleanEmail) {
      newErrors.email = "Vui lòng điền email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.email = "Email không hợp lệ.";
        hasError = true;
      }
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const success = await login({ email: cleanEmail, password });
    if (success) {
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
    } else {
      setErrorMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
    try {
      if (showForgotPasswordOtp) {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail.trim(), newPassword: forgotPasswordNewPassword }),
        });
        if (res.ok) {
          setSuccessMsg("Mã xác thực OTP đã được gửi lại!");
          setResendCountdown(60);
        } else {
          const data = await res.json();
          setErrorMsg(data.error || "Không thể gửi lại OTP.");
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });
        if (res.ok) {
          setSuccessMsg("Mã xác thực OTP đã được gửi lại!");
          setResendCountdown(60);
        } else {
          const data = await res.json();
          setErrorMsg(data.error || "Không thể gửi lại OTP.");
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setFieldErrors((prev) => ({ ...prev, otpCode: "Vui lòng nhập OTP." }));
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    try {
      const referrerCode = localStorage.getItem("referredByCode") || undefined;
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otpCode: cleanOtp, referrerCode }),
      });

      if (res.ok) {
        setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
        await refreshSession();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "OTP thất bại.");
        setOtpLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối.");
      setOtpLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!cleanName) {
      newErrors.name = "Vui lòng nhập họ tên.";
      hasError = true;
    }

    if (!cleanEmail) {
      newErrors.email = "Vui lòng điền email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.email = "Email không hợp lệ.";
        hasError = true;
      }
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự.";
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      hasError = true;
    }

    if (!agreeToTerms) {
      newErrors.agreeToTerms = "Bạn cần đồng ý với Điều khoản để tiếp tục.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      });

      if (res.ok) {
        setSuccessMsg("Mã OTP đã được gửi đến email của bạn!");
        setShowOtpScreen(true);
        setResendCountdown(60);
        setIsSubmitting(false);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Đăng ký thất bại.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotPasswordEmail.trim();
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!cleanEmail) {
      newErrors.forgotPasswordEmail = "Vui lòng nhập email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.forgotPasswordEmail = "Email không hợp lệ.";
        hasError = true;
      }
    }

    if (!forgotPasswordNewPassword) {
      newErrors.forgotPasswordNewPassword = "Vui lòng nhập mật khẩu mới.";
      hasError = true;
    } else if (forgotPasswordNewPassword.length < 6) {
      newErrors.forgotPasswordNewPassword = "Mật khẩu tối thiểu 6 ký tự.";
      hasError = true;
    }

    if (!forgotPasswordConfirmPassword) {
      newErrors.forgotPasswordConfirmPassword = "Vui lòng xác nhận mật khẩu.";
      hasError = true;
    } else if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      newErrors.forgotPasswordConfirmPassword = "Mật khẩu xác nhận không khớp.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, newPassword: forgotPasswordNewPassword }),
      });

      if (res.ok) {
        setSuccessMsg("Mã OTP đã được gửi!");
        setShowForgotPasswordOtp(true);
        setResendCountdown(60);
        setIsSubmitting(false);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Gửi yêu cầu thất bại.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối.");
      setIsSubmitting(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = forgotPasswordOtpCode.trim();
    if (!cleanOtp) {
      setFieldErrors((prev) => ({ ...prev, forgotPasswordOtpCode: "Vui lòng nhập OTP." }));
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: forgotPasswordEmail.trim(), 
          otpCode: cleanOtp
        }),
      });

      if (res.ok) {
        setSuccessMsg("Đặt lại mật khẩu thành công!");
        await refreshSession();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "OTP thất bại.");
        setOtpLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối.");
      setOtpLoading(false);
    }
  };

  const triggerGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleIdToken = credential?.idToken;

      if (!googleIdToken) {
        throw new Error("Không lấy được Google ID Token.");
      }

      const success = await login({ credential: googleIdToken });
      if (success) {
        setSuccessMsg("Đăng nhập Google thành công!");
      } else {
        setErrorMsg("Đăng nhập Google thất bại.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      setErrorMsg("Đăng nhập Google thất bại.");
      setIsSubmitting(false);
    }
  };

  // Determine standard card limits for dynamic transition
  const cardMaxHeight = showOtpScreen 
    ? "max-h-[500px]" 
    : showForgotPasswordOtp 
    ? "max-h-[500px]" 
    : isForgotPasswordMode 
    ? "max-h-[540px]" 
    : isRegisterMode 
    ? "max-h-[820px]" 
    : "max-h-[520px]";

  return (
    <div className="min-h-[100dvh] bg-[#F9F8F6] text-[#2E2A24] grid md:grid-cols-2 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1.5deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-1.5deg); }
        }
        @keyframes mesh-pulse-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes mesh-pulse-2 {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 8s ease-in-out infinite;
        }
        .animate-mesh-1 {
          animation: mesh-pulse-1 12s ease-in-out infinite;
        }
        .animate-mesh-2 {
          animation: mesh-pulse-2 16s ease-in-out infinite;
        }
      `}} />

      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100/10 blur-[100px] pointer-events-none"></div>

      {/* LEFT COLUMN: Visual Brand Illustration */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-[#0B0C10] bg-gradient-to-br from-[#0B0C10] via-[#121625] to-[#0A0B0E] text-white overflow-hidden border-r border-[#1B1D26] select-none">
        <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/15 blur-[130px] pointer-events-none animate-mesh-1"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[140px] pointer-events-none animate-mesh-2"></div>

        <img
          src="/login_hero.png"
          alt="Study minimalist graphic"
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className="relative z-20 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
            <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-sans font-black text-sm tracking-wide text-white uppercase">Daily Learn</span>
        </div>

        <div className="relative z-20 flex flex-col gap-6 items-center justify-center my-auto">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_45px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-5 w-72 animate-float">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Tiến trình hôm nay</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Bài học đã hoàn thành</span>
                <span className="text-white font-bold">4 / 5</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full w-[80%]"></div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_15px_35px_-8px_rgba(0,0,0,0.4)] rounded-2xl p-4 w-60 self-end mr-6 animate-float-reverse">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#E54887]/15 flex items-center justify-center text-[#E54887]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chuỗi liên tục</div>
                <div className="text-sm font-mono font-bold text-white">12 Ngày Học Tập</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 space-y-3 max-w-sm">
          <p className="font-sans text-xl font-bold leading-normal italic text-slate-100/95 drop-shadow-sm">
            Tri thức tinh gọn mỗi ngày là chìa khóa mở ra cánh cửa trí tuệ lớn lao.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-6 bg-pink-400"></div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
              Cá nhân hóa lộ trình của bạn
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Smoothly Transitioning Card */}
      <div className="flex items-start justify-center pt-8 md:pt-14 p-4 sm:p-6 overflow-y-auto z-20">
        <div className={`w-full max-w-md bg-white border border-[#E9E5DE] p-7 sm:p-8 rounded-[2rem] shadow-[0_24px_50px_-16px_rgba(82,75,64,0.08)] transition-[max-height] duration-500 ease-in-out overflow-hidden space-y-5 ${cardMaxHeight}`}>
          
          {/* Header branding */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2">
            <div className="h-9 w-9 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-md">
              <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="font-sans text-xl font-extrabold tracking-tight text-slate-800">
                {showForgotPasswordOtp || isForgotPasswordMode
                  ? "Đặt lại mật khẩu"
                  : isRegisterMode
                  ? "Tạo tài khoản mới"
                  : "Nâng tầm tri thức"}
              </h1>
              <p className="text-[11px] text-[#8C8375] mt-0.5">
                {showForgotPasswordOtp || isForgotPasswordMode
                  ? "Nhập email và mã OTP để thiết lập mật khẩu mới"
                  : isRegisterMode
                  ? "Gia nhập cộng đồng học tập tinh gọn mỗi ngày"
                  : "Học tập tinh gọn 5-10 phút hằng ngày bằng tiếng Việt"}
              </p>
            </div>
          </div>

          {/* Toggle Tabs */}
          {!showOtpScreen && !showForgotPasswordOtp && !isForgotPasswordMode && (
            <div className="bg-[#FAF9F6] p-0.5 rounded-lg grid grid-cols-2 text-[11px] font-bold border border-[#EBE7DF]">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  clearMsgs();
                  setConfirmPassword("");
                  setAgreeToTerms(false);
                }}
                className={`py-1.5 rounded-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer ${
                  !isRegisterMode
                    ? "bg-white text-[#2E2A24] shadow-sm border border-[#EBE7DF]/50"
                    : "text-[#8C8375] hover:text-[#2E2A24]"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  clearMsgs();
                  setConfirmPassword("");
                  setAgreeToTerms(false);
                }}
                className={`py-1.5 rounded-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer ${
                  isRegisterMode
                    ? "bg-white text-[#2E2A24] shadow-sm border border-[#EBE7DF]/50"
                    : "text-[#8C8375] hover:text-[#2E2A24]"
                }`}
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Clean Inline error and success messages */}
          {(errorMsg || successMsg) && (
            <div className="transition-all duration-200">
              {errorMsg && (
                <div className="w-full rounded-lg bg-red-50/50 px-3.5 py-2 text-[10px] text-red-700 border border-red-100/60 font-semibold flex items-center gap-1.5 animate-pulse">
                  <svg className="h-3.5 w-3.5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="w-full rounded-lg bg-emerald-50/50 px-3.5 py-2 text-[10px] text-emerald-800 border border-emerald-100/60 font-semibold flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE FORMS SECTION */}
          <div>
            {showOtpScreen ? (
              /* OTP VERIFICATION FORM */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-3">
                  <div className="text-center space-y-0.5 bg-[#FAF9F6] py-2 px-3 rounded-xl border border-[#EBE7DF]">
                    <p className="text-[10px] text-[#8C8375] font-bold">Mã OTP đã được gửi đến:</p>
                    <p className="text-xs text-indigo-650 font-extrabold truncate">{email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
                      Nhập mã OTP 6 chữ số
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ""));
                        setFieldErrors((prev) => ({ ...prev, otpCode: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-4 py-2.5 text-center text-lg font-bold font-mono tracking-[0.5em] text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex w-full justify-center rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {otpLoading ? "Đang xác thực..." : "Xác thực OTP & Hoàn tất"}
                  </button>
                  <div className="text-center flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={resendCountdown > 0}
                      onClick={handleResendOtp}
                      className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold disabled:text-slate-400 cursor-pointer"
                    >
                      {resendCountdown > 0 ? `Gửi lại mã sau (${resendCountdown}s)` : "Gửi lại mã OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpScreen(false);
                        clearMsgs();
                        setOtpCode("");
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-655 font-bold hover:underline"
                    >
                      Quay lại trang đăng ký
                    </button>
                  </div>
                </div>
              </form>
            ) : showForgotPasswordOtp ? (
              /* FORGOT PASSWORD OTP VERIFICATION FORM */
              <form onSubmit={handleVerifyForgotPasswordOtp} className="space-y-4">
                <div className="space-y-3">
                  <div className="text-center space-y-0.5 bg-[#FAF9F6] py-2 px-3 rounded-xl border border-[#EBE7DF]">
                    <p className="text-[10px] text-[#8C8375] font-bold">Mã OTP đặt lại mật khẩu đã gửi:</p>
                    <p className="text-xs text-indigo-650 font-extrabold truncate">{forgotPasswordEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
                      Nhập mã OTP 6 chữ số
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={forgotPasswordOtpCode}
                      onChange={(e) => {
                        setForgotPasswordOtpCode(e.target.value.replace(/\D/g, ""));
                        setFieldErrors((prev) => ({ ...prev, forgotPasswordOtpCode: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-4 py-2.5 text-center text-lg font-bold font-mono tracking-[0.5em] text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex w-full justify-center rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {otpLoading ? "Đang xác thực..." : "Xác thực OTP & Hoàn tất"}
                  </button>
                  <div className="text-center flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={resendCountdown > 0}
                      onClick={handleResendOtp}
                      className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold disabled:text-slate-400 cursor-pointer"
                    >
                      {resendCountdown > 0 ? `Gửi lại mã sau (${resendCountdown}s)` : "Gửi lại mã OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPasswordOtp(false);
                        setIsForgotPasswordMode(true);
                        clearMsgs();
                        setForgotPasswordOtpCode("");
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-655 font-bold hover:underline"
                    >
                      Quay lại bước trước
                    </button>
                  </div>
                </div>
              </form>
            ) : isForgotPasswordMode ? (
              /* FORGOT PASSWORD REQUEST FORM */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email của bạn</label>
                    <input
                      type="email"
                      required
                      placeholder="email@daily-learn.vn"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, forgotPasswordEmail: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={forgotPasswordNewPassword}
                      onChange={(e) => {
                        setForgotPasswordNewPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, forgotPasswordNewPassword: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={forgotPasswordConfirmPassword}
                      onChange={(e) => {
                        setForgotPasswordConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, forgotPasswordConfirmPassword: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full justify-center rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Gửi mã đặt lại mật khẩu"}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        clearMsgs();
                        setForgotPasswordEmail("");
                        setForgotPasswordNewPassword("");
                        setForgotPasswordConfirmPassword("");
                      }}
                      className="text-[9px] text-indigo-650 hover:text-indigo-850 font-bold hover:underline cursor-pointer"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                </div>
              </form>
            ) : !isRegisterMode ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      required
                      placeholder="email@daily-learn.vn"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        clearMsgs();
                        setForgotPasswordEmail(email);
                      }}
                      className="text-[10px] text-slate-400 hover:text-indigo-650 font-bold hover:underline cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer mt-1"
                >
                  {isSubmitting ? "Đang xử lý đăng nhập..." : "Đăng nhập bằng Email"}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và tên</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      required
                      placeholder="email@daily-learn.vn"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu (Từ 6 ký tự)</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Nhập lại mật khẩu</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        setErrorMsg(null);
                      }}
                      className="block w-full rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => {
                        setAgreeToTerms(e.target.checked);
                        setFieldErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
                        setErrorMsg(null);
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-200 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="agreeToTerms" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                      Đồng ý <span className="text-indigo-650 font-extrabold hover:underline">Điều khoản</span> & <span className="text-indigo-650 font-extrabold hover:underline">Bảo mật</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
                >
                  {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký thành viên"}
                </button>
              </form>
            )}
          </div>

          {/* Social Sign-In buttons */}
          <div className="space-y-2 pt-3.5 border-t border-[#EBE7DF]">
            <button
              onClick={triggerGoogleLogin}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#E2DDD5] bg-white px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm transition duration-250 hover:bg-[#FAF9F6] active:scale-[0.99] focus:outline-none cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.76 5.76 0 0 1 8.2 12.8a5.76 5.76 0 0 1 5.79-5.8c1.47 0 2.8.53 3.82 1.41l3.07-3.07A9.87 9.87 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12a9.99 9.99 0 0 0 9.99 10c5.36 0 9.86-3.87 9.86-10 0-.68-.06-1.34-.17-1.715H12.24z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>

          <div className="text-center text-[9px] text-[#BFB8AC] font-mono uppercase tracking-wider">
            Hệ thống cơ sở dữ liệu bảo mật cao
          </div>
        </div>
      </div>
    </div>
  );
}
