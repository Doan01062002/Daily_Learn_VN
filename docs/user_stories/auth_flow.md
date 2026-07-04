# User Stories: Luồng Đăng nhập & Onboarding (Auth & Onboarding Flow)

Tài liệu này mô tả các câu chuyện người dùng (User Stories) và các tiêu chí nghiệm thu (Acceptance Criteria) liên quan đến trải nghiệm xác thực và cấu hình hồ sơ học viên.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Đăng nhập 1-click nhanh gọn (Học viên mới)
*   **Là** một người dùng mới bận rộn (Persona 2: Dân văn phòng).
*   **Tôi muốn** đăng ký tài khoản nhanh chóng chỉ bằng cách click chọn tài khoản Google có sẵn.
*   **Để** tôi không phải điền các form đăng ký rườm rà, tạo mật khẩu phức tạp hay mất thời gian xác thực email thủ công.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trang `/login` hiển thị duy nhất 1 nút "Đăng nhập với Google" nổi bật ở vùng Thumb-zone (vùng chạm của ngón cái).
*   **AC 2**: Khi nhấn vào nút, giao diện Google Sign-in hiện ra. Sau khi chọn tài khoản, nếu là email mới hoàn toàn, hệ thống tự động ghi nhận vào database và chuyển hướng ngay lập tức sang màn hình `/onboarding`.
*   **AC 3**: Quá trình đăng nhập từ lúc bấm nút đến lúc chuyển hướng không quá 2 giây trên kết nối di động 3G/4G thông thường.

---

### User Story 2: Onboarding cá nhân hóa phi kỹ thuật (Onboarding Wizard)
*   **Là** một người dùng bắt đầu học (Persona 1: Sinh viên, Persona 3: Trái ngành).
*   **Tôi muốn** được tự do lựa chọn các chủ đề mình thích (Tech, Business, SoftSkills) và tự nhận định trình độ hiện tại của mình bằng cách bấm nút trực quan.
*   **Để** hệ thống tự động phân phối các bài học phù hợp nhất với tôi, tránh việc bị ngợp bởi kiến thức quá khó hoặc quá dễ.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Giao diện Onboarding được thiết kế dạng thẻ trượt (Wizard Card) chia làm 3 bước:
    *   *Bước 1*: Chọn các chủ đề quan tâm (được chọn nhiều ô cùng lúc).
    *   *Bước 2*: Chọn trình độ hiện tại (Beginner hoặc Experienced - chỉ được chọn 1).
    *   *Bước 3*: Chọn thời gian cam kết học mỗi ngày (5, 10, 15 phút - chỉ được chọn 1).
*   **AC 2**: **Không có ô nhập văn bản (Text Input)**. Toàn bộ các lựa chọn được thiết kế dạng nút bấm lớn (tối thiểu 48x48px) dễ bấm chạm trên điện thoại di động.
*   **AC 3**: Thanh tiến trình (Progress Bar) hiển thị liên tục ở trên cùng màn hình để học viên biết họ đang ở bước nào (bước 1/3, 2/3, 3/3).
*   **AC 4**: Nút "Hoàn tất" ở bước cuối chỉ sáng lên và cho phép nhấn khi người dùng đã chọn đầy đủ các thông tin bắt buộc. Khi nhấn hoàn tất, dữ liệu được lưu vào database và chuyển hướng sang màn hình Dashboard chính `/dashboard`.

---

### User Story 3: Bảo vệ tuyến đường tự động (Route Protection)
*   **Là** một học viên cũ đã đăng ký và cấu hình hồ sơ.
*   **Tôi muốn** khi mở link trang chủ, hệ thống tự động nhận diện trạng thái của tôi để chuyển hướng đến đúng trang tôi cần.
*   **Để** tôi không phải đăng nhập lại mỗi ngày và không thể vô tình truy cập vào các trang onboarding/login khi đã hoàn tất.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Khi một request truy cập vào `/` hoặc `/dashboard`:
    *   Nếu chưa đăng nhập: Tự động chuyển hướng (Redirect) về `/login`.
    *   Nếu đã đăng nhập nhưng chưa hoàn thành Onboarding: Tự động chuyển hướng về `/onboarding`.
    *   Nếu đã đăng nhập và đã Onboarding: Hiển thị Dashboard chính.
*   **AC 2**: Khi một request truy cập vào `/login` hoặc `/onboarding` nhưng người dùng đã đăng nhập và hoàn thành Onboarding, hệ thống tự động chuyển hướng họ về `/dashboard`.
