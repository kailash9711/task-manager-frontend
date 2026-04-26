import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronUp,
  CircleDot,
  LogOut,
  Save,
  Settings,
  User,
} from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';
import { UserContext } from '../../context/UserContext';
import { NOTIFICATION_EVENT, getNotifications, markNotificationsRead } from '../../utils/notifications';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useNavigate } from 'react-router';


const NavBar = () => {
  const { user, updateUser, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications(user));
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    const refresh = () => setNotifications(getNotifications(user));
    refresh();
    window.addEventListener(NOTIFICATION_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const visibleNotifications = notifications.slice(0, 5);

  const toggleNotifications = () => {
    setOpenNotifications((prev) => {
      const next = !prev;
      if (!prev) {
        markNotificationsRead(user);
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearUser();
    navigate('/login', { replace: true });
  };

  const updateDisplayName = async () => {
    if (!displayName.trim()) {
      setSettingsError('Name cannot be empty.');
      return;
    }

    if (displayName.trim() === user?.name) {
      setOpenSettings(false);
      return;
    }

    try {
      setSavingName(true);
      setSettingsError('');
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        name: displayName.trim(),
        email: user?.email,
      });
      updateUser(response.data);
      setOpenSettings(false);
    } catch (error) {
      setSettingsError(error?.response?.data?.message || 'Unable to update name.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-xl">TaskFlow</h1>

          </div>

          <div className="relative flex items-center gap-3">
            <ThemeSwitch />
            <button
              type="button"
              onClick={() => {
                setOpenSettings(false);
                toggleNotifications();
              }}
              className="relative rounded-lg p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenNotifications(false);
                setOpenSettings((prev) => !prev);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-500 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <User className="w-5 h-5" />
            </button>

            {openNotifications && (
              <div className="absolute right-0 top-12 z-30 w-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recent task updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenNotifications(false)}
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {visibleNotifications.length > 0 ? visibleNotifications.map((notification) => (
                    <div key={notification.id} className={`flex gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800 ${notification.read ? 'opacity-70' : ''}`}>
                      <div className={`mt-0.5 rounded-full p-1.5 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : notification.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300'}`}>
                        {notification.read ? <CheckCheck className="size-3.5" /> : <CircleDot className="size-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {openSettings && (
              <div className="absolute right-0 top-12 z-30 w-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Settings className="size-4" />
                    Account settings
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Update your display name and manage session.</p>
                </div>

                <div className="space-y-3 px-4 py-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Email</label>
                    <p className="truncate rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{user?.email || '-'}</p>
                  </div>

                  <div>
                    <label htmlFor="display-name" className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Name</label>
                    <input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950/40"
                      placeholder="Enter your display name"
                    />
                  </div>

                  {settingsError && <p className="text-xs text-rose-500">{settingsError}</p>}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={updateDisplayName}
                      disabled={savingName}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      <Save className="size-3.5" />
                      {savingName ? 'Saving...' : 'Save name'}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
                    >
                      <LogOut className="size-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </header>
  );
};

export default NavBar;
