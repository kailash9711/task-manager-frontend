import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useUserAuth } from '../../hooks/useUserAuth';
import { UserContext } from '../../context/UserContext';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { CalendarClock, CheckCheck, Clock3, Flame, ListChecks, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import moment from 'moment';

const getWeekStart = (date) => moment(date).startOf('week');

const buildCompletedTimeline = (tasks = []) => {
  const grouped = {};

  tasks
    .filter((task) => task.status === 'completed')
    .forEach((task) => {
      const key = moment(task.updatedAt || task.createdAt).format('MMM DD');
      grouped[key] = (grouped[key] || 0) + 1;
    });

  const entries = Object.entries(grouped).map(([date, count]) => ({ date, count }));
  return entries.length > 0 ? entries : [{ date: moment().format('MMM DD'), count: 0 }];
};

const calculateStreak = (tasks = []) => {
  const activeDays = new Set(
    tasks
      .filter((task) => task.status === 'completed')
      .map((task) => moment(task.updatedAt || task.createdAt).format('YYYY-MM-DD'))
  );

  let streak = 0;
  let cursor = moment().startOf('day');

  while (activeDays.has(cursor.format('YYYY-MM-DD'))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return streak;
};

const UserDashBoard = () => {
  useUserAuth();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [assistantTips, setAssistantTips] = useState([]);

  const getData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, taskResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.TASKS.GET_USER_DASHBOARD),
        axiosInstance.get(API_PATHS.TASKS.GET_ALL),
      ]);

      setDashboardData(dashboardResponse.data || null);
      setTasks(taskResponse.data?.tasks || []);
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (!tasks.length) {
      setAssistantMessage('You have time to plan ahead. Pick one small task and complete it now.');
      setAssistantTips([]);
      return;
    }

    const pendingCount = tasks.filter((task) => task.status !== 'completed').length;
    const nearestDue = tasks
      .filter((task) => task.status !== 'completed' && task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    const context = `Pending tasks: ${pendingCount}. Nearest deadline: ${nearestDue?.title || 'N/A'} ${nearestDue?.dueDate || ''}`;

    const timer = setTimeout(async () => {
      try {
        const response = await axiosInstance.post(API_PATHS.AI.SUGGESTIONS, {
          text: context,
          mode: 'smart',
        });
        setAssistantMessage(response?.data?.assistantMessage || 'Complete this before deadline risk increases.');
        setAssistantTips(Array.isArray(response?.data?.suggestions) ? response.data.suggestions : []);
      } catch {
        setAssistantMessage('You have 30 minutes free. Do one high-priority pending task now.');
        setAssistantTips([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tasks]);

  const metrics = useMemo(() => {
    const today = moment();
    const weekStart = getWeekStart(today);

    const completedToday = tasks.filter(
      (task) =>
        task.status === 'completed' &&
        moment(task.updatedAt || task.createdAt).isSame(today, 'day')
    ).length;

    const completedThisWeek = tasks.filter(
      (task) =>
        task.status === 'completed' &&
        moment(task.updatedAt || task.createdAt).isSameOrAfter(weekStart)
    ).length;

    const pendingTasks = tasks.filter((task) => task.status !== 'completed').length;
    const overdueTasks = tasks.filter(
      (task) => task.status !== 'completed' && task.dueDate && moment(task.dueDate).isBefore(today, 'day')
    ).length;

    const upcomingDeadlines = tasks.filter(
      (task) =>
        task.status !== 'completed' &&
        task.dueDate &&
        moment(task.dueDate).isSameOrAfter(today, 'day') &&
        moment(task.dueDate).isSameOrBefore(moment(today).add(7, 'day'), 'day')
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedToday,
      completedThisWeek,
      pendingTasks,
      overdueTasks,
      upcomingDeadlines,
      completionRate,
      streak: calculateStreak(tasks),
      timeline: buildCompletedTimeline(tasks),
    };
  }, [tasks]);

  return (
    <DashBoardLayout activeMenu="user/dashboard">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {user?.name}</h1>
            <p className="text-slate-600 dark:text-slate-300">Track your work, insights, and momentum in one place.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <CalendarClock className="size-4" />
            {moment().format('MMMM Do YYYY')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Tasks Completed</p>
              <CheckCheck className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{metrics.completedToday} / {metrics.completedThisWeek}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">today / week</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Pending Tasks</p>
              <Clock3 className="size-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{metrics.pendingTasks}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Overdue Tasks</p>
              <ListChecks className="size-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{metrics.overdueTasks}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Upcoming Deadlines</p>
              <CalendarClock className="size-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{metrics.upcomingDeadlines}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tasks Completed Over Time</h2>
              <TrendingUp className="size-4 text-blue-600" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Completion Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 dark:text-slate-100">{metrics.completionRate}%</p>
              <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                <div className="h-full bg-linear-to-r from-blue-500 to-cyan-400" style={{ width: `${metrics.completionRate}%` }} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Productivity Streak</p>
              <div className="mt-2 flex items-center gap-2">
                <Flame className="size-5 text-orange-500" />
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.streak}</p>
                <span className="text-sm text-slate-500 dark:text-slate-400">days active</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Server Stats</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Total tasks: {dashboardData?.statistics?.totalTasks || 0}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Completed: {dashboardData?.statistics?.completedTasks || 0}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Smart Suggestions</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">AI recommends:</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">"{assistantMessage}"</p>
              {assistantTips.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {assistantTips.slice(0, 3).map((tip) => (
                    <p key={tip} className="text-xs text-slate-600 dark:text-slate-400">- {tip}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide dark:text-slate-300">
                Recent Tasks
              </p>

              <button
                onClick={() => navigate('/user/tasks')}
                className="text-slate-800 font-medium flex items-center gap-1 dark:text-slate-100 hover:text-blue-600 transition-colors"
              >
                See all <TrendingUp className="text-blue-600 size-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/user/tasks/${task._id}`)}
                  className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer dark:border-slate-800 dark:hover:border-blue-900/40 dark:hover:bg-blue-950/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{task.status} • {task.dueDate ? moment(task.dueDate).fromNow() : 'No deadline'}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-center py-4 text-slate-500 dark:text-slate-400">No tasks to show.</p>
              )}
            </div>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard data...</p>}
      </div>
    </DashBoardLayout>
  )
}

export default UserDashBoard
