# Frontend Admin Dashboard - BotShop

Đây là giao diện quản trị viên (Admin Dashboard) của hệ thống BotShop, được xây dựng để quản lý sản phẩm, tài khoản kho, đơn hàng và cấu hình thanh toán.

## 🚀 Công nghệ sử dụng (Tech Stack)
- **Framework:** React 18 (Vite)
- **Ngôn ngữ:** TypeScript
- **State Management & Data Fetching:** Redux Toolkit + RTK Query
- **Routing:** React Router DOM v6
- **Styling:** Custom CSS (Glassmorphism & Dark Mode)
- **Biểu đồ:** Recharts
- **Icons:** Lucide React
- **Thông báo (Toasts):** React Hot Toast

## 📂 Cấu trúc thư mục

```text
fe_admin/
├── src/
│   ├── api/            # Tích hợp RTK Query gọi API xuống Backend
│   │   ├── baseApi.ts  # Tự động đính kèm token (Bearer JWT)
│   │   ├── authApi.ts  # Đăng nhập
│   │   ├── ...         # productApi, accountApi, orderApi, paymentApi
│   ├── components/     # UI Components dùng chung (Header, Sidebar, Modal, Table...)
│   ├── pages/          # Các trang chính (Login, Dashboard, Products, Accounts...)
│   ├── store/          # Redux Store (Lưu trữ auth state & jwt token)
│   ├── types/          # Định nghĩa kiểu dữ liệu (TypeScript Interfaces)
│   ├── App.tsx         # Khởi tạo React Router
│   ├── main.tsx        # Điểm bắt đầu (Entry point), bọc Redux Provider
│   └── index.css       # File CSS Global (Design System Variables)
├── index.html
├── vite.config.ts      # Cấu hình Vite & Proxy chuyển tiếp gọi API tới cổng 8080 (BE)
└── package.json
```

## ⚙️ Cài đặt và Chạy thử (Local Development)

### Yêu cầu tiên quyết:
- Đã cài đặt **Node.js** (Khuyên dùng v18 hoặc v20+).
- Đã chạy **Backend Spring Boot** ở cổng `8080`.

### Các bước khởi chạy:

1. **Cài đặt thư viện (Chỉ chạy 1 lần đầu tiên):**
   ```bash
   npm install
   ```

2. **Khởi chạy môi trường Dev:**
   ```bash
   npm run dev
   ```

3. Mở trình duyệt và truy cập: [http://localhost:5173](http://localhost:5173).  
   *Mọi lời gọi API từ FE (`/api/v1/...`) sẽ được Vite tự động chuyển tiếp (proxy) xuống Backend đang chạy ở cổng 8080, do đó bạn không cần lo về lỗi CORS trong quá trình Dev.*

## 🔒 Cơ chế Đăng nhập (Authentication)
- Khi User đăng nhập thành công ở `LoginPage`, hệ thống lưu JWT Access Token vào cả **Redux State** và **LocalStorage**.
- `baseApi.ts` sẽ tự động bốc Token từ Redux State và nhét vào Header `Authorization: Bearer <token>` trong mọi Request gọi về BE.
- Nếu Token hết hạn hoặc chưa đăng nhập, `ProtectedRoute` sẽ tự động văng người dùng về trang `/login`.

## 📦 Build lên Môi trường Production

Để đóng gói ra thư mục tĩnh (Static HTML/CSS/JS) chuẩn bị mang đi host (ví dụ: Nginx, Vercel, Netlify): 

```bash
npm run build
```
Kết quả build sẽ nằm trong thư mục `dist/`. 
