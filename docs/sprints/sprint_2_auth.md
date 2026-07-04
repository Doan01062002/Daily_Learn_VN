# Sprint 2: Xác thực người dùng & Onboarding

- **Thời gian dự kiến**: Sprint 2
- **Mục tiêu chính**: Hiện thực hóa luồng đăng ký/đăng nhập qua Google và thiết lập hồ sơ người dùng Onboarding di động.

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/auth_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/auth_flow.md`

### 2. Backend & Database
- [ ] Cài đặt thư viện xử lý xác thực (NextAuth hoặc JWT helper & cookie parser)
- [ ] Viết API `/api/auth/login` (Xử lý Google OAuth token, tìm/tạo User trong DB với role STUDENT)
- [ ] Viết API `/api/auth/session` (Lấy thông tin phiên đăng nhập hỗ trợ Cookie & Authorization Header)
- [ ] Viết API `/api/auth/onboarding` (Lưu các trường `interestedTopics`, `currentLevel`, `commitmentTime`)

### 3. Frontend & UI
- [ ] Dựng trang đăng nhập `/login` (Google Sign-in button, Clean & Elegant UI)
- [ ] Dựng luồng Onboarding Wizard `/onboarding` (Card sliding, Chọn Topic/Level bằng nút nhấn)
- [ ] Dựng layout bảo vệ phiên đăng nhập (Học viên chưa Onboarding tự động chuyển sang `/onboarding`, học viên chưa đăng nhập tự động chuyển sang `/login`)

---

## Tài liệu liên quan
- Đặc tả kỹ thuật chi tiết: [auth_spec.md](../specs/auth_spec.md)
- Kịch bản người dùng: [auth_flow.md](../user_stories/auth_flow.md)
