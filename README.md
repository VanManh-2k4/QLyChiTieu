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
  <a href="#-api-overview">API</a>
</p>

<div align="center">

  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)

</div>

---

## 📸 Demo / Giao diện

<div align="center">
  <img src="https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=Dashboard+View" alt="Dashboard View" width="800">
  <p><em>Giao diện Dashboard với biểu đồ thu/chi theo danh mục và tháng</em></p>
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
- Hệ thống authentication bảo mật với JWT

---

## ✨ Tính năng chính

### 🔐 Authentication & Security
- Đăng ký/Đăng nhập với JWT
- Mã hóa mật khẩu với bcrypt
- Protected routes với middleware
- Profile page để cập nhật thông tin cá nhân
- Đổi mật khẩu với validation
- Field-specific error handling cho login/register
- Rate limiting cho API endpoints
- CORS configuration an toàn

### 👤 Quản lý Hồ Sơ
- Cập nhật tên hiển thị
- Cập nhật email
- Cập nhật avatar URL
- Đổi mật khẩu với validation
- Glassmorphism UI design
- Hỗ trợ dark mode

### ℹ️ Giới Thiệu Hệ Thống
- Giới thiệu sơ bộ về hệ thống
- Tính năng chính
- Hướng dẫn sử dụng cơ bản (5 bước)
- Mẹo nhanh
- Thông tin bảo mật
- Phiên bản ứng dụng

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
- **Tab Gợi ý tiết kiệm**: 
  - Cá nhân hóa ngưỡng dựa trên thu nhập trung bình
  - Phân tích xu hướng chi tiêu (tăng/giảm)
  - Cải thiện phát hiện subscription với phân tích chu kỳ
  - Phát hiện giao dịch bất thường (outlier detection)
  - Tối ưu hóa ngân sách dựa trên lịch sử 6 tháng
  - Actionable suggestions với priority sorting

### 🔔 Hệ Thống Thông Báo
- Thông báo tự động khi vượt ngân sách (budget_exceeded)
- Thông báo cảnh báo ngân sách (budget_warning)
- Thông báo tiến độ tiết kiệm (savings_progress)
- Thông báo hoàn thành mục tiêu (savings_completed)
- Chuông thông báo với dropdown preview
- Polling tự động cập nhật số lượng chưa đọc
- Filter thông báo theo loại (tất cả, chưa đọc, ngân sách, tiết kiệm)
- Đánh dấu đã đọc (từng cái hoặc tất cả)
- Xóa thông báo (từng cái hoặc tất cả)
- Modal chi tiết thông báo với progress bar

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

---

## 🛠️ Công nghệ sử dụng

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20.11.0-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-jsonwebtoken-000000?style=flat-square&logo=jsonwebtoken&logoColor=white)
![Bcrypt](https://img.shields.io/badge/Bcrypt-bcryptjs-000000?style=flat-square&logo=bcrypt&logoColor=white)
![Joi](https://img.shields.io/badge/Joi-Validation-4A90E2?style=flat-square&logo=joi&logoColor=white)
![Rate Limit](https://img.shields.io/badge/Rate_Limit-express--rate--limit-000000?style=flat-square&logo=express&logoColor=white)

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
│   │   │   ├── passwordResetRepository.js
│   │   │   └── notificationRepository.js
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
│   │   │   ├── reportRoutes.js
│   │   │   └── notificationRoutes.js
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
│   │   │   ├── reportService.js
│   │   │   └── notificationService.js
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
│   │   │   ├── reportController.js
│   │   │   └── notificationController.js
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
│   │   │   ├── AccountMenu.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── NotificationBell.jsx
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
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Wallets.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Savings.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── About.jsx
│   │   │   ├── MenuTools.jsx
│   │   │   └── Notifications.jsx
│   │   ├── routes/                  # React Router configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js
│   │   │   ├── notification.service.js
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
git clone https://github.com/VanManh-2k4/QLyChiTieu.git
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
JWT_EXPIRES_IN=1d

# 2FA Configuration
TWO_FACTOR_ENCRYPTION_KEY=change-me-in-production-use-long-random-string

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Database Configuration
DB_PATH=./src/database/db.sqlite
```

**⚠️ Lưu ý quan trọng:**
- Thay đổi `JWT_SECRET` và `TWO_FACTOR_ENCRYPTION_KEY` trong môi trường production
- `DB_PATH` sẽ tự động tạo file SQLite nếu chưa tồn tại

### Cấu hình Database

Dự án sử dụng **SQLite** với `better-sqlite3` - không cần cài đặt database server riêng.

Database sẽ tự động tạo tại đường dẫn được cấu hình trong `.env` (mặc định: `backend/src/database/db.sqlite`).

**Schema database bao gồm:**
- `users` - Người dùng (id, name, email, password, role, avatar, 2FA settings)
- `wallets` - Ví (id, userId, name, balance, isDeleted)
- `categories` - Danh mục (id, userId, name, type: income/expense)
- `transactions` - Giao dịch (id, userId, walletId, categoryId, type, amount, note, date)
- `budgets` - Ngân sách (id, userId, categoryId, walletId, amount, month, year)
- `savings_accounts` - Quỹ tiết kiệm (id, userId, name, balance, isDeleted)
- `savings_transfers` - Chuyển tiết kiệm (id, userId, walletId, savingsId, direction, amount, note, date)
- `saving_goals` - Mục tiêu tiết kiệm (id, userId, walletId, name, targetAmount, currentAmount, targetDate, status)
- `saving_transactions` - Giao dịch mục tiêu (id, goalId, userId, walletId, amount, type, note, date)
- `activity_logs` - Lịch sử hoạt động (id, userId, actionType, entityType, entityId, title, details, amount, occurredAt)
- `monthly_rollovers` - Cuối tháng (id, userId, year, month, rolledAt)
- `password_resets` - Reset mật khẩu (id, userId, tokenHash, expiresAt, usedAt)
- `user_backup_codes` - Mã backup 2FA (id, userId, codeHash, createdAt, usedAt)
- `notifications` - Thông báo (id, userId, type, title, message, isRead, createdAt)

**Indexes:**
- `idx_users_email_nocase`: UNIQUE INDEX trên email (case-insensitive)
- `idx_wallets_user`: INDEX trên userId
- `idx_transactions_user_date`: INDEX trên (userId, date)
- `idx_transactions_user_type`: INDEX trên (userId, type)
- `idx_savings_user`: INDEX trên userId
- `idx_savings_transfers_user_date`: INDEX trên (userId, date)
- `idx_saving_goals_user`: INDEX trên userId
- `idx_saving_goals_status`: INDEX trên status
- `idx_saving_transactions_goal`: INDEX trên goalId
- `idx_saving_transactions_user_date`: INDEX trên (userId, date)
- `idx_activity_logs_user_date`: INDEX trên (userId, occurredAt)
- `idx_monthly_rollovers_user`: INDEX trên userId
- `idx_password_resets_user`: INDEX trên userId
- `idx_password_resets_token`: INDEX trên tokenHash
- `idx_backup_codes_user`: INDEX trên userId
- `idx_notifications_user`: INDEX trên userId
- `idx_notifications_read`: INDEX trên isRead
- `idx_notifications_created`: INDEX trên createdAt

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

---

## 📖 Hướng dẫn sử dụng

### Đăng ký tài khoản

1. Truy cập `http://localhost:5173/register`
2. Nhập họ tên, email, mật khẩu, xác nhận mật khẩu
3. Click "Đăng ký"
4. Tài khoản sẽ được tạo và tự động đăng nhập

### Đăng nhập

1. Truy cập `http://localhost:5173/login`
2. Nhập email và mật khẩu
3. Click "Đăng nhập"
4. Sẽ được chuyển đến Dashboard

### Cập nhật hồ sơ

1. Click vào avatar ở góc phải
2. Chọn "Hồ sơ cá nhân"
3. Cập nhật tên, email, avatar
4. Click "Lưu thay đổi"

### Đổi mật khẩu

1. Vào trang "Hồ sơ cá nhân"
2. Chuyển sang tab "Đổi mật khẩu"
3. Nhập mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu
4. Click "Lưu thay đổi"

### Xem giới thiệu hệ thống

1. Click vào avatar ở góc phải
2. Chọn "Giới thiệu"
3. Xem thông tin về hệ thống và hướng dẫn sử dụng

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
- `GET /auth/me` - Lấy thông tin user hiện tại
- `PUT /auth/profile` - Cập nhật hồ sơ
- `PUT /auth/change-password` - Đổi mật khẩu
- `POST /auth/logout` - Đăng xuất

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
- `GET /reports/weekly` - Báo cáo tuần
- `GET /reports/monthly` - Báo cáo tháng
- `GET /reports/quarterly` - Báo cáo quý
- `GET /reports/yearly` - Báo cáo năm
- `POST /reports/compare` - So sánh các kỳ
- `POST /reports/trends` - Phân tích xu hướng (Budget vs Actual, Seasonality, YoY)
- `POST /reports/savings` - Gợi ý tiết kiệm (Actionable suggestions với cá nhân hóa)
- `GET /reports/budget-compare` - So sánh với ngân sách
- `GET /reports/monthly-summary` - Tổng kết tháng
- `GET /reports/spending-patterns` - Phân tích mẫu chi tiêu
- `GET /reports/goals` - Theo dõi mục tiêu
- `GET /reports/anomalies` - Phát hiện bất thường
- `GET /reports/goal-analysis` - Phân tích mục tiêu

#### Notifications
- `GET /notifications` - Lấy danh sách thông báo (có filter type, isRead, pagination)
- `GET /notifications/unread-count` - Lấy số lượng thông báo chưa đọc
- `PUT /notifications/:id/read` - Đánh dấu thông báo đã đọc
- `PUT /notifications/mark-all-read` - Đánh dấu tất cả đã đọc
- `DELETE /notifications/:id` - Xóa thông báo
- `DELETE /notifications` - Xóa tất cả thông báo

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

---

## 🗺️ Roadmap phát triển

### ✅ Version 1.0 (Hoàn thành)
- [x] Authentication với JWT
- [x] Profile page với cập nhật thông tin
- [x] Đổi mật khẩu với validation
- [x] About page với hướng dẫn sử dụng
- [x] Field-specific error handling cho login/register
- [x] Quản lý ví, giao dịch, danh mục
- [x] Quản lý ngân sách với cảnh báo và health score
- [x] Quản lý tiết kiệm
- [x] Mục tiêu tiết kiệm (Goals) với progress tracking
- [x] Dashboard với biểu đồ
- [x] Lịch sử hoạt động chi tiết
- [x] Báo cáo phân tích (Trends, Summary, Budget, Goals, Savings Suggestions)
- [x] Export CSV, Excel, JSON
- [x] Theme system
- [x] Responsive design cho mobile
- [x] Rate limiting và CORS security
- [x] Hệ thống thông báo (Notifications)
- [x] Cải thiện thuật toán gợi ý tiết kiệm (cá nhân hóa, xu hướng, subscription detection, outlier detection)

### 🚧 Version 1.1 (Đang phát triển)
- [ ] Multi-language support (Tiếng Việt, English)
- [ ] Recurring transactions (giao dịch định kỳ)
- [ ] Data visualization nâng cao

### 📋 Version 2.0 (Kế hoạch)
- [ ] Mobile app (React Native)
- [ ] Sync với ngân hàng (Open Banking API)
- [ ] AI-powered spending insights
- [ ] Budget sharing (chia sẻ ngân sách với người khác)
- [ ] Advanced analytics (machine learning predictions)
- [ ] Cloud backup (Google Drive, Dropbox)

---

## 📄 License

Dự án này được cấp phép theo MIT License.

---

## 📞 Contact

**Tên dự án:** QLyChiTieu - Quản Lý Chi Tiêu Cá Nhân

**GitHub:** https://github.com/VanManh-2k4/QLyChiTieu

---

<div align="center">

  **Nếu bạn thích dự án này, hãy ⭐️ star repository để ủng hộ!**

  Made with ❤️ by VanManh-2k4

</div>

