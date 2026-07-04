# Đặc tả Kỹ thuật: Module Thanh toán Premium (Payment Specs)

Tài liệu này mô tả chi tiết cơ chế tích hợp chuyển khoản nhanh VietQR và API Webhook cập nhật gói dịch vụ Premium.

---

## 1. Cấu trúc VietQR Link Template

Hệ thống sử dụng dịch vụ sinh ảnh mã QR chuẩn Quốc gia VietQR từ hạ tầng VietQR.io thông qua định dạng URL tĩnh:
```
https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
```

**Các biến số cấu hình cứng**:
*   `BANK_ID`: `ICB` (Ngân hàng TMCP Công Thương Việt Nam - VietinBank).
*   `ACCOUNT_NO`: `102870102002` (Số tài khoản nhận).
*   `ACCOUNT_NAME`: `NGUYEN VAN DOAN` (Tên chủ tài khoản - URL encoded).
*   `TEMPLATE`: `compact` (Bản hiển thị tối giản chỉ bao gồm QR và logo).
*   `AMOUNT`: `99000` (Phí dịch vụ cố định 99,000 VND / tháng).
*   `DESCRIPTION`: Mã giao dịch duy nhất `txCode` (Ví dụ: `DLVN178312396432`).

---

## 2. API Endpoints

### 2.1. API Tạo giao dịch nâng cấp (`POST /api/payments/create`)
*   **Xác thực**: Yêu cầu Token JWT hợp lệ.
*   **Request Body**: Rỗng.
*   **Luồng xử lý trên Server**:
    1.  Sinh mã giao dịch duy nhất `txCode` theo công thức: `DLVN` + Unix timestamp (miliseconds) + số ngẫu nhiên 3 chữ số.
    2.  Tạo bản ghi mới trong bảng `PaymentTransaction` với:
        *   `amount`: `99000`
        *   `status`: `PENDING`
        *   `txCode`: Mã vừa tạo.
        *   `userId`: Lấy từ JWT.
    3.  Tạo chuỗi QR Code tương ứng chứa số tiền và nội dung chuyển khoản tự động.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "transaction": {
        "txCode": "DLVN178312396432",
        "amount": 99000,
        "bankName": "VietinBank (ICB)",
        "accountNumber": "102870102002",
        "accountName": "NGUYEN VAN DOAN",
        "qrCodeUrl": "https://img.vietqr.io/image/ICB-102870102002-compact.png?amount=99000&addInfo=DLVN178312396432&accountName=NGUYEN%20VAN%20DOAN"
      }
    }
    ```

---

### 2.2. API Webhook Đối soát giao dịch mô phỏng (`POST /api/payments/webhook`)
Cổng thanh toán hoặc Ngân hàng gửi callback báo biến động số dư.

*   **Request Headers**:
    *   `Authorization`: `Bearer mock-payment-webhook-secret-token` (Để tránh người dùng tự ý gọi trực tiếp).
*   **Request Body**:
    ```json
    {
      "txCode": "DLVN178312396432",
      "status": "COMPLETED"
    }
    ```
*   **Luồng xử lý trên Server**:
    1.  Kiểm tra header `Authorization`. Nếu sai, trả về 401.
    2.  Truy tìm giao dịch trong cơ sở dữ liệu dựa trên `txCode`.
    3.  Nếu không tìm thấy hoặc trạng thái giao dịch không phải là `PENDING`, trả về 400.
    4.  Cập nhật trạng thái `PaymentTransaction` thành `COMPLETED`.
    5.  Cập nhật thuộc tính `role` của `User` sở hữu giao dịch đó từ `STUDENT` lên `PREMIUM`.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User successfully upgraded to PREMIUM.",
      "userId": "user-uuid-123"
    }
    ```
