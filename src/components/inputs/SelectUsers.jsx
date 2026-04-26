import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Search, X, Users } from 'lucide-react';


const SelectUsers = ({ open, onClose, selectedUsers, setSelectedUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');


  const getAllUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`${API_PATHS.USERS.GET_ALL}?assignable=true`);
      const users = Array.isArray(response.data) ? response.data : [];
      setAllUsers(users);
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTempSelectedUsers(Array.isArray(selectedUsers) ? selectedUsers : []);
      setSearchTerm('');
      getAllUsers();
    }
  }, [open, selectedUsers]);

  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId);
      }
      return [...prevSelected, userId];
    });
  };

  const handleDone = () => {
    setSelectedUsers(tempSelectedUsers);
    onClose();
  };

  if (!open) return null;

  const filteredUsers = allUsers.filter((user) => {
    const name = user?.name || '';
    const email = user?.email || '';
    return `${name} ${email}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Select Users
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose assignees for this task</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-6 pb-4 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4" />
              <span>{tempSelectedUsers.length} selected</span>
            </div>
            <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">{allUsers.length} users</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950/40"
            />
          </div>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto px-4 pb-3">
          {loading && <p className="rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Loading users...</p>}
          {!loading && error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
          {!loading && !error && allUsers.length === 0 && (
            <p className="rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No users available for assignment.</p>
          )}
          {!loading && !error && allUsers.length > 0 && filteredUsers.length === 0 && (
            <p className="rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No users match your search.</p>
          )}
          {!loading && !error && filteredUsers.map((user) => {
            const userId = user._id;
            const isSelected = tempSelectedUsers.includes(userId);
            return (
              <button
                type="button"
                key={userId}
                onClick={() => toggleUserSelection(userId)}
                className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-200 bg-blue-50 shadow-sm dark:border-blue-700/60 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                      : 'border-slate-300 text-transparent group-hover:border-slate-400 dark:border-slate-600 dark:group-hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectUsers;
