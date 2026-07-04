"use client";

import React from "react";
import { useAuth } from "@/components/layout/AuthProvider";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E3A35] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EBE6DD] bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#8C8375]"></span>
          <span className="font-serif font-bold text-lg tracking-wide">Daily Learn VN</span>
        </div>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
            alt="Avatar"
            className="h-8 w-8 rounded-full border border-[#D5CFC5]"
          />
          <button
            onClick={logout}
            className="text-xs font-semibold text-[#8C8375] hover:text-[#3E3A35] border border-[#D5CFC5] px-3 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition duration-200"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-[#EBE6DD] bg-[#FCFAF7] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || "https://lh3.googleusercontent.com/a/default-user"}
            alt="User Profile"
            className="h-16 w-16 rounded-full border-2 border-[#8C8375] shadow-sm"
          />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-[#3E3A35]">
              Chào mừng quay trở lại, {user.name}!
            </h1>
            <p className="text-sm text-[#8C8375]">
              Email: {user.email} (Role: <span className="font-semibold text-[#4E4941]">{user.role}</span>)
            </p>
          </div>
        </div>

        {/* User Configuration Detail Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#EBE6DD] bg-[#FCFAF7] p-5 space-y-2 shadow-sm">
            <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">Hồ sơ Onboarding</h3>
            <div className="text-sm text-[#4E4941]">
              <p className="mt-1">
                <strong>Chủ đề quan tâm:</strong> {user.interestedTopics.join(", ")}
              </p>
              <p className="mt-1">
                <strong>Trình độ hiện tại:</strong> {user.currentLevel}
              </p>
              <p className="mt-1">
                <strong>Thời gian cam kết:</strong> {user.commitmentTime} Phút / ngày
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#EBE6DD] bg-[#FCFAF7] p-5 space-y-2 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#8C8375] uppercase tracking-wider">Học tập liên tục</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="bg-[#FAF0E6] text-[#D35400] px-3 py-1.5 rounded-lg font-bold text-lg border border-[#F5D5C5] flex items-center gap-1.5 shadow-sm">
                  🔥 {user.streak?.currentStreak || 0} Ngày
                </div>
                <div className="text-xs text-[#8C8375]">
                  Streak kỷ lục: <strong>{user.streak?.maxStreak || 0} ngày</strong>
                </div>
              </div>
            </div>
            <div className="text-xs text-[#8C8375] italic">
              Hoàn thành bài học hôm nay để tăng chỉ số Streak của bạn!
            </div>
          </div>
        </div>

        {/* Feature Block Placeholder */}
        <div className="rounded-xl border border-dashed border-[#D5CFC5] p-10 text-center text-[#8C8375] space-y-2">
          <h3 className="font-serif text-lg font-bold text-[#4E4941]">Bài học hôm nay</h3>
          <p className="text-sm max-w-sm mx-auto">
            Chức năng phân phối bài học (Home Feed) sẽ được xây dựng ở Sprint tiếp theo.
          </p>
        </div>
      </main>
    </div>
  );
}
