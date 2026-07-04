# Daily Learn VN - Task Tracking

Tài liệu này theo dõi chi tiết toàn bộ các đầu việc cho phiên bản MVP của Daily Learn VN.

Trạng thái ký hiệu:
- `[ ]` Chưa thực hiện
- `[/]` Đang thực hiện
- `[x]` Đã hoàn thành

---

## 1. Thiết lập dự án & Cơ sở dữ liệu (Setup & Database)
- [/] Khởi tạo khung dự án Next.js (TypeScript, Tailwind CSS, App Router)
- [ ] Cài đặt và cấu hình Prisma ORM kết nối PostgreSQL
- [ ] Thiết lập tài liệu thiết kế cơ sở dữ liệu `docs/database_schema.md` và viết schema Prisma
- [ ] Seed dữ liệu mẫu (mẫu bài học, danh mục) để test API

## 2. Xác thực người dùng (Authentication - FR-01)
- [ ] Cài đặt thư viện xử lý xác thực (NextAuth hoặc JWT helper)
- [ ] Thiết lập Google OAuth 2.0 (1-click Sign-In)
- [ ] Viết API tạo tài khoản tự động (Role: STUDENT) khi đăng nhập lần đầu
- [ ] Thiết lập Onboarding Screen lưu: `interested_topics`, `current_level`, `daily_time_commitment`
- [ ] Cấu hình cơ chế xác thực kép: Cookie (Web) và Authorization Header Bearer (App di động)

## 3. Phân phối bài học - Home Feed (FR-02)
- [ ] Viết API `/api/lessons` trả về tối đa 3 bài học tĩnh phù hợp với Topic và Trình độ của người học
- [ ] Dựng màn hình Dashboard tối giản (Clean UI) hiển thị Daily Feature Card
- [ ] Dựng trang đọc bài học hiển thị định dạng Markdown và vùng "Hành động ngay" nổi bật
- [ ] Tích hợp tính năng bookmark (Lưu bài học để xem lại)

## 4. Trắc nghiệm & Hoàn thành bài học (Quiz & Evaluation - FR-03)
- [ ] Viết API `/api/quiz` nhận đáp án, chấm điểm, lưu tiến độ và trả về giải thích cụ thể cho từng câu
- [ ] Dựng module trắc nghiệm gồm 3 câu hỏi trắc nghiệm dưới chân bài đọc
- [ ] Thiết kế logic kiểm tra đạt >= 2/3 câu:
  - Nếu đạt: Cộng 50 XP, ghi nhận hoàn thành bài học, mở nút gợi ý bài tiếp theo
  - Nếu trượt: Khóa và cho phép làm lại tối đa 3 lần trong ngày

## 5. Streak & Bảng xếp hạng (Streak & Leaderboard - FR-04)
- [ ] Thiết lập logic kiểm tra và cập nhật `current_streak` và `max_streak` khi hoàn thành bài học đầu tiên trong ngày
- [ ] Cài đặt Redis và viết API `/api/leaderboard` lấy thông tin bảng xếp hạng sử dụng Sorted Sets
- [ ] Dựng màn hình Leaderboard hiển thị Top 20 user có XP cao nhất tuần cùng Avatar và Streak hiện tại
- [ ] Viết Cron-job chạy lúc 12:00 trưa hàng ngày gửi email nhắc nhở bảo vệ Streak

## 6. Curation Portal - Admin Panel (FR-05)
- [ ] Tạo API Route bảo mật cấp cao bằng Middleware Edge check `is_admin = true`
- [ ] Cấu hình API kết nối Gemini API sử dụng model `gemini-1.5-flash` và System Prompt chống bịa đặt (Anti-Hallucination)
- [ ] Dựng màn hình `/admin-portal` cho phép dán text/URL thô -> Gọi AI sinh nháp -> Chỉnh sửa -> Publish lên DB

## 7. Cổng thanh toán thủ công (Monetization)
- [ ] Thiết kế trang Paywall giới hạn bài học sau 3 ngày dùng thử
- [ ] Tích hợp tính năng hiển thị mã VietQR tĩnh tự động tạo nội dung chuyển khoản định danh
- [ ] Tích hợp hiển thị thông báo trạng thái tài khoản (STUDENT / PREMIUM)
