import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CalendarClock, Gauge, Lightbulb, ListChecks, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const AiInsights = () => {
  useUserAuth();
  const { user } = useContext(UserContext);

  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const taskResponse = await axiosInstance.get(API_PATHS.TASKS.GET_ALL);
      const userTasks = Array.isArray(taskResponse?.data?.tasks) ? taskResponse.data.tasks : [];
      setTasks(userTasks);

      const insightResponse = await axiosInstance.post(API_PATHS.AI.INSIGHTS, {
        tasks: userTasks,
        profile: {
          name: user?.name,
          role: user?.role,
        },
      });

      setInsights(insightResponse.data || null);
      setGeneratedAt(new Date().toLocaleString());
    } catch (requestError) {
      console.error('Unable to load AI insights:', requestError);
      setInsights(null);
      setError(requestError?.response?.data?.message || 'Unable to generate AI insights right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [user?.name, user?.role]);

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const overdueCount = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date()).length,
    [tasks]
  );

  return (
    <DashBoardLayout activeMenu="user/insights">
      <div className="space-y-5">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <Brain className="size-6 text-blue-600" />
            AI Insights
          </h1>
          <p className="text-slate-600 dark:text-slate-300">Predictions, behavior patterns, and recommendations tailored to your tasks.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {generatedAt ? `Last generated: ${generatedAt}` : 'Insights have not been generated yet.'}
          </p>
          <button
            type="button"
            onClick={loadInsights}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing' : 'Refresh Insights'}
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Generating insights...</p>}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="size-4 text-blue-600" />
              AI Predictions & Suggestions
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Predicted completion:</span> {insights?.predictions?.predictedCompletionTime || 'Not enough data yet.'}</p>
              <p><span className="font-semibold">Risk alerts:</span></p>
              {(insights?.predictions?.riskAlerts || []).slice(0, 3).map((item) => <p key={item}>- {item}</p>)}
              <p><span className="font-semibold">Smart schedule:</span></p>
              {(insights?.predictions?.smartSchedule || []).slice(0, 3).map((item) => <p key={item}>- {item}</p>)}
              <p><span className="font-semibold">Prioritization:</span></p>
              {(insights?.predictions?.recommendedPrioritization || []).slice(0, 3).map((item) => <p key={item}>- {item}</p>)}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Lightbulb className="size-4 text-amber-600" />
              Personalized Recommendations
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {(insights?.personalizedRecommendations || []).slice(0, 6).map((item) => <p key={item}>- {item}</p>)}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <CalendarClock className="size-4 text-indigo-600" />
              Time & Behavior Patterns
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {(insights?.timeBehaviorPatterns || []).slice(0, 5).map((item) => <p key={item}>- {item}</p>)}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Gauge className="size-4 text-emerald-600" />
              Goal Tracking & Progress
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Completion rate:</span> {completionRate}%</p>
              <p><span className="font-semibold">Overdue tasks:</span> {overdueCount}</p>
              <p><span className="font-semibold">Summary:</span> {insights?.goalTracking?.summary || 'Keep completing tasks consistently.'}</p>
              <p><span className="font-semibold">Target:</span> {insights?.goalTracking?.completionRate || 'Aim for 70%+ weekly completion.'}</p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <ListChecks className="size-4 text-cyan-600" />
            Natural Language Summary
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {insights?.naturalLanguageSummary || 'AI summary will appear here after enough tasks are available.'}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <TriangleAlert className="size-4 text-rose-600" />
            Instant Risk Snapshot
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {overdueCount > 0
              ? `You have ${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}. Complete these first to reduce risk.`
              : 'No overdue tasks detected. Keep momentum on active items.'}
          </p>
        </section>
      </div>
    </DashBoardLayout>
  );
};

export default AiInsights;
