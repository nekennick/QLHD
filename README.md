# QLHD - Hệ thống Quản lý Thực hiện Hợp đồng

Hệ thống web quản lý thực hiện hợp đồng được xây dựng bằng Next.js 16, Prisma ORM và SQLite.

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:

### 1. Node.js (phiên bản 18.x trở lên)

**Windows:**
- Tải từ: https://nodejs.org/
- Chọn phiên bản LTS (Long Term Support)
- Chạy file cài đặt và làm theo hướng dẫn

**Kiểm tra cài đặt:**
```bash
node --version
npm --version
```

### 2. Git

**Windows:**
- Tải từ: https://git-scm.com/download/win
- Chạy file cài đặt với cấu hình mặc định

**Kiểm tra cài đặt:**
```bash
git --version
```

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone repository

```bash
git clone https://github.com/nekennick/QLHD.git
cd QLHD
```

### Bước 2: Di chuyển vào thư mục ứng dụng

```bash
cd app
```

### Bước 3: Cài đặt các thư viện

```bash
npm install
```

### Bước 4: Cấu hình môi trường

Tạo file `.env` trong thư mục `app` với nội dung sau:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth Secret (thay bằng chuỗi ngẫu nhiên của bạn)
AUTH_SECRET="your-super-secret-key-change-this-in-production"
```

> **Lưu ý:** Bạn có thể tạo AUTH_SECRET ngẫu nhiên bằng lệnh:
> ```bash
> openssl rand -base64 32
> ```
> Hoặc sử dụng website: https://generate-secret.vercel.app/32

### Bước 5: Khởi tạo cơ sở dữ liệu

```bash
# Tạo database và các bảng
npx prisma generate
npx prisma db push
```

### Bước 6: Tạo dữ liệu mẫu (tùy chọn)

Để tạo tài khoản mẫu cho hệ thống, chạy lệnh:

```bash
npx ts-node prisma/seed.ts
```

Hoặc truy cập endpoint sau để seed data:
```
http://localhost:3000/api/seed
```

**Tài khoản mẫu:**
| Vai trò | Username | Mật khẩu |
|---------|----------|----------|
| Lãnh đạo (USER1) | lanhdao | 123456 |
| Người thực hiện (USER2) | thuchien | 123456 |

### Bước 7: Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

## 📁 Cấu trúc dự án

```
QLHD/
├── app/                    # Thư mục chính của ứng dụng Next.js
│   ├── prisma/
│   │   └── schema.prisma   # Định nghĩa database schema
│   ├── src/
│   │   ├── app/            # Các trang và API routes
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities và cấu hình
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── .env                # Cấu hình môi trường (tự tạo)
├── QLHD.md                 # Tài liệu thiết kế hệ thống
└── README.md               # Hướng dẫn này
```

## 🔧 Các lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy ứng dụng ở chế độ development |
| `npm run build` | Build ứng dụng cho production |
| `npm run start` | Chạy ứng dụng đã build |
| `npx prisma studio` | Mở giao diện quản lý database |
| `npx prisma db push` | Đồng bộ schema với database |

## 🎯 Tính năng chính

1. **Quản lý người dùng & phân quyền**
   - Lãnh đạo (USER1): Tạo và giao hợp đồng
   - Người thực hiện (USER2): Cập nhật tiến độ hợp đồng

2. **Quản lý hợp đồng**
   - Tạo mới hợp đồng
   - Theo dõi tiến độ thực hiện
   - Giao nhận, nghiệm thu, thanh toán

3. **Báo cáo thống kê**
   - Thống kê tổng quan
   - Lọc và tìm kiếm hợp đồng

## ❓ Xử lý sự cố

### Lỗi: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Lỗi: Database không tồn tại
```bash
npx prisma db push
```

### Lỗi: Port 3000 đã được sử dụng
```bash
npm run dev -- -p 3001
```

### Xóa và cài đặt lại node_modules
```bash
rm -rf node_modules
npm install
```

## 📞 Liên hệ

Nếu gặp vấn đề, vui lòng tạo issue tại: https://github.com/nekennick/QLHD/issues

## 📄 License

MIT License
