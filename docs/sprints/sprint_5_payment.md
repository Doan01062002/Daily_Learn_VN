# Sprint 5: Thanh toán Premium (Payment Module)

- **Mục tiêu chính**: Thiết lập hệ thống tạo giao dịch nạp tiền, sinh mã VietQR chuyển khoản nhanh và Webhook xử lý nâng cấp gói Premium (99,000 VND / tháng).

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/payment_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/payment_flow.md`

### 2. Backend & Database Integration
- [ ] Lập trình API `/api/payments/create` để sinh giao dịch nạp tiền `PaymentTransaction` trạng thái `PENDING` và trả về mã VietQR.
- [ ] Lập trình API `/api/payments/webhook` đóng vai trò ngân hàng/cổng thanh toán gọi webhook cập nhật giao dịch thành `COMPLETED` và nâng cấp quyền người dùng thành `PREMIUM`.

### 3. Frontend & UIs
- [ ] Tích hợp nút "Nâng cấp Premium" trên Bảng điều khiển (`/dashboard`).
- [ ] Xây dựng màn hình thanh toán `/checkout` hiển thị lợi ích gói Premium và ảnh quét mã VietQR kèm số tiền & nội dung chuyển khoản tự điền.
- [ ] Nút kiểm tra "Tôi đã chuyển khoản" để người dùng chủ động tải lại trạng thái nâng cấp thành công.

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [payment_spec.md](../specs/payment_spec.md)
- Kịch bản sử dụng: [payment_flow.md](../user_stories/payment_flow.md)
