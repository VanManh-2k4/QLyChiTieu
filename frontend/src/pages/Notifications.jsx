import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, TrendingUp, Target, AlertTriangle, PartyPopper, X } from 'lucide-react';
import { notificationService } from '../services/notification.service.js';
import { formatRelativeTime, formatVND } from '../utils/format.js';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, budget, savings
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Auto-update time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative time display
      setNotifications(prev => [...prev]);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let params = { limit: 50, offset: 0 };
      
      if (filter === 'unread') {
        params.isRead = 0;
      } else if (filter === 'budget') {
        params.type = 'budget_warning,budget_exceeded';
      } else if (filter === 'savings') {
        params.type = 'savings_progress,savings_completed';
      }
      
      const data = await notificationService.getNotificationsFiltered(params);
      setNotifications(data.rows || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: 1 } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return '🚨';
      case 'budget_warning':
        return '⚠️';
      case 'savings_progress':
        return '📈';
      case 'savings_completed':
        return '🎉';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return 'bg-red-50 border-red-200';
      case 'budget_warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'savings_progress':
        return 'bg-blue-50 border-blue-200';
      case 'savings_completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const parseNotificationDetails = (notification) => {
    const details = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      percentage: null,
      amount: null,
      categoryName: null,
      goalName: null,
    };

    const percentageMatch = notification.message.match(/(\d+)%/);
    if (percentageMatch) {
      details.percentage = parseInt(percentageMatch[1]);
    }

    const amountMatch = notification.message.match(/([\d.,]+)\s*(?:VNĐ|VND|₫)/i);
    if (amountMatch) {
      details.amount = amountMatch[1].replace(/[.,]/g, '');
    }

    const categoryMatch = notification.message.match(/ngân sách\s+(.+?)\s+(?:đã|đã sử dụng)/i);
    if (categoryMatch) {
      details.categoryName = categoryMatch[1];
    }

    const goalMatch = notification.message.match(/mục tiêu\s+(.+?)(?:\.|$)/i);
    if (goalMatch) {
      details.goalName = goalMatch[1];
    }

    return details;
  };

  const getDetailIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'budget_warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'savings_progress':
        return <TrendingUp className="h-6 w-6 text-blue-500" />;
      case 'savings_completed':
        return <PartyPopper className="h-6 w-6 text-green-500" />;
      default:
        return <Bell className="h-6 w-6 text-slate-500" />;
    }
  };

  const getDetailColor = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return 'from-red-500 to-red-600';
      case 'budget_warning':
        return 'from-yellow-500 to-yellow-600';
      case 'savings_progress':
        return 'from-blue-500 to-blue-600';
      case 'savings_completed':
        return 'from-green-500 to-green-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Thông báo</h1>
          <p className="mt-2 text-slate-600">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Lọc:</span>
          </div>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Chưa đọc
          </button>
          <button
            onClick={() => setFilter('budget')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'budget'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Ngân sách
          </button>
          <button
            onClick={() => setFilter('savings')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'savings'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tiết kiệm
          </button>
        </div>

        {/* Action Bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <CheckCheck className="h-4 w-4" />
                Đã đọc tất cả
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Xóa tất cả
              </button>
            )}
          </div>
          <span className="text-sm text-slate-600">
            {notifications.length} thông báo
          </span>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
            <Bell className="mb-4 h-16 w-16 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Không có thông báo</p>
            <p className="mt-2 text-sm text-slate-500">
              {filter === 'unread' ? 'Bạn đã đọc tất cả thông báo' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer rounded-2xl border transition hover:shadow-md ${
                  !notification.isRead
                    ? 'bg-indigo-50/50 border-indigo-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className={`flex gap-4 p-4 ${getNotificationColor(notification.type)}`}>
                  <div className="flex-shrink-0 text-3xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500"></span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200"
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedNotification(null)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className={`flex items-center gap-4 rounded-t-2xl bg-gradient-to-r ${getDetailColor(selectedNotification.type)} px-6 py-4`}>
              {getDetailIcon(selectedNotification.type)}
              <div>
                <h3 className="text-lg font-bold text-white">{selectedNotification.title}</h3>
                <p className="text-sm text-white/80">{formatRelativeTime(selectedNotification.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="ml-auto rounded-lg p-1.5 text-white/80 transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              {(() => {
                const details = parseNotificationDetails(selectedNotification);
                return (
                  <>
                    <p className="text-slate-700 mb-4">{details.message}</p>

                    {details.percentage !== null && (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {details.type.includes('budget') ? 'Tiến độ ngân sách' : 'Tiến độ mục tiêu'}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {details.percentage}%
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getDetailColor(details.type)} transition-all duration-500`}
                            style={{ width: `${Math.min(details.percentage, 100)}%` }}
                          ></div>
                        </div>
                        {details.type === 'budget_exceeded' && details.percentage > 100 && (
                          <p className="mt-2 text-sm font-semibold text-red-600">
                            Đã vượt {Math.round(details.percentage - 100)}% so với ngân sách
                          </p>
                        )}
                        {details.type === 'budget_warning' && (
                          <p className="mt-2 text-sm text-slate-600">
                            Đã chạm mốc cảnh báo
                          </p>
                        )}
                        {details.type === 'savings_progress' && (
                          <p className="mt-2 text-sm text-blue-600">
                            Đã chạm mốc {details.percentage}%
                          </p>
                        )}
                      </div>
                    )}

                    {details.amount && (
                      <div className="mb-4 rounded-lg bg-red-50 p-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-semibold">Vượt ngân sách</span>
                        </div>
                        <p className="mt-1 text-sm text-red-700">
                          Bạn đã vượt quá {formatVND(details.amount)}
                        </p>
                      </div>
                    )}

                    {details.categoryName && (
                      <div className="mb-4">
                        <span className="text-sm text-slate-600">Danh mục: </span>
                        <span className="font-medium text-slate-900">{details.categoryName}</span>
                      </div>
                    )}

                    {details.goalName && (
                      <div className="mb-4">
                        <span className="text-sm text-slate-600">Mục tiêu: </span>
                        <span className="font-medium text-slate-900">{details.goalName}</span>
                      </div>
                    )}

                    {details.type === 'savings_progress' && details.percentage && details.percentage < 100 && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Target className="h-5 w-5" />
                          <span className="font-semibold">Mục tiêu tiết kiệm</span>
                        </div>
                        <p className="mt-1 text-sm text-blue-700">
                          Đã chạm mốc {details.percentage}% - Còn {100 - details.percentage}% để hoàn thành mục tiêu
                        </p>
                      </div>
                    )}

                    {details.type === 'savings_completed' && (
                      <div className="rounded-lg bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <PartyPopper className="h-5 w-5" />
                          <span className="font-semibold">Chúc mừng!</span>
                        </div>
                        <p className="mt-1 text-sm text-green-700">
                          Bạn đã hoàn thành mục tiêu tiết kiệm của mình
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
