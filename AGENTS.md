<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quy tắc Validate Giao diện & Form (Form & UI Validation Rules)
- **Xác thực hai lớp (Double-Layer Validation)**: Mọi biểu mẫu (form) hoặc hành động gửi dữ liệu (submission) từ giao diện đều phải được xác thực ở cả phía Client-side (Frontend) và Server-side (Backend).
- **Chuẩn hóa dữ liệu đầu vào (Input Trimming)**: Luôn thực hiện cắt bỏ các khoảng trắng thừa đầu và cuối (ví dụ: `input.trim()`) đối với các trường văn bản, đặc biệt là Email, Họ tên và Tên đăng nhập trên Frontend trước khi chạy Regex và gửi yêu cầu lên API.
- **Trạng thái thông báo lỗi (Error/Success Cleanups)**: Luôn dọn dẹp (clear) các thông báo lỗi cũ hoặc thông báo thành công khi người dùng thay đổi tab, chuyển đổi chế độ biểu mẫu hoặc chỉnh sửa lại giá trị trong các ô nhập để tránh hiển thị thông tin cũ gây hiểu nhầm.
- **Kết hợp kiểm tra HTML5 và JS**: Sử dụng kết hợp các thuộc tính ràng buộc mặc định của HTML5 (`required`, `type="email"`, `minLength`) cùng với kiểm tra logic nâng cao bằng mã JavaScript/TypeScript khi người dùng bấm nộp form.
