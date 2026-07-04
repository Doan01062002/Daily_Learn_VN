"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TransactionData {
  txCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl: string;
}

export default function CheckoutPage() {
  const { user, refreshSession } = useAuth();
  const router = useRouter();

  // State
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  // Detect local environment to display sandbox tools
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const local =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        process.env.NODE_ENV === "development";
      setTimeout(() => setIsLocal(local), 0);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // If user is already premium, redirect to dashboard
    if (user.role === "PREMIUM" && !isUpgraded) {
      router.push("/dashboard");
      return;
    }

    const createTransaction = async () => {
      try {
        const res = await fetch("/api/payments/create", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setTransaction(data.transaction);
        } else {
          setErrorMsg("Không thể tạo hóa đơn giao dịch. Vui lòng quay lại sau.");
        }
      } catch (error) {
        console.error("Error creating payment transaction:", error);
        setErrorMsg("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    createTransaction();
  }, [user, router, isUpgraded]);

  const handleVerify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setVerifyMsg(null);

    try {
      // Fetch session directly to check if role has updated to PREMIUM
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user && data.user.role === "PREMIUM") {
          setIsUpgraded(true);
          if (refreshSession) {
            await refreshSession();
          }
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
          return;
        }
      }
      setVerifyMsg(
        "Hệ thống chưa nhận được thanh toán. Vui lòng đợi 1-2 phút hoặc sử dụng Hộp giả lập (Sandbox) phía dưới để kiểm thử."
      );
    } catch (error) {
      console.error("Verification failed:", error);
      setVerifyMsg("Lỗi khi kiểm tra trạng thái chuyển khoản.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSandboxSuccess = async () => {
    if (!transaction || sandboxLoading) return;
    setSandboxLoading(true);
    setVerifyMsg(null);

    try {
      const res = await fetch("/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-payment-webhook-secret-token",
        },
        body: JSON.stringify({
          txCode: transaction.txCode,
          status: "COMPLETED",
        }),
      });

      if (res.ok) {
        setIsUpgraded(true);
        if (refreshSession) {
          await refreshSession();
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setVerifyMsg("Giả lập Webhook thất bại.");
      }
    } catch (error) {
      console.error("Sandbox upgrade failed:", error);
      setVerifyMsg("Lỗi kết nối mạng khi giả lập webhook.");
    } finally {
      setSandboxLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C8375] hover:text-[#3E3A35] transition duration-200"
        >
          <span>←</span> Quay lại Dashboard
        </Link>
        <span className="font-serif italic text-xs text-[#BFB8AC]">Thanh toán</span>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
          </div>
        ) : errorMsg ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#FDF3F2] p-4 text-center text-sm text-[#D32F2F] border border-[#FBE3E1]">
              {errorMsg}
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center py-2.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold"
            >
              Về Dashboard
            </Link>
          </div>
        ) : isUpgraded ? (
          // CONGRATS SCREEN UPON UPGRADE
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center space-y-4 max-w-md mx-auto mt-12 shadow-sm animate-fade-in">
            <span className="text-5xl block">🎉</span>
            <h1 className="font-serif text-2xl font-bold text-emerald-950">
              Nâng cấp Premium Thành Công!
            </h1>
            <p className="text-sm text-emerald-800 leading-relaxed max-w-xs mx-auto">
              Tài khoản của bạn đã được nâng cấp lên <strong>Premium Member</strong>. Bạn hiện có thể học không giới hạn bài học hằng ngày!
            </p>
            <div className="text-xs text-emerald-600 font-serif italic">
              Đang chuyển hướng về Dashboard...
            </div>
          </div>
        ) : (
          // BILLING & QR CODE CARD
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#EBE6DD] bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Invoice breakdown details */}
              <div className="space-y-5">
                <div>
                  <h1 className="font-serif text-xl font-bold text-[#3E3A35]">
                    Nâng cấp Premium Member
                  </h1>
                  <p className="text-xs text-[#8C8375] mt-0.5">
                    Mở khóa giới hạn học tập suốt đời.
                  </p>
                </div>

                <div className="space-y-2 border-t border-b border-[#F0ECE4] py-4 text-sm text-[#4E4941]">
                  <div className="flex justify-between">
                    <span>Gói dịch vụ</span>
                    <span className="font-semibold">Premium (1 tháng)</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#3E3A35] pt-2">
                    <span>Tổng thanh toán</span>
                    <span>99,000 VND</span>
                  </div>
                </div>

                {/* Benefits checklist */}
                <div className="space-y-2 text-xs text-[#5C554B]">
                  <h3 className="font-bold uppercase tracking-wider text-[#8C8375]">
                    Quyền lợi Premium
                  </h3>
                  <ul className="space-y-1.5 list-none pl-0">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span> Học không giới hạn bài học hằng ngày.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span> Mở khóa toàn bộ chủ đề nâng cao.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span> Ưu tiên các tính năng thực hành nâng cao.
                    </li>
                  </ul>
                </div>
              </div>

              {/* VietQR display section */}
              {transaction && (
                <div className="flex flex-col items-center space-y-4 border-t md:border-t-0 md:border-l border-[#EBE6DD] pt-6 md:pt-0 md:pl-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={transaction.qrCodeUrl}
                    alt="VietQR Code"
                    className="w-56 h-56 border border-[#EBE6DD] rounded-xl p-2 bg-white shadow-sm"
                  />
                  
                  <div className="text-center space-y-1 text-xs">
                    <div className="text-[#8C8375]">
                      Quét mã bằng ứng dụng ngân hàng (Mobile Banking)
                    </div>
                    <div className="font-mono bg-[#FAF8F5] border border-[#EBE6DD] px-3 py-1.5 rounded text-[10px] text-[#3E3A35] inline-block font-semibold">
                      Nội dung: {transaction.txCode}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Check Payment Trigger */}
            <div className="space-y-4 text-center">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full py-3.5 rounded-lg bg-[#4E4941] text-white text-sm font-semibold hover:bg-[#3E3A35] transition duration-200 shadow-sm disabled:opacity-50 focus:outline-none"
              >
                {isVerifying ? "Đang đối soát..." : "Tôi đã chuyển khoản thành công"}
              </button>

              {verifyMsg && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800 p-3 leading-relaxed">
                  {verifyMsg}
                </div>
              )}
            </div>

            {/* DEVELOPER SANDBOX CONSOLE */}
            {isLocal && transaction && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50/20 p-6 space-y-3 shadow-[0_4px_15px_rgb(0,0,0,0.01)] mt-8 animate-fade-in">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🛠️</span>
                  <h3 className="text-xs font-bold text-yellow-900 uppercase tracking-wider">
                    Developer Sandbox (Môi trường thử nghiệm local)
                  </h3>
                </div>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  Bạn có thể nhấn nút dưới đây để giả lập sự kiện ngân hàng chuyển tiền thành công qua API Webhook.
                  Hệ thống sẽ tự động cập nhật cơ sở dữ liệu và nâng cấp vai trò của bạn sang Premium tức thì mà không cần nạp tiền thật.
                </p>
                <button
                  onClick={handleSandboxSuccess}
                  disabled={sandboxLoading}
                  className="w-full py-2.5 rounded-xl border border-yellow-300 bg-yellow-100/50 text-xs font-bold text-yellow-900 hover:bg-yellow-100 hover:border-yellow-400 transition duration-200 focus:outline-none"
                >
                  {sandboxLoading ? "Đang giả lập..." : "Giả lập Thanh toán Thành công"}
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
