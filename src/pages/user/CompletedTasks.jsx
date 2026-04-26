import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { CircleCheckBig, History } from 'lucide-react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const CompletedTasks = () => {
  useUserAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getTasks = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL);
        setTasks(Array.isArray(response?.data?.tasks) ? response.data.tasks : []);
      } finally {
        setLoading(false);
      }
    };

    getTasks();
  }, []);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed').sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [tasks]
  );

  return (
    <DashBoardLayout activeMenu="user/completed">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Completed Tasks</h1>
          <p className="text-slate-600 dark:text-slate-300">Review completed work and related activity timeline.</p>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading completed tasks...</p>}

        {!loading && completedTasks.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No completed tasks yet.
          </div>
        )}

        <div className="space-y-4">
          {completedTasks.map((task) => (
            <div key={task._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                    <CircleCheckBig className="size-4 text-emerald-500" />
                    {task.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.description || 'No description'}</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Completed
                </span>
              </div>

              <div className="mt-4">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <History className="size-3.5" />
                  Activities
                </p>

                <div className="mt-2 space-y-2">
                  {(task.timeline || []).length > 0 ? (
                    task.timeline
                      .slice()
                      .sort((a, b) => new Date(b.at) - new Date(a.at))
                      .slice(0, 6)
                      .map((activity, index) => (
                        <div key={`${task._id}-${activity.type}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{activity.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{moment(activity.at).format('MMM D, YYYY h:mm A')}</p>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No activities logged.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default CompletedTasks;
