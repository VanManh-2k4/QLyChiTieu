import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, Wallet, TrendingUp, PieChart, Shield, Zap } from 'lucide-react';

export function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            ← Quay lại
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg">
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Spendify</h1>
              <p className="text-slate-600 dark:text-slate-400">Quản lý chi tiêu cá nhân thông minh</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Introduction */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Giới thiệu hệ thống</h2>
                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-900 dark:text-white">Spendify</strong> là ứng dụng quản lý chi tiêu cá nhân giúp bạn:
                  </p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Theo dõi thu nhập và chi tiêu hàng ngày</li>
                    <li>Quản lý nhiều ví và tài khoản khác nhau</li>
                    <li>Thiết lập ngân sách cho từng danh mục</li>
                    <li>Lưu trữ tiền tiết kiệm cho các mục tiêu</li>
                    <li>Xem báo cáo và thống kê chi tiết</li>
                    <li>Đồng bộ dữ liệu giữa các thiết bị</li>
                  </ul>
                  <p className="mt-4">
                    Với giao diện hiện đại, dễ sử dụng và hệ thống bảo mật mạnh mẽ, Spendify giúp bạn kiểm soát tài chính cá nhân một cách hiệu quả.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Tính năng chính</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Quản lý ví</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Tạo và quản lý nhiều ví, tài khoản</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Theo dõi giao dịch</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ghi nhận thu nhập, chi tiêu hàng ngày</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Báo cáo chi tiết</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Thống kê và phân tích chi tiêu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Tiết kiệm thông minh</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Lưu trữ và quản lý tiền tiết kiệm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Guide */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Hướng dẫn sử dụng cơ bản</h2>
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">1. Bắt đầu</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Đăng ký tài khoản mới hoặc đăng nhập</li>
                      <li>Tạo ví đầu tiên để bắt đầu theo dõi</li>
                      <li>Chọn theme và chế độ sáng/tối theo sở thích</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">2. Quản lý giao dịch</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Đến trang "Giao dịch" để thêm thu nhập/chi tiêu</li>
                      <li>Chọn ví, danh mục, số tiền và ghi chú</li>
                      <li>Xem lịch sử giao dịch trong "Lịch sử"</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">3. Thiết lập ngân sách</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Đến trang "Ngân sách" để thiết lập giới hạn chi tiêu</li>
                      <li>Chọn danh mục và số tiền tối đa</li>
                      <li>Theo dõi tiến độ chi tiêu trong tháng</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">4. Tiết kiệm tiền</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Đến trang "Tiết kiệm" để tạo tài khoản tiết kiệm</li>
                      <li>Thiết lập mục tiêu tiết kiệm</li>
                      <li>Chuyển tiền vào tài khoản tiết kiệm</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">5. Xem báo cáo</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Đến trang "Báo cáo" để xem thống kê</li>
                      <li>Lọc theo thời gian (ngày, tháng, năm)</li>
                      <li>Xem biểu đồ thu nhập/chi tiêu</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Mẹo nhanh</h2>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span>
                    <span>Đặt ngân sách cho từng danh mục để kiểm soát chi tiêu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span>
                    <span>Ghi nhận giao dịch ngay lập tức để không quên</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span>
                    <span>Xem báo cáo hàng tuần để điều chỉnh thói quen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span>
                    <span>Sử dụng tính năng tiết kiệm cho các mục tiêu dài hạn</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Security */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Bảo mật</h2>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Dữ liệu của bạn được bảo vệ bằng:
                    </p>
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <li>Mã hóa mật khẩu với bcrypt</li>
                      <li>JWT token xác thực</li>
                      <li>Tách biệt dữ liệu theo user</li>
                      <li>Rate limiting chống abuse</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Version */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="p-6">
                <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Phiên bản</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Spendify v1.0.0
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  © 2024 Spendify. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
