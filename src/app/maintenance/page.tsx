import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function getSupportPhone(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "settings.json");
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.supportPhone || "0987654321";
  } catch (e) {
    return "0987654321";
  }
}

export default async function MaintenancePage() {
  const phone = await getSupportPhone();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-rose-500/10 rounded-full blur-3xl" />

        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-900 flex items-center justify-center shadow-lg shadow-rose-950/50 border border-rose-500/30 animate-pulse">
            <svg className="h-10 w-10 text-rose-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-sans font-black text-2xl tracking-tight text-white">Hệ thống đang Bảo trì</h1>
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            Chúng tôi đang cập nhật các tính năng học tập mới để nâng cấp trải nghiệm của bạn tốt hơn. Hệ thống sẽ sớm hoạt động trở lại.
          </p>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span>Dịch vụ liên quan</span>
            <span className="font-bold text-slate-200">Daily Learn VN Core</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Hotline khẩn cấp</span>
            <span className="font-bold text-rose-400 font-mono">{phone}</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </div>
      </div>
    </div>
  );
}
