import React, { useEffect, useMemo, useState } from 'react'
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import { CheckCircle2, CircleCheckBig, Clock3, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { addNotification } from '../../utils/notifications';

const MyTask = () => {
  useUserAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const getTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL);
      setTasks(response.data?.tasks || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTasks();
  }, []);

  const updateTaskStatus = async (taskId, status) => {
    try {
      setUpdatingTaskId(taskId);
      setAlert({ type: '', message: '' });
      const path = API_PATHS.TASKS.UPDATE_STATUS.replace(':id', taskId);
      const response = await axiosInstance.put(path, { status });
      const updatedTask = response?.data?.task || response?.data || tasks.find((task) => task._id === taskId);
      const taskTitle = updatedTask?.title || tasks.find((task) => task._id === taskId)?.title || 'task';
      setTasks((prev) => prev.map((task) => (task._id === taskId ? { ...task, status } : task)));
      setAlert({ type: 'success', message: `Submitted "${taskTitle}" as completed.` });

      addNotification({
        title: 'Task update submitted',
        message: `A user submitted "${taskTitle}" with status ${status}.`,
        type: 'warning',
        recipientRole: 'admin',
        taskId,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      setAlert({ type: 'error', message: error?.response?.data?.message || 'Unable to submit task completion.' });
    } finally {
      setUpdatingTaskId('');
    }
  };

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt)),
    [tasks]
  );

  const getPriorityClass = (priority) => {
    if (priority === 'high') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  };

  const isCompleted = (status) => status === 'completed';

  return (
    <DashBoardLayout activeMenu="user/tasks">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">My Tasks</h1>
          <p className="text-slate-600 dark:text-slate-300">Submit your completed tasks with clear status feedback and due-time focus.</p>
        </div>

        {alert.message && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              alert.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
            }`}
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{alert.message}</p>
          </div>
        )}

        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const completed = isCompleted(task.status);
            return (
              <div
                key={task._id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-slate-300"
                      checked={completed}
                      onChange={() => {}}
                      disabled
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/user/tasks/${task._id}`)}
                        className={`text-left text-base font-semibold ${completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
                      >
                        {task.title}
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex px-2.5 py-1 rounded-full font-semibold ${getPriorityClass(task.priority)}`}>
                          {task.priority || 'low'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Clock3 className="size-3.5" />
                          {task.dueDate ? moment(task.dueDate).format('ddd, MMM D • h:mm A') : 'No due time'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={updatingTaskId === task._id || completed}
                    onClick={() => updateTaskStatus(task._id, 'completed')}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      completed
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {completed ? <CircleCheckBig className="size-4" /> : <CheckCircle2 className="size-4" />}
                    {completed ? 'Completed (Admin can reopen)' : 'Submit Completion'}
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && sortedTasks.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
              No assigned tasks yet.
            </div>
          )}
          {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>}
        </div>
      </div>
    </DashBoardLayout>
  )
}

export default MyTask
