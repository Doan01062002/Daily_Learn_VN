# User Stories: Nâng cấp tài khoản Premium (Payment Flow)

Tài liệu này mô tả các kịch bản sử dụng (User Stories) và tiêu chí nghiệm thu (Acceptance Criteria) cho luồng thanh toán nâng cấp tài khoản Premium.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Chủ động nâng cấp tài khoản Premium (Premium Upgrade CTA)
*   **Là** một học viên đang sử dụng tài khoản miễn phí (`STUDENT`) muốn mở khóa tất cả các chủ đề học và không giới hạn số lượng bài học hàng ngày.
*   **Tôi muốn** nhìn thấy nút nâng cấp Premium rõ ràng và trực quan trên Bảng điều khiển (Dashboard).
*   **Để** tôi có thể truy cập ngay vào trang thanh toán nâng cấp.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trên Dashboard, nếu vai trò của người dùng là `STUDENT`, hiển thị một banner hoặc nhãn trạng thái khuyến khích nâng cấp: "Nâng cấp Premium - Mở khóa giới hạn".
*   **AC 2**: Banner chứa nút bấm "Nâng cấp ngay" chuyển hướng người dùng sang tuyến đường `/checkout`.
*   **AC 3**: Nếu vai trò người dùng đã là `PREMIUM`, banner này tự động ẩn đi và thay thế bằng huy hiệu vàng sang trọng: `★ Premium Member`.

---

### User Story 2: Thanh toán chuyển khoản nhanh bằng VietQR (Sleek Checkout UI)
*   **Là** một khách hàng bận rộn muốn thanh toán tối giản, không muốn nhập thủ công thông tin chuyển khoản ngân hàng.
*   **Tôi muốn** xem hóa đơn thanh toán gồm danh sách quyền lợi gói Premium (99.000đ/tháng) và mã QR chuyển khoản VietQR tự động điền sẵn số tiền & nội dung.
*   **Để** tôi chỉ cần mở ứng dụng ngân hàng (Mobile Banking) quét mã QR là hoàn tất trong 5 giây.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trang `/checkout` hiển thị danh sách quyền lợi gói Premium, tổng hóa đơn: `99,000 VND`.
*   **AC 2**: Hiển thị hộp thông tin tài khoản chuyển khoản ngân hàng chi tiết cùng mã VietQR lớn rõ nét.
*   **AC 3**: Cung cấp nút bấm kiểm tra "Tôi đã chuyển khoản thành công" để người dùng click kiểm tra giao dịch thời gian thực.

---

### User Story 3: Giả lập thanh toán thành công (Developer Test Tool)
*   **Là** một lập trình viên/người dùng thử nghiệm hệ thống.
*   **Tôi muốn** có một công cụ giả lập webhook ngân hàng ngay trên giao diện `/checkout` (chỉ hiển thị ở môi trường phát triển).
*   **Để** tôi có thể kích hoạt nhanh trạng thái thanh toán thành công mà không cần nạp tiền thật.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trong môi trường `development`, trang `/checkout` hiển thị một khu vực gỡ lỗi (Developer Testing Console).
*   **AC 2**: Khu vực gỡ lỗi chứa nút bấm "Giả lập Thanh toán Thành công" gọi trực tiếp tới API webhook với mã `txCode` hiện tại.
*   **AC 3**: Khi giả lập thành công, màn hình lập tức hiển thị thông báo chúc mừng tài khoản đã được nâng cấp lên Premium, tự động chuyển hướng về `/dashboard` sau 3 giây và chuyển trạng thái tài khoản thành `★ Premium Member`.
