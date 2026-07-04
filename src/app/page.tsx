export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#FAF8F5] text-[#3E3A35]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C8375] border-t-transparent"></div>
        <p className="font-serif italic text-sm text-[#8C8375]">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
