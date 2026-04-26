import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, GitBranch, Goal, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const defaultRoadmap = {
  goalBreakdown: [],
  stepByStepTaskFlow: [],
  timelineDeadlines: [],
  taskDependencies: [],
  smartPrioritization: [],
  adaptiveUpdates: [],
  summary: '',
};

const UserRoadmap = () => {
  useUserAuth();

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [creatingRoadmap, setCreatingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState(defaultRoadmap);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const selectedTask = useMemo(
    () => tasks.find((item) => String(item._id) === String(selectedTaskId)) || null,
    [tasks, selectedTaskId]
  );

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL);
      const nextTasks = Array.isArray(response?.data?.tasks) ? response.data.tasks : [];
      setTasks(nextTasks);

      if (!selectedTaskId && nextTasks.length > 0) {
        setSelectedTaskId(nextTasks[0]._id);
      }
    } catch (error) {
      setAlert({ type: 'error', message: error?.response?.data?.message || 'Unable to fetch assigned tasks.' });
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const buildPrompt = () => {
    if (!selectedTask) return '';

    const checklist = Array.isArray(selectedTask.todoCheckList)
      ? selectedTask.todoCheckList.map((item) => item?.text).filter(Boolean).join('; ')
      : '';

    return [
      `Task title: ${selectedTask.title || ''}`,
      `Description: ${selectedTask.description || ''}`,
      `Priority: ${selectedTask.priority || 'medium'}`,
      `Due date: ${selectedTask.dueDate || 'not set'}`,
      checklist ? `Checklist: ${checklist}` : '',
      prompt ? `Custom goal prompt: ${prompt}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const generateRoadmap = async () => {
    if (!selectedTaskId) {
      setAlert({ type: 'error', message: 'Select an assigned task to generate a roadmap.' });
      return;
    }

    try {
      setCreatingRoadmap(true);
      setAlert({ type: '', message: '' });

      const response = await axiosInstance.post(API_PATHS.AI.ROADMAP, {
        taskId: selectedTaskId,
        prompt: buildPrompt(),
      });

      const data = response?.data || defaultRoadmap;
      setRoadmap({
        goalBreakdown: Array.isArray(data.goalBreakdown) ? data.goalBreakdown : [],
        stepByStepTaskFlow: Array.isArray(data.stepByStepTaskFlow) ? data.stepByStepTaskFlow : [],
        timelineDeadlines: Array.isArray(data.timelineDeadlines) ? data.timelineDeadlines : [],
        taskDependencies: Array.isArray(data.taskDependencies) ? data.taskDependencies : [],
        smartPrioritization: Array.isArray(data.smartPrioritization) ? data.smartPrioritization : [],
        adaptiveUpdates: Array.isArray(data.adaptiveUpdates) ? data.adaptiveUpdates : [],
        summary: data.summary || '',
      });

      setAlert({ type: 'success', message: 'Roadmap generated successfully from your selected task.' });
    } catch (error) {
      setAlert({ type: 'error', message: error?.response?.data?.message || 'Unable to generate roadmap right now.' });
    } finally {
      setCreatingRoadmap(false);
    }
  };

  return (
    <DashBoardLayout activeMenu="user/roadmap">
      <div className="space-y-5">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <Sparkles className="size-6 text-blue-600" />
            Roadmap Generation
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Auto-create a structured roadmap from your assigned task and custom prompt.
          </p>
        </div>

        {alert.message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              alert.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
            }`}
            role="alert"
          >
            {alert.message}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Assigned Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(event) => {
                  setSelectedTaskId(event.target.value);
                  setRoadmap(defaultRoadmap);
                  setAlert({ type: '', message: '' });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                disabled={loadingTasks || creatingRoadmap}
              >
                <option value="">Select task</option>
                {tasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Auto-create roadmap from prompt
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Build a launch-ready plan with risk controls and daily checkpoints."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={generateRoadmap}
                  disabled={creatingRoadmap || loadingTasks}
                  className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {creatingRoadmap ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {creatingRoadmap ? 'Generating' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {loadingTasks && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading assigned tasks...</p>}
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Goal className="size-4 text-blue-600" />
              1. Goal Breakdown
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.goalBreakdown.length > 0 ? roadmap.goalBreakdown.map((item) => <p key={item}>- {item}</p>) : <p>No goal breakdown yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <CalendarClock className="size-4 text-indigo-600" />
              3. Timeline & Deadlines
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.timelineDeadlines.length > 0 ? roadmap.timelineDeadlines.map((item, index) => (
                <p key={`${item?.milestone || 'milestone'}-${index}`}>
                  {item?.milestone || 'Milestone'}: {item?.targetDate || 'TBD'}
                </p>
              )) : <p>No timeline items yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="size-4 text-emerald-600" />
              2. Step-by-Step Task Flow
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.stepByStepTaskFlow.length > 0 ? roadmap.stepByStepTaskFlow.map((step, index) => (
                <div key={`${step?.title || 'step'}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Step {step?.step || index + 1}: {step?.title || 'Untitled'}</p>
                  <p className="mt-1">{step?.details || 'No details provided.'}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Est. duration: {step?.estimatedDuration || 'Not specified'}</p>
                </div>
              )) : <p>No flow steps yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <GitBranch className="size-4 text-amber-600" />
              4. Task Dependencies
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.taskDependencies.length > 0 ? roadmap.taskDependencies.map((item, index) => (
                <p key={`${item?.task || 'dependency'}-${index}`}>
                  {item?.task || 'Task'} depends on {item?.dependsOn || 'other tasks'}
                </p>
              )) : <p>No dependencies listed.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <TriangleAlert className="size-4 text-rose-600" />
              5. Smart Prioritization
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.smartPrioritization.length > 0 ? roadmap.smartPrioritization.map((item, index) => (
                <p key={`${item?.item || 'priority'}-${index}`}>
                  [{item?.priority || 'medium'}] {item?.item || 'Task item'}
                </p>
              )) : <p>No prioritization items yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">6. Adaptive Updates</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {roadmap.adaptiveUpdates.length > 0 ? roadmap.adaptiveUpdates.map((item) => <p key={item}>- {item}</p>) : <p>No adaptive update rules yet.</p>}
            </div>

            {roadmap.summary && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
                {roadmap.summary}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default UserRoadmap;
