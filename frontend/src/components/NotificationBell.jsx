import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, TrendingUp, Target, AlertTriangle, PartyPopper, ArrowRight } from 'lucide-react';
import { notificationService } from '../services/notification.service.js';
import { formatRelativeTime, formatVND } from '../utils/format.js';

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 10 seconds for more responsive updates
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);
    
    // Auto-update time display every minute
    const timeUpdateInterval = setInterval(() => {
      // Force re-render to update relative time display
      setNotifications(prev => [...prev]);
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeUpdateInterval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 5, offset: 0 });
      setNotifications(data.rows || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: 1 } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      const deleted = notifications.find(n => n.id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setIsOpen(false);
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

    // Parse percentage from message
    const percentageMatch = notification.message.match(/(\d+)%/);
    if (percentageMatch) {
      details.percentage = parseInt(percentageMatch[1]);
    }

    // Parse amount from message (for budget exceeded)
    const amountMatch = notification.message.match(/([\d,.]+)\s*VNĐ/);
    if (amountMatch) {
      details.amount = amountMatch[1].replace(/,/g, '');
    }

    // Extract category name
    const categoryMatch = notification.message.match(/ngân sách\s+(.+?)\s+(?:đã|đã sử dụng)/i);
    if (categoryMatch) {
      details.categoryName = categoryMatch[1];
    }

    // Extract goal name
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Thông báo
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <CheckCheck className="h-3 w-3" />
                  Đã đọc tất cả
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Xóa tất cả
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Bell className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm">Không có thông báo</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                        !notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      <div className={`flex gap-3 rounded-lg border p-3 ${getNotificationColor(notification.type)}`}>
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500"></span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-600"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                  <button
                    onClick={() => {
                      navigate('/notifications');
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                  >
                    Xem tất cả
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedNotification(null)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
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
                    <p className="text-slate-700 dark:text-slate-300 mb-4">{details.message}</p>

                    {details.percentage !== null && (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {details.type.includes('budget') ? 'Tiến độ ngân sách' : 'Tiến độ mục tiêu'}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {details.percentage}%
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getDetailColor(details.type)} transition-all duration-500`}
                            style={{ width: `${Math.min(details.percentage, 100)}%` }}
                          ></div>
                        </div>
                        {details.type === 'budget_exceeded' && details.percentage > 100 && (
                          <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                            Đã vượt {Math.round(details.percentage - 100)}% so với ngân sách
                          </p>
                        )}
                        {details.type === 'budget_warning' && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Đã chạm mốc cảnh báo
                          </p>
                        )}
                        {details.type === 'savings_progress' && (
                          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                            Đã chạm mốc {details.percentage}%
                          </p>
                        )}
                      </div>
                    )}

                    {details.amount && (
                      <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-semibold">Vượt ngân sách</span>
                        </div>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          Bạn đã vượt quá {formatVND(details.amount)}
                        </p>
                      </div>
                    )}

                    {details.categoryName && (
                      <div className="mb-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Danh mục: </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{details.categoryName}</span>
                      </div>
                    )}

                    {details.goalName && (
                      <div className="mb-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Mục tiêu: </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{details.goalName}</span>
                      </div>
                    )}

                    {details.type === 'savings_progress' && details.percentage && details.percentage < 100 && (
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Target className="h-5 w-5" />
                          <span className="font-semibold">Mục tiêu tiết kiệm</span>
                        </div>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          Đã chạm mốc {details.percentage}% - Còn {100 - details.percentage}% để hoàn thành mục tiêu
                        </p>
                      </div>
                    )}

                    {details.type === 'savings_completed' && (
                      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <PartyPopper className="h-5 w-5" />
                          <span className="font-semibold">Chúc mừng!</span>
                        </div>
                        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                          Bạn đã hoàn thành mục tiêu tiết kiệm của mình
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
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
