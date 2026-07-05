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

  // Countdown Timer for OTP Resend (Clean React effect)
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!cleanEmail) {
      newErrors.email = "Vui lòng điền địa chỉ email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.email = "Định dạng Email không hợp lệ.";
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
      setErrorMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.");
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
          setSuccessMsg("Mã xác thực OTP đặt lại mật khẩu mới đã được gửi!");
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
          setSuccessMsg("Mã xác thực OTP mới đã được gửi!");
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
      setFieldErrors((prev) => ({ ...prev, otpCode: "Vui lòng nhập mã xác thực OTP." }));
      return;
    }
    if (cleanOtp.length < 6) {
      setFieldErrors((prev) => ({ ...prev, otpCode: "Mã OTP phải có 6 chữ số." }));
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
        setSuccessMsg("Xác thực thành công! Đang tải phiên đăng nhập...");
        await refreshSession();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Xác thực OTP thất bại.");
        setOtpLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối máy chủ.");
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
      newErrors.name = "Vui lòng nhập họ và tên.";
      hasError = true;
    }

    if (!cleanEmail) {
      newErrors.email = "Vui lòng điền địa chỉ email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.email = "Định dạng Email không hợp lệ.";
        hasError = true;
      }
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải dài ít nhất 6 ký tự.";
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
      newErrors.agreeToTerms = "Bạn cần đồng ý với Điều khoản và Bảo mật để tiếp tục.";
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
        setSuccessMsg("Mã xác thực OTP đã được gửi đến email của bạn!");
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
      setErrorMsg("Lỗi kết nối máy chủ.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotPasswordEmail.trim();
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!cleanEmail) {
      newErrors.forgotPasswordEmail = "Vui lòng nhập địa chỉ email.";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.forgotPasswordEmail = "Định dạng Email không hợp lệ.";
        hasError = true;
      }
    }

    if (!forgotPasswordNewPassword) {
      newErrors.forgotPasswordNewPassword = "Vui lòng nhập mật khẩu mới.";
      hasError = true;
    } else if (forgotPasswordNewPassword.length < 6) {
      newErrors.forgotPasswordNewPassword = "Mật khẩu mới phải dài ít nhất 6 ký tự.";
      hasError = true;
    }

    if (!forgotPasswordConfirmPassword) {
      newErrors.forgotPasswordConfirmPassword = "Vui lòng xác nhận mật khẩu mới.";
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
        setSuccessMsg("Mã xác thực OTP đặt lại mật khẩu đã được gửi!");
        setShowForgotPasswordOtp(true);
        setResendCountdown(60);
        setIsSubmitting(false);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Gửi yêu cầu đặt lại mật khẩu thất bại.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối máy chủ.");
      setIsSubmitting(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = forgotPasswordOtpCode.trim();
    if (!cleanOtp) {
      setFieldErrors((prev) => ({ ...prev, forgotPasswordOtpCode: "Vui lòng nhập mã xác thực OTP." }));
      return;
    }
    if (cleanOtp.length < 6) {
      setFieldErrors((prev) => ({ ...prev, forgotPasswordOtpCode: "Mã OTP phải có 6 chữ số." }));
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
        setSuccessMsg("Đặt lại mật khẩu thành công! Đang tải phiên đăng nhập...");
        await refreshSession();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Xác thực OTP thất bại.");
        setOtpLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kết nối máy chủ.");
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
        throw new Error("Không lấy được Google ID Token từ kết quả đăng nhập.");
      }

      const success = await login({ credential: googleIdToken });
      if (success) {
        setSuccessMsg("Đăng nhập bằng Google thành công! Đang chuyển hướng...");
      } else {
        setErrorMsg("Đăng nhập bằng Google thất bại. Không thể đồng bộ tài khoản.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("Cửa sổ đăng nhập bằng Google đã bị đóng.");
      } else {
        setErrorMsg(error.message || "Đăng nhập bằng Google thất bại.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#FFFFFF] to-[#F5EFFF] text-slate-800 grid md:grid-cols-2 relative overflow-hidden">
      {/* Decorative background shapes for extra depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-200/20 blur-[100px] pointer-events-none"></div>

      {/* LEFT COLUMN: Visual Brand Illustration (Hidden on mobile) */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white overflow-hidden">
        {/* Subtle decorative overlay */}
        <div className="absolute inset-0 bg-indigo-900/10 z-10"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login_hero.png"
          alt="Study minimalist graphic"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Small top logo mark */}
        <div className="relative z-20 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-serif font-extrabold text-base tracking-wide text-white">Daily Learn</span>
        </div>

        {/* Bottom quotes */}
        <div className="relative z-20 space-y-4 max-w-sm mt-auto">
          <p className="font-serif text-2xl font-bold leading-normal italic text-white/95 drop-shadow-sm">
            &ldquo;Tri thức tinh gọn mỗi ngày là chìa khóa mở ra cánh cửa trí tuệ lớn lao.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 bg-pink-300"></div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-100">
              Cá nhân hóa lộ trình của bạn
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Glassmorphism Login Panel Card */}
      <div className="flex items-center justify-center p-6 sm:p-12 overflow-y-auto z-20">
        <div className="w-full max-w-md space-y-6 my-auto bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50">
          {/* Mobile branding head */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#EC4899] flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-slate-800">
                {showForgotPasswordOtp || isForgotPasswordMode
                  ? "Đặt lại mật khẩu"
                  : isRegisterMode
                  ? "Tạo tài khoản mới"
                  : "Nâng tầm tri thức"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
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
            <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 text-xs font-bold shadow-inner">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setConfirmPassword("");
                  setAgreeToTerms(false);
                  setFieldErrors({});
                }}
                className={`py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                  !isRegisterMode
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setConfirmPassword("");
                  setAgreeToTerms(false);
                  setFieldErrors({});
                }}
                className={`py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                  isRegisterMode
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                Đăng ký
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-600 border border-red-100 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs text-emerald-800 border border-emerald-100 font-semibold">
              🎉 {successMsg}
            </div>
          )}

          {/* Standard Form */}
          {showOtpScreen ? (
            /* OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 font-bold">
                  Chúng tôi đã gửi mã OTP gồm 6 chữ số đến email:
                </p>
                <p className="text-xs text-indigo-600 font-extrabold">{email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-3 text-center text-lg font-black tracking-widest text-slate-800 placeholder-slate-300 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.otpCode
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.otpCode && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1 text-center">
                    ⚠️ {fieldErrors.otpCode}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                {otpLoading ? "Đang xác thực..." : "Xác thực OTP & Hoàn tất"}
              </button>

              <div className="text-center pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={resendCountdown > 0}
                  onClick={handleResendOtp}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  {resendCountdown > 0 ? `Gửi lại mã sau (${resendCountdown}s)` : "Gửi lại mã OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpScreen(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setOtpCode("");
                    setFieldErrors({});
                  }}
                  className="text-2xs text-slate-400 hover:text-slate-600 font-semibold hover:underline cursor-pointer"
                >
                  Quay lại trang đăng ký
                </button>
              </div>
            </form>
          ) : showForgotPasswordOtp ? (
            /* FORGOT PASSWORD OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyForgotPasswordOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 font-bold">
                  Chúng tôi đã gửi mã OTP đặt lại mật khẩu đến email:
                </p>
                <p className="text-xs text-indigo-600 font-extrabold">{forgotPasswordEmail}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-3 text-center text-lg font-black tracking-widest text-slate-800 placeholder-slate-300 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.forgotPasswordOtpCode
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.forgotPasswordOtpCode && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1 text-center">
                    ⚠️ {fieldErrors.forgotPasswordOtpCode}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                {otpLoading ? "Đang xác thực..." : "Xác thực OTP & Hoàn tất"}
              </button>

              <div className="text-center pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={resendCountdown > 0}
                  onClick={handleResendOtp}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  {resendCountdown > 0 ? `Gửi lại mã sau (${resendCountdown}s)` : "Gửi lại mã OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordOtp(false);
                    setIsForgotPasswordMode(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setForgotPasswordOtpCode("");
                    setFieldErrors({});
                  }}
                  className="text-2xs text-slate-400 hover:text-slate-600 font-semibold hover:underline cursor-pointer"
                >
                  Quay lại bước trước
                </button>
              </div>
            </form>
          ) : isForgotPasswordMode ? (
            /* FORGOT PASSWORD REQUEST FORM */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Địa chỉ Email của bạn
                </label>
                <input
                  type="email"
                  required
                  placeholder="nhap-email@gmail.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setForgotPasswordEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, forgotPasswordEmail: undefined }));
                    setErrorMsg(null);
                  }}
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.forgotPasswordEmail
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.forgotPasswordEmail && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.forgotPasswordEmail}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.forgotPasswordNewPassword
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.forgotPasswordNewPassword && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.forgotPasswordNewPassword}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Xác nhận mật khẩu mới
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.forgotPasswordConfirmPassword
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.forgotPasswordConfirmPassword && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.forgotPasswordConfirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                {isSubmitting ? "Đang xử lý..." : "Gửi mã đặt lại mật khẩu"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setForgotPasswordEmail("");
                    setForgotPasswordNewPassword("");
                    setForgotPasswordConfirmPassword("");
                    setFieldErrors({});
                  }}
                  className="text-2xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : !isRegisterMode ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nhap-email@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    setErrorMsg(null);
                  }}
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.email
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.password
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setForgotPasswordEmail(email); // Autofill email if typed
                    setFieldErrors({});
                  }}
                  className="text-2xs text-slate-400 hover:text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                {isSubmitting ? "Đang xử lý đăng nhập..." : "Đăng nhập bằng Email"}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Họ và tên
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.name
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nhap-email@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    setErrorMsg(null);
                  }}
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.email
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu (Từ 6 ký tự)
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.password
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Nhập lại mật khẩu
                </label>
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
                  className={`block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition duration-200 focus:outline-none ${
                    fieldErrors.confirmPassword
                      ? "border-[#D32F2F] focus:border-[#D32F2F] ring-2 ring-[#D32F2F]/10"
                      : "border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10"
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-1 pl-1">
                    ⚠️ {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setAgreeToTerms(e.target.checked);
                      setFieldErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
                      setErrorMsg(null);
                    }}
                    className="h-4 w-4 rounded border-slate-200 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                  />
                  <label htmlFor="agreeToTerms" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                    Tôi đồng ý với <a href="#" className="text-indigo-600 hover:underline">Điều khoản</a> & <a href="#" className="text-indigo-600 hover:underline">Bảo mật</a>
                  </label>
                </div>
                {fieldErrors.agreeToTerms && (
                  <p className="text-[10px] font-semibold text-[#D32F2F] mt-0.5 pl-1">
                    ⚠️ {fieldErrors.agreeToTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition duration-200 disabled:opacity-50 focus:outline-none cursor-pointer mt-1"
              >
                {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký thành viên"}
              </button>
            </form>
          )}

          {/* Social Sign-In buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={triggerGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none cursor-pointer"
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

          <div className="text-center text-[10px] text-[#BFB8AC] font-serif italic">
            Dữ liệu được lưu trữ an toàn trong PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}
