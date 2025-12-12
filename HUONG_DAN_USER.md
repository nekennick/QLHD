# 📖 Hướng dẫn sử dụng QLHD - Hệ thống Quản lý Hợp đồng

## 🔧 Yêu cầu cài đặt

### Bước 1: Cài đặt Node.js

1. Tải Node.js từ: https://nodejs.org/
2. Chọn phiên bản **LTS** (khuyến nghị)
3. Chạy file cài đặt và nhấn **Next** cho đến khi hoàn tất

### Bước 2: Kiểm tra cài đặt

Mở **Command Prompt** (nhấn `Win + R`, gõ `cmd`, nhấn Enter) và chạy:

```
node --version
```

Nếu hiện ra số phiên bản (ví dụ: `v20.10.0`) là thành công.

---

## 🚀 Chạy ứng dụng

### Bước 1: Giải nén thư mục ứng dụng

Giải nén file `QLHD-app.zip` vào ổ đĩa (ví dụ: `D:\QLHD-app`)

### Bước 2: Mở Command Prompt

1. Mở thư mục `QLHD-app` vừa giải nén
2. Nhấn vào thanh địa chỉ, gõ `cmd` và nhấn Enter

Hoặc:
1. Nhấn `Win + R`
2. Gõ `cmd` và nhấn Enter
3. Gõ lệnh: `cd D:\QLHD-app` (thay đường dẫn phù hợp)

### Bước 3: Chạy ứng dụng

Gõ lệnh sau và nhấn Enter:

```
npm run start
```

Chờ cho đến khi thấy dòng:
```
▲ Next.js 16.0.8
- Local: http://localhost:3000
```

### Bước 4: Mở trình duyệt

Mở trình duyệt web (Chrome, Edge, Firefox...) và truy cập:

👉 **http://localhost:3000**

---

## 🔐 Đăng nhập

Sử dụng một trong các tài khoản sau:

| Vai trò | Tên đăng nhập | Mật khẩu |
|---------|---------------|----------|
| Lãnh đạo | `lanhdao` | `123456` |
| Người thực hiện | `thuchien` | `123456` |

---

## 📋 Hướng dẫn sử dụng

### Đối với Lãnh đạo (USER1):

1. **Đăng nhập** với tài khoản `lanhdao`
2. **Tạo hợp đồng mới**: Menu → Hợp đồng → Tạo mới
3. **Giao hợp đồng**: Chọn người thực hiện cho hợp đồng
4. **Xem báo cáo**: Menu → Báo cáo

### Đối với Người thực hiện (USER2):

1. **Đăng nhập** với tài khoản `thuchien`
2. **Xem hợp đồng được giao**: Menu → Hợp đồng
3. **Cập nhật tiến độ**: Click vào hợp đồng → Cập nhật thông tin
4. **Nhập thông tin**: Giao nhận, nghiệm thu, thanh toán, bảo hành

---

## ❓ Xử lý sự cố

### "Không mở được trang web"

1. Kiểm tra Command Prompt còn đang chạy không
2. Đảm bảo thấy dòng `Local: http://localhost:3000`
3. Thử mở lại: http://localhost:3000

### "Lỗi khi chạy lệnh npm"

1. Kiểm tra đã cài Node.js chưa
2. Thử mở lại Command Prompt với quyền Admin

### "Quên mật khẩu"

Liên hệ quản trị viên để reset tài khoản.

---

## ⚠️ Lưu ý quan trọng

- **Không đóng** cửa sổ Command Prompt khi đang sử dụng ứng dụng
- Để **tắt ứng dụng**: Quay lại Command Prompt, nhấn `Ctrl + C`
- Dữ liệu được lưu trong thư mục `prisma/dev.db`

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ bộ phận kỹ thuật.
