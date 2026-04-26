import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import { Download, Filter, Link as LinkIcon, RefreshCcw, Search, TriangleAlert } from 'lucide-react';
import { useUserAuth } from '../../hooks/useUserAuth';

const FILTER_TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'high', label: 'High Priority' },
]

const getPriorityClass = (priority) => {
  if (priority === 'high') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  if (priority === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
}

const getStatusClass = (status) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  if (status === 'in-progress') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
}

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}

const downloadTasksCsv = (tasks) => {
  if (!tasks.length) return;

  const headers = [
    'Title',
    'Description',
    'Priority',
    'Status',
    'Due Date',
    'Task Done',
    'Progress',
    'Assigned Users',
    'Attachments',
  ];

  const toCell = (value) => {
    const safeValue = String(value ?? '').replace(/"/g, '""');
    return `"${safeValue}"`;
  };

  const rows = tasks.map((task) => {
    const completedTodoCount = task.completedTodoCount || 0;
    const totalTodo = Array.isArray(task.todoCheckList) ? task.todoCheckList.length : 0;
    const attachments = Array.isArray(task.attachments) ? task.attachments.join(' | ') : '';
    const assignedUsers = Array.isArray(task.assignedTo)
      ? task.assignedTo.map((user) => user?.name || user?.email || '').filter(Boolean).join(' | ')
      : '';

    return [
      task.title,
      task.description,
      task.priority,
      task.status,
      formatDate(task.dueDate),
      `${completedTodoCount}/${totalTodo}`,
      `${task.progress || 0}%`,
      assignedUsers,
      attachments,
    ].map(toCell).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `all-task-details-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const Manage = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const getTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_MANAGE_TASKS);
      setTasks(Array.isArray(response?.data?.tasks) ? response.data.tasks : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const now = new Date();

    return tasks
      .filter((task) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'pending') return task.status === 'pending';
        if (activeFilter === 'in-progress') return task.status === 'in-progress';
        if (activeFilter === 'completed') return task.status === 'completed';
        if (activeFilter === 'overdue') {
          return task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed';
        }
        if (activeFilter === 'high') return task.priority === 'high';
        return true;
      })
      .filter((task) => {
        const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [tasks, activeFilter, search]);

  const onTaskClick = (taskId) => {
    navigate('/create-task', { state: { taskId } });
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      setUpdatingTaskId(taskId);
      setActionMessage('');

      const path = API_PATHS.TASKS.UPDATE_STATUS.replace(':id', taskId);
      const response = await axiosInstance.put(path, { status });
      const updatedTask = response?.data?.task || response?.data;

      setTasks((prev) => prev.map((task) => (task._id === taskId ? { ...task, status: updatedTask?.status || status } : task)));
      setActionMessage(
        updatedTask?.status === 'completed'
          ? 'Task marked completed.'
          : 'Completed task reopened and moved back to active work.'
      );
    } catch (err) {
      setActionMessage(err?.response?.data?.message || 'Unable to update task status.');
    } finally {
      setUpdatingTaskId('');
    }
  };

  return (
    <DashBoardLayout activeMenu="manage-task">
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 px-4 py-6 md:p-8 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Manage Tasks</h1>
              <p className="text-slate-600 dark:text-slate-300">Track progress, filter tasks, and manage work delivery.</p>
            </div>

            <button
              type="button"
              onClick={() => downloadTasksCsv(tasks)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
            >
              <Download className="size-4" />
              Download All Task Details
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or description"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">
                  <Filter className="size-3.5" />
                  Filters
                </span>
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      activeFilter === tab.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {actionMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{actionMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">Loading tasks...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">No tasks found for selected filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTasks.map((task) => {
                const completedTodoCount = task.completedTodoCount || 0;
                const totalTodo = Array.isArray(task.todoCheckList) ? task.todoCheckList.length : 0;
                const canReopen = task.status === 'completed';

                return (
                  <div
                    key={task._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onTaskClick(task._id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onTaskClick(task._id);
                      }
                    }}
                    className="text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityClass(task.priority)}`}>
                        {task.priority || 'low'} priority
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusClass(task.status)}`}>
                        {task.status || 'pending'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1 dark:text-slate-100">{task.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 min-h-10 dark:text-slate-300">{task.description || 'No description'}</p>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Task Done</p>
                      <p className="text-sm text-slate-700 mt-1 dark:text-slate-200">{completedTodoCount}/{totalTodo}</p>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Progress</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{task.progress || 0}%</p>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                        <div
                          className="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 dark:text-slate-400">Attachments</p>
                      {Array.isArray(task.attachments) && task.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.attachments.slice(0, 3).map((url, index) => (
                            <a
                              key={`${task._id}-attachment-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-xs text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                            >
                              <LinkIcon className="size-3" />
                              File {index + 1}
                            </a>
                          ))}
                          {task.attachments.length > 3 ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">+{task.attachments.length - 3} more</span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No attachments</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Open card to edit details.</p>
                      {canReopen && (
                        <button
                          type="button"
                          disabled={updatingTaskId === task._id}
                          onClick={(event) => {
                            event.stopPropagation();
                            updateTaskStatus(task._id, 'in-progress');
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          <RefreshCcw className="size-3.5" />
                          {updatingTaskId === task._id ? 'Reopening...' : 'Reopen Task'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashBoardLayout>
  )
}

export default Manage
