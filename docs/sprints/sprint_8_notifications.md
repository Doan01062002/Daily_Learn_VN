# Sprint 8: Nhắc nhở học tập (Notifications & Email Reminders)

- **Mục tiêu chính**: Thiết lập hệ thống thông báo nhắc nhở học tập hàng ngày cho những học viên chưa hoàn thành bài học hôm nay nhằm duy trì chuỗi ngày Streak.

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/notifications_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/notifications_flow.md`

### 2. Backend & Notification Service
- [ ] Lập trình dịch vụ trừu tượng gửi email tại `src/lib/notifications.ts`:
  * Hỗ trợ chế độ development (ghi nhận email ra màn hình console và file logs).
  * Chuẩn bị sẵn cấu trúc tích hợp Nodemailer/Resend khi chạy trên môi trường production.
- [ ] Lập trình API `/api/notifications/remind` (GET hoặc POST):
  * Bảo vệ tuyến đường API bằng mã khóa bảo vệ Cron (Cron Authorization Secret).
  * Lọc danh sách người dùng chưa hoàn thành bất cứ bài học nào ngày hôm nay.
  * Tự động gọi dịch vụ gửi email cảnh báo "Sắp mất chuỗi Streak 🔥".

### 3. Verification & CI Sync
- [ ] Lập trình bộ test TDD (Vitest) kiểm soát tính chính xác của thuật toán lọc người dùng chưa học và tính năng bảo mật token.
- [ ] Chạy build & test kiểm tra dự án (`npm.cmd run test` & `npm.cmd run build`).
- [ ] Đẩy code/tài liệu lên GitHub bằng `npm.cmd run git-sync`.

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [notifications_spec.md](../specs/notifications_spec.md)
- Kịch bản sử dụng: [notifications_flow.md](../user_stories/notifications_flow.md)
