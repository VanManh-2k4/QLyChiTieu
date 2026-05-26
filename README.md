<div align="center">

  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-20.11.0-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.19.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">

</div>

<h1 align="center">
  💰 QLyChiTieu - Quản Lý Chi Tiêu Cá Nhân
</h1>

<p align="center">
  <strong>Hệ thống quản lý tài chính cá nhân toàn diện với giao diện hiện đại và tính năng thông minh</strong>
</p>

<p align="center">
  <a href="#-mô-tả-dự-án">Mô tả</a> •
  <a href="#-tính-năng-chính">Tính năng</a> •
  <a href="#-công-nghệ-sử-dụng">Công nghệ</a> •
  <a href="#-cài-đặt">Cài đặt</a> •
  <a href="#-hướng-dẫn-sử-dụng">Hướng dẫn</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<div align="center">

  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
  ![Issues](https://img.shields.io/badge/issues-welcome-orange.svg)

</div>

---

## 📸 Demo / Giao diện

<div align="center">
  <img src="https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=Dashboard+View" alt="Dashboard View" width="800">
  <p><em>Giao diện Dashboard với biểu đồ thu/chi theo danh mục và tháng</em></p>
</div>

<div align="center">
  <img src="https://via.placeholder.com/1200x400/10B981/FFFFFF?text=Transaction+Management" alt="Transaction View" width="800">
  <p><em>Giao diện quản lý giao dịch với calendar view</em></p>
</div>

---

## 📝 Mô tả dự án

**QLyChiTieu** là một ứng dụng web quản lý tài chính cá nhân hoàn chỉnh, giúp người dùng theo dõi thu nhập, chi tiêu, quản lý ngân sách, và tiết kiệm một cách hiệu quả. Ứng dụng được xây dựng với kiến trúc hiện đại, giao diện người dùng thân thiện và các tính năng phân tích tài chính thông minh.

### 🎯 Mục tiêu dự án

- Theo dõi dòng tiền thu/chi theo thời gian thực
- Quản lý ngân sách theo danh mục với cảnh báo vượt ngân sách
- Phân tích chi tiêu với biểu đồ trực quan
- Quản lý tiết kiệm và chuyển tiền giữa ví và quỹ
- Export báo cáo đa định dạng (CSV, Excel, Backup JSON)
- Hệ thống lịch sử hoạt động chi tiết
- Giao diện hiện đại với theme tùy chỉnh

---

## ✨ Tính năng chính

### 💳 Quản lý Ví
- Tạo, sửa, xóa ví
- Theo dõi số dư ví theo thời gian thực
- Hỗ trợ nhiều ví đồng thời
- Tự động tạo ví tiền mặt cho mỗi người dùng

### 📊 Quản lý Giao Dịch
- Thêm giao dịch thu/chi với danh mục
- Calendar view xem giao dịch theo ngày
- Filter và tìm kiếm giao dịch
- Phân loại giao dịch theo danh mục có emoji
- Tự động trừ tiền từ ngân sách khi chi tiêu

### 🎯 Quản lý Ngân Sách
- Thiết lập ngân sách theo danh mục, tháng và ví
- Theo dõi tiến độ sử dụng ngân sách
- Cảnh báo khi sắp/vượt ngân sách với health score
- Gợi ý chi tiêu hàng ngày dựa trên ngân sách còn lại
- Rút tiền còn lại về ví khi cần
- Xem chi tiết ngân sách với lịch sử giao dịch
- Biểu đồ lịch sử ngân sách 6 tháng
- Phân tích hiệu suất ngân sách với insights

### 🐖 Quản lý Tiết Kiệm
- Tạo quỹ tiết kiệm với số dư ban đầu
- Chuyển tiền giữa ví và quỹ (nạp/rút)
- Theo dõi lịch sử chuyển tiết kiệm
- Tính toán dòng tiền tiết kiệm ròng

### 🎯 Mục Tiêu Tiết Kiệm (Goals)
- Tạo mục tiêu tiết kiệm với số tiền mục tiêu và ngày hoàn thành
- Theo dõi tiến độ với progress bar
- Thêm/rút tiền vào mục tiêu
- Tự động tính toán: tiền còn thiếu, ngày còn lại, tiền cần tiết kiệm/ngày
- Xem lịch sử giao dịch mục tiêu
- Liên kết mục tiêu với ví cụ thể
- Hoàn tiền về ví khi xóa mục tiêu

### 📈 Dashboard & Phân Tích
- Tổng quan thu/chi tháng hiện tại
- Tổng tiết kiệm (quỹ + mục tiêu)
- Biểu đồ pie chi tiêu theo danh mục
- Biểu đồ bar thu/chi theo tháng
- Gợi ý ngân sách và chi tiêu hàng ngày
- Phân tích kinh tế (tốt/trung bình/kém)

### 📜 Lịch Sử Hoạt Động
- Nhật ký tất cả thao tác hệ thống
- Filter theo phạm vi thời gian (ngày/tháng/năm/tất cả)
- Filter theo loại hoạt động (giao dịch, tiết kiệm, mục tiêu, ngân sách)
- Phân tích dòng tiền theo kỳ
- Top danh mục thu/chi
- Biểu đồ thu/chi theo năm
- Phân tích chi tiết theo ngày, tháng, năm

### 📊 Báo Cáo Phân Tích
- **Tab Xu hướng**: Budget vs Actual, Seasonality, YoY comparison, Trend scoring, Health Score
- **Tab Tổng kết**: Deep dive breakdown, Heatmap chi tiêu theo ngày, Transaction list, MoM/YoY comparison
- **Tab Ngân sách**: Health score, Overspending alerts, Budget history (6 tháng), Performance insights
- **Tab Mục tiêu**: Progress chart theo thời gian, Estimated completion date, Insights & recommendations
- **Tab Gợi ý tiết kiệm**: Actionable suggestions, Category detail modal

### 🎨 Theme System
- 4 themes hiện đại: Indigo, Emerald, Sunset, Slate Dark
- Tự động áp dụng theme và lưu preference
- CSS variables cho dễ tùy chỉnh

### 📤 Export Dữ Liệu
- **CSV**: Xuất dữ liệu với UTF-8, mở tốt bằng Excel
- **Excel**: Định dạng .xlsx với styling chuyên nghiệp, biểu đồ
- **Backup JSON**: Sao lưu đầy đủ để khôi phục
- Filter theo phạm vi thời gian (ngày/tháng/năm/tất cả)

### 📱 Responsive Design
- Tối ưu cho cả desktop và mobile
- Hamburger menu cho mobile
- Sidebar overlay với backdrop
- Adaptive padding và grid system
- Modal, Form, Table, Chart responsive
- Button touch optimization

### 🔒 Authentication & Security
- Đăng ký/Đăng nhập với JWT
- Mã hóa mật khẩu với bcrypt
- 2FA với TOTP (speakeasy)
- Backup codes cho 2FA
- Reset mật khẩu qua email
- Protected routes với middleware

---

## 🛠️ Công nghệ sử dụng

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20.11.0-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-jsonwebtoken-000000?style=flat-square&logo=jsonwebtoken&logoColor=white)
![Bcrypt](https://img.shields.io/badge/Bcrypt-bcryptjs-000000?style=flat-square&logo=bcrypt&logoColor=white)
![Joi](https://img.shields.io/badge/Joi-Validation-4A90E2?style=flat-square&logo=joi&logoColor=white)
![Speakeasy](https://img.shields.io/badge/Speakeasy-2FA-000000?style=flat-square&logo=otp&logoColor=white)
![CORS](https://img.shields.io/badge/CORS-2.8.5-000000?style=flat-square&logo=cors&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.11-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.7.9-5A29E4?style=flat-square&logo=axios&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.15.0-FF6B6B?style=flat-square&logo=recharts&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.28.0-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-Icons-000000?style=flat-square&logo=lucide&logoColor=white)

### Export Libraries
![ExcelJS](https://img.shields.io/badge/ExcelJS-4.4.0-217346?style=flat-square&logo=excel&logoColor=white)
![FileSaver](https://img.shields.io/badge/FileSaver-2.0.5-000000?style=flat-square&logo=javascript&logoColor=white)

---

## 📁 Cấu trúc thư mục

```
QLyChiTieu/
├── backend/                          # Backend API
│   ├── src/
│   │   ├── config/                   # Cấu hình ứng dụng
│   │   │   └── index.js             # JWT secret, database path
│   │   ├── database/                 # Database initialization
│   │   │   └── db.js                # SQLite setup with better-sqlite3
│   │   ├── middlewares/              # Express middlewares
│   │   │   ├── authMiddleware.js    # JWT authentication
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   └── validateMiddleware.js # Joi validation
│   │   ├── repositories/            # Data access layer
│   │   │   ├── userRepository.js
│   │   │   ├── walletRepository.js
│   │   │   ├── transactionRepository.js
│   │   │   ├── categoryRepository.js
│   │   │   ├── budgetRepository.js
│   │   │   ├── savingsRepository.js
│   │   │   ├── goalRepository.js
│   │   │   ├── historyRepository.js
│   │   │   ├── backupCodeRepository.js
│   │   │   └── passwordResetRepository.js
│   │   ├── routes/                   # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── walletRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   ├── savingsRoutes.js
│   │   │   ├── goalRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── historyRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── services/                 # Business logic layer
│   │   │   ├── authService.js
│   │   │   ├── walletService.js
│   │   │   ├── transactionService.js
│   │   │   ├── categoryService.js
│   │   │   ├── budgetService.js
│   │   │   ├── savingsService.js
│   │   │   ├── goalService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── historyService.js
│   │   │   └── reportService.js
│   │   ├── controllers/              # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── walletController.js
│   │   │   ├── transactionController.js
│   │   │   ├── categoryController.js
│   │   │   ├── budgetController.js
│   │   │   ├── savingsController.js
│   │   │   ├── goalController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── historyController.js
│   │   │   └── reportController.js
│   │   └── utils/                    # Utility functions
│   │       ├── asyncHandler.js       # Async wrapper
│   │       ├── crypto.js             # Encryption, hashing
│   │       ├── date.js               # Date formatting
│   │       ├── jwt.js                # JWT sign/verify
│   │       ├── password.js           # Bcrypt hashing
│   │       └── validators.js         # Joi schemas
│   ├── .env.example                  # Environment variables template
│   ├── package.json                  # Backend dependencies
│   └── server.js                     # Backend entry point
│
├── frontend/                         # Frontend React App
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Card.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── export/
│   │   │       ├── ExportFilters.jsx
│   │   │       └── ExportModal.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.jsx
│   │   │   ├── useConfirm.jsx
│   │   │   └── useExport.js
│   │   ├── layouts/                 # Layout components
│   │   │   └── MainLayout.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Wallets.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Savings.jsx
│   │   │   └── MenuTools.jsx
│   │   ├── routes/                  # React Router configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js
│   │   │   └── export/
│   │   │       ├── export.service.js
│   │   │       ├── export.utils.js
│   │   │       ├── csv.export.js
│   │   │       ├── json.export.js
│   │   │       ├── excel.export.js
│   │   │       └── excel.formatters.js
│   │   ├── utils/                   # Utility functions
│   │   │   ├── format.js
│   │   │   └── theme.js
│   │   ├── App.jsx                  # Main App component
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML entry
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   └── postcss.config.js            # PostCSS configuration
│
├── .gitignore                       # Git ignore rules
└── README.md                        # Project documentation
```

---

## 🚀 Cài đặt

### Yêu cầu hệ thống

- **Node.js**: v20.11.0 hoặc cao hơn
- **npm**: v10.2.4 hoặc cao hơn
- **Git**: Để clone repository

### Clone repository

```bash
git clone https://github.com/your-username/QLyChiTieu.git
cd QLyChiTieu
```

### Cài đặt Backend

```bash
cd backend
npm install
```

### Cài đặt Frontend

```bash
cd frontend
npm install
```

---

## ⚙️ Cấu hình

### Biến môi trường (.env)

Tạo file `.env` trong thư mục `backend/` dựa trên `.env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=change-me-in-production-use-long-random-string
JWT_EXPIRES_IN=7d

# Database Configuration
DB_PATH=./src/database/db.sqlite

# 2FA Configuration
2FA_ISSUER=QLyChiTieu
```

**⚠️ Lưu ý quan trọng:**
- Thay đổi `JWT_SECRET` trong môi trường production
- `DB_PATH` sẽ tự động tạo file SQLite nếu chưa tồn tại

### Cấu hình Database

Dự án sử dụng **SQLite** với `better-sqlite3` - không cần cài đặt database server riêng.

Database sẽ tự động tạo tại đường dẫn được cấu hình trong `.env` (mặc định: `backend/src/database/db.sqlite`).

**Schema database bao gồm:**
- `users` - Người dùng
- `wallets` - Ví
- `categories` - Danh mục
- `transactions` - Giao dịch
- `budgets` - Ngân sách
- `savings_accounts` - Quỹ tiết kiệm
- `savings_transfers` - Chuyển tiết kiệm
- `saving_goals` - Mục tiêu tiết kiệm
- `saving_transactions` - Giao dịch mục tiêu
- `activity_logs` - Lịch sử hoạt động
- `monthly_rollovers` - Cuối tháng
- `password_resets` - Reset mật khẩu
- `backup_codes` - Mã backup 2FA

---

## 🏃 Hướng dẫn chạy

### Chạy Backend

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3001`

### Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

Vite sẽ tự động proxy API requests đến backend tại `http://localhost:3001`.

### Truy cập từ điện thoại

Để truy cập ứng dụng từ điện thoại trên cùng mạng WiFi:

1. Tìm IP address của máy tính:
   - Windows: Mở Command Prompt, gõ `ipconfig`, tìm IPv4 Address (ví dụ: 192.168.1.5)
   - Mac/Linux: Mở Terminal, gõ `ifconfig` hoặc `ip a`

2. Trên điện thoại, mở trình duyệt và truy cập:
   ```
   http://192.168.1.5:5173
   ```
   (Thay 192.168.1.5 bằng IP của bạn)

**Lưu ý:** Đảm bảo điện thoại và máy tính đang kết nối cùng mạng WiFi.

---

## 📖 Hướng dẫn sử dụng

### Tài khoản test mẫu

Sau khi chạy ứng dụng lần đầu, bạn có thể sử dụng tài khoản mặc định hoặc đăng ký mới:

**Tài khoản mặc định (được tạo trong code):**
- **Email**: `user@test.com`
- **Mật khẩu**: `123456`

**Hoặc đăng ký tài khoản mới:**
1. Truy cập `http://localhost:5173/login`
2. Chọn "Đăng ký" (nếu có tính năng đăng ký)
3. Nhập email, mật khẩu và thông tin cần thiết
4. Xác nhận đăng ký

### Quy trình sử dụng cơ bản

1. **Đăng nhập** - Nhập email và mật khẩu
2. **Tạo ví** - Vào mục "Ví" để tạo ví đầu tiên
3. **Thiết lập danh mục** - Vào "Menu Tools" → "Danh mục" để thêm danh mục thu/chi
4. **Tạo ngân sách** - Vào "Ngân sách" để thiết lập ngân sách theo danh mục
5. **Thêm giao dịch** - Vào "Giao dịch" để ghi nhận thu/chi
6. **Xem dashboard** - Kiểm tra tổng quan và biểu đồ
7. **Export báo cáo** - Vào "Menu Tools" → "Dữ liệu" để export báo cáo

---

## 📡 API Overview

### Base URL

```
http://localhost:3001/api
```

### Authentication

Tất cả API (trừ đăng ký/đăng nhập) yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

### Main Endpoints

#### Auth
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `POST /auth/verify-2fa` - Xác thực 2FA
- `POST /auth/enable-2fa` - Bật 2FA
- `POST /auth/disable-2fa` - Tắt 2FA
- `POST /auth/request-password-reset` - Yêu cầu reset mật khẩu
- `POST /auth/reset-password` - Reset mật khẩu

#### Wallets
- `GET /wallets` - Lấy danh sách ví
- `POST /wallets` - Tạo ví mới
- `PUT /wallets/:id` - Cập nhật ví
- `DELETE /wallets/:id` - Xóa ví

#### Transactions
- `GET /transactions` - Lấy danh sách giao dịch (có pagination, filter)
- `POST /transactions` - Tạo giao dịch mới
- `PUT /transactions/:id` - Cập nhật giao dịch
- `DELETE /transactions/:id` - Xóa giao dịch

#### Categories
- `GET /categories` - Lấy danh sách danh mục
- `POST /categories` - Tạo danh mục mới
- `PUT /categories/:id` - Cập nhật danh mục
- `DELETE /categories/:id` - Xóa danh mục

#### Budgets
- `GET /budgets` - Lấy danh sách ngân sách
- `POST /budgets` - Tạo ngân sách mới
- `GET /budgets/:id/details` - Chi tiết ngân sách
- `POST /budgets/:id/withdraw-remaining` - Rút tiền còn lại
- `DELETE /budgets/:id` - Xóa ngân sách

#### Savings
- `GET /savings/accounts` - Lấy danh sách quỹ tiết kiệm
- `POST /savings/accounts` - Tạo quỹ mới
- `GET /savings/transfers` - Lấy lịch sử chuyển tiết kiệm
- `POST /savings/transfers` - Chuyển tiền giữa ví và quỹ

#### Goals
- `GET /goals` - Lấy danh sách mục tiêu tiết kiệm
- `POST /goals` - Tạo mục tiêu mới
- `GET /goals/:id` - Chi tiết mục tiêu
- `PUT /goals/:id` - Cập nhật mục tiêu
- `DELETE /goals/:id` - Xóa mục tiêu
- `GET /goals/:id/transactions` - Lịch sử giao dịch mục tiêu
- `POST /goals/:id/transactions` - Thêm/rút tiền vào mục tiêu

#### Dashboard
- `GET /dashboard/summary` - Tổng quan thu/chi
- `GET /dashboard/chart-category` - Biểu đồ theo danh mục
- `GET /dashboard/monthly` - Biểu đồ theo tháng
- `GET /dashboard/budget-insights` - Gợi ý ngân sách

#### Reports
- `GET /reports/trends` - Phân tích xu hướng (Budget vs Actual, Seasonality, YoY)
- `GET /reports/summary` - Tổng kết chi tiết (Deep dive, Heatmap, Transaction list)
- `GET /reports/budget` - Phân tích ngân sách (Health score, History, Insights)
- `GET /reports/goals` - Phân tích mục tiêu (Progress, Completion date, Recommendations)
- `GET /reports/savings-suggestions` - Gợi ý tiết kiệm (Actionable suggestions)

#### History
- `GET /history` - Lịch sử hoạt động (có filter theo thời gian, loại hoạt động)

---

## 🏗️ Hướng dẫn Build & Deploy

### Build Frontend

```bash
cd frontend
npm run build
```

Output sẽ nằm trong thư mục `frontend/dist/`

### Build cho Production

#### Backend

```bash
cd backend
npm run start
```

#### Frontend (serving static files)

Sử dụng Nginx hoặc Apache để serve file static từ `frontend/dist/` và proxy API đến backend.

**Ví dụ cấu hình Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy với Docker (Tùy chọn)

**Dockerfile cho Backend:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Dockerfile cho Frontend:**

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 🗺️ Roadmap phát triển

### ✅ Version 1.0 (Hoàn thành)
- [x] Authentication với JWT
- [x] Quản lý ví, giao dịch, danh mục
- [x] Quản lý ngân sách với cảnh báo và health score
- [x] Quản lý tiết kiệm
- [x] Mục tiêu tiết kiệm (Goals) với progress tracking
- [x] Dashboard với biểu đồ
- [x] Lịch sử hoạt động chi tiết
- [x] Báo cáo phân tích (Trends, Summary, Budget, Goals, Savings Suggestions)
- [x] Export CSV, Excel, JSON
- [x] Theme system
- [x] 2FA với TOTP và Backup codes
- [x] Responsive design cho mobile

### 🚧 Version 1.1 (Đang phát triển)
- [ ] Dark mode hoàn chỉnh
- [ ] Multi-language support (Tiếng Việt, English)
- [ ] Recurring transactions (giao dịch định kỳ)
- [ ] Notification system (thông báo qua email/browser)
- [ ] Data visualization nâng cao

### 📋 Version 2.0 (Kế hoạch)
- [ ] Mobile app (React Native)
- [ ] Sync với ngân hàng (Open Banking API)
- [ ] AI-powered spending insights
- [ ] Budget sharing (chia sẻ ngân sách với người khác)
- [ ] Advanced analytics (machine learning predictions)
- [ ] Cloud backup (Google Drive, Dropbox)

---

## 🤝 Đóng góp dự án

Contributions, issues và feature requests đều được chào đón!

### Cách đóng góp

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push đến branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Coding Standards

- Sử dụng ESLint cho code linting
- Tuân thủ Prettier cho code formatting
- Viết comment cho các function phức tạp
- Tuân thủ conventional commits

---

## 📄 License

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

```
MIT License

Copyright (c) 2026 QLyChiTieu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact

**Tên dự án:** QLyChiTieu - Quản Lý Chi Tiêu Cá Nhân

**Author:** [Tên của bạn]

**Email:** [email của bạn]

**GitHub:** [GitHub username]

**LinkedIn:** [LinkedIn profile]

---

<div align="center">

  **Nếu bạn thích dự án này, hãy ⭐️ star repository để ủng hộ!**

  Made with ❤️ by QLyChiTieu Team

</div>
