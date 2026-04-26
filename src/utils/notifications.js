const STORAGE_KEY = 'taskflow_notifications';
const UPDATE_EVENT = 'taskflow-notifications-updated';

const readNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotifications = (notifications) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

const getNotificationTarget = (notification, user) => {
  if (!notification || !user) return false;

  const recipientIds = Array.isArray(notification.recipientIds) ? notification.recipientIds : [];
  const recipientRole = notification.recipientRole || 'all';

  if (recipientRole === 'all') return true;
  if (recipientRole === 'admin' && user.role === 'admin') return true;
  if (recipientRole === 'user' && user.role === 'user') return true;

  return recipientIds.includes(user._id);
};

export const getNotifications = (user) => {
  const notifications = readNotifications();
  if (!user) return notifications;
  return notifications.filter((notification) => getNotificationTarget(notification, user));
};

export const addNotification = (notification) => {
  const nextNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: notification.title || 'Notification',
    message: notification.message || '',
    type: notification.type || 'info',
    recipientRole: notification.recipientRole || 'all',
    recipientIds: Array.isArray(notification.recipientIds) ? notification.recipientIds : [],
    taskId: notification.taskId || '',
    createdAt: new Date().toISOString(),
    read: false,
  };

  const current = readNotifications();
  const next = [nextNotification, ...current].slice(0, 50);
  writeNotifications(next);
  return nextNotification;
};

export const markNotificationsRead = (user) => {
  const notifications = readNotifications();
  const next = notifications.map((notification) => {
    if (getNotificationTarget(notification, user)) {
      return { ...notification, read: true };
    }

    return notification;
  });

  writeNotifications(next);
};

export const clearNotifications = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const NOTIFICATION_EVENT = UPDATE_EVENT;