import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import SelectUsers from '../../components/inputs/SelectUsers';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useUserAuth } from '../../hooks/useUserAuth';
import { ArrowLeft, Bot, Loader2, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { addNotification } from '../../utils/notifications';

const emptyTaskState = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  assignedTo: [],
  todoCheckList: [],
  todoInput: '',
};

const AiTaskCreator = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [taskData, setTaskData] = useState(emptyTaskState);
  const [teamMembers, setTeamMembers] = useState([]);
  const [suggestedAssignees, setSuggestedAssignees] = useState([]);
  const [error, setError] = useState('');
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [breakingTask, setBreakingTask] = useState(false);
  const [aiTypingSuggestions, setAiTypingSuggestions] = useState([]);
  const [aiExplanation, setAiExplanation] = useState('');

  const handleValueChange = (key, value) => {
    setTaskData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearDraft = () => {
    setPrompt('');
    setSuggestedAssignees([]);
    setTaskData(emptyTaskState);
  };

  const loadTeamMembers = async () => {
    try {
      setLoadingTeamMembers(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
      setTeamMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load team members.');
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const applyDraft = (draft) => {
    const nextTask = {
      title: draft?.title || '',
      description: draft?.description || '',
      priority: draft?.priority || 'medium',
      dueDate: draft?.dueDate || '',
      assignedTo: [],
      todoCheckList: Array.isArray(draft?.todoCheckList) ? draft.todoCheckList : [],
      todoInput: '',
    };

    const suggestedNames = Array.isArray(draft?.suggestedAssignees) ? draft.suggestedAssignees : [];
    const matchedAssignees = teamMembers
      .filter((member) => {
        const name = String(member?.name || '').trim().toLowerCase();
        const email = String(member?.email || '').trim().toLowerCase();
        return suggestedNames.some((entry) => {
          const target = String(entry || '').trim().toLowerCase();
          return target && (target === name || target === email);
        });
      })
      .map((member) => member._id)
      .filter(Boolean);

    setSuggestedAssignees(suggestedNames);
    setTaskData({
      ...nextTask,
      assignedTo: matchedAssignees,
    });
  };

  const generateDraft = async () => {
    if (!prompt.trim()) {
      setError('Describe the task you want the AI to create.');
      return;
    }

    try {
      setGeneratingDraft(true);
      setError('');

      const response = await axiosInstance.post(
        API_PATHS.AI.GENERATE_TASK_DRAFT,
        {
          prompt,
          teamMembers: teamMembers.map((member) => ({
            _id: member._id,
            name: member.name,
            email: member.email,
            role: member.role,
          })),
        },
        {
          timeout: 60000,
        }
      );

      const draft = response?.data?.draft;
      if (!draft) {
        throw new Error('The AI service did not return a task draft.');
      }

      applyDraft(draft);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to generate task draft.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const createTask = async () => {
    const payload = {
      title: taskData.title.trim(),
      description: taskData.description.trim(),
      priority: taskData.priority,
      dueDate: taskData.dueDate || null,
      assignedTo: taskData.assignedTo,
      todoCheckList: taskData.todoCheckList,
      attachments: [],
    };

    if (!payload.title) {
      setError('Task title is required before creating the task.');
      return;
    }

    if (!payload.assignedTo.length) {
      setError('Select at least one assignee before creating the task.');
      return;
    }

    try {
      setCreatingTask(true);
      setError('');
      const response = await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, payload);
      const createdTask = response?.data || response;
      const assignedIds = Array.isArray(createdTask?.assignedTo)
        ? createdTask.assignedTo.map((user) => (typeof user === 'string' ? user : user?._id)).filter(Boolean)
        : payload.assignedTo;

      addNotification({
        title: 'New task assigned',
        message: `You were assigned to "${payload.title}".`,
        type: 'success',
        recipientRole: 'user',
        recipientIds: assignedIds,
        taskId: createdTask?._id,
      });

      addNotification({
        title: 'Task created',
        message: `Admin created "${payload.title}" and assigned it to ${assignedIds.length} user${assignedIds.length === 1 ? '' : 's'}.`,
        type: 'info',
        recipientRole: 'admin',
        taskId: createdTask?._id,
      });
      clearDraft();
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  const addTodoItem = () => {
    const todoText = taskData.todoInput?.trim();
    if (!todoText) return;

    handleValueChange('todoCheckList', [
      ...taskData.todoCheckList,
      { text: todoText, completed: false },
    ]);
    handleValueChange('todoInput', '');
  };

  const removeTodoItem = (index) => {
    const updated = taskData.todoCheckList.filter((_, itemIndex) => itemIndex !== index);
    handleValueChange('todoCheckList', updated);
  };

  const toggleTodoCompletion = (index) => {
    const updated = taskData.todoCheckList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, completed: !item.completed } : item
    ));
    handleValueChange('todoCheckList', updated);
  };

  const completedCount = taskData.todoCheckList.filter((item) => item.completed).length;
  const progress = taskData.todoCheckList.length > 0
    ? Math.round((completedCount / taskData.todoCheckList.length) * 100)
    : 0;

  const breakTask = async () => {
    if (!taskData.title.trim() && !taskData.description.trim() && !prompt.trim()) {
      setError('Add a prompt, title, or description first.');
      return;
    }

    try {
      setBreakingTask(true);
      const response = await axiosInstance.post(API_PATHS.AI.BREAK_TASK, {
        title: taskData.title || prompt,
        description: taskData.description,
      });

      const subtasks = Array.isArray(response?.data?.subtasks) ? response.data.subtasks : [];
      setAiExplanation(response?.data?.explanation || '');

      if (subtasks.length) {
        const existing = new Set(taskData.todoCheckList.map((item) => String(item.text || '').trim().toLowerCase()));
        const additions = subtasks
          .map((text) => String(text || '').trim())
          .filter((text) => text && !existing.has(text.toLowerCase()))
          .map((text) => ({ text, completed: false, source: 'ai', locked: true }));

        if (additions.length) {
          handleValueChange('todoCheckList', [...taskData.todoCheckList, ...additions]);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to break task.');
    } finally {
      setBreakingTask(false);
    }
  };

  useEffect(() => {
    const text = prompt.trim();
    if (text.length < 8) {
      setAiTypingSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axiosInstance.post(API_PATHS.AI.SUGGESTIONS, {
          text,
          mode: 'typing',
        });
        setAiTypingSuggestions(Array.isArray(response?.data?.suggestions) ? response.data.suggestions : []);
      } catch {
        setAiTypingSuggestions([]);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [prompt]);

  return (
    <DashBoardLayout activeMenu="ai-task-creator">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)] px-4 py-6 md:p-8 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#020617_100%)]">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
              Write one short prompt to generate a task draft quickly.
            </p>

            <button
              type="button"
              onClick={() => navigate('/create-task')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="size-4" />
              Open manual builder
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.35fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
                <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Task prompt</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Be specific about scope, deadline, and expected outcome.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Bot className="size-3.5" />
                  {loadingTeamMembers ? 'Loading team...' : `${teamMembers.length} team members`}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 focus-within:border-sky-300 focus-within:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-sky-500">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Build login page by Friday, high priority, 3 subtasks"
                    className="w-full bg-transparent px-2 py-2 text-sm font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">Title</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">Priority</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Due date</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">Subtasks</span>
                  </div>
                </div>

                {aiTypingSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aiTypingSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setPrompt(suggestion)}
                        className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Keep it short and specific for smoother AI results.
                </p>

                <button
                  type="button"
                  onClick={breakTask}
                  disabled={breakingTask || generatingDraft}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {breakingTask ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {breakingTask ? 'Breaking task...' : 'Break task into subtasks'}
                </button>

                {aiExplanation && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                    {aiExplanation}
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={generatingDraft || loadingTeamMembers}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:from-cyan-500 dark:to-blue-500 dark:text-slate-950 dark:shadow-cyan-500/20 dark:hover:from-cyan-400 dark:hover:to-blue-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
                >
                  {generatingDraft ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {generatingDraft ? 'Generating draft...' : 'Generate AI draft'}
                </button>

                <button
                  type="button"
                  onClick={clearDraft}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reset draft
                </button>
              </div>
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggested assignees</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Matched automatically from the available team members when possible.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenUsers(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Users className="size-4" />
                    Pick assignees
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedAssignees.length > 0 ? suggestedAssignees.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                      {item}
                    </span>
                  )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No AI suggestions yet.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Draft preview</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Fine tune the AI output before creating the task.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {taskData.title ? 'Draft ready' : 'Awaiting generation'}
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={taskData.title}
                    onChange={({ target }) => handleValueChange('title', target.value)}
                    placeholder="AI generated task title"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-950/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={taskData.description}
                    onChange={({ target }) => handleValueChange('description', target.value)}
                    rows={5}
                    placeholder="AI generated task description"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-950/40"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                    <select
                      value={taskData.priority}
                      onChange={({ target }) => handleValueChange('priority', target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-950/40"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Due date</label>
                    <input
                      type="date"
                      value={taskData.dueDate}
                      onChange={({ target }) => handleValueChange('dueDate', target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-950/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Assignees</label>
                    <button
                      type="button"
                      onClick={() => setOpenUsers(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Users className="size-4" />
                      {taskData.assignedTo.length > 0 ? `${taskData.assignedTo.length} selected` : 'Select users'}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">TODO checklist</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">The AI can generate items, and you can still edit them here.</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress {progress}%</p>
                  </div>

                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add another checklist item"
                      value={taskData.todoInput}
                      onChange={({ target }) => handleValueChange('todoInput', target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-950/40"
                    />
                    <button
                      type="button"
                      onClick={addTodoItem}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="size-4" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {taskData.todoCheckList.length > 0 ? taskData.todoCheckList.map((item, index) => (
                      <div key={`${item.text}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(item.completed)}
                            onChange={() => toggleTodoCompletion(index)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm text-slate-700 dark:text-slate-200 ${item.completed ? 'line-through opacity-60' : ''}`}>
                            {item.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeTodoItem(index)}
                          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-500 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                        No checklist items yet. Generate a draft or add items manually.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selected assignees</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{taskData.assignedTo.length} chosen</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {taskData.assignedTo.length > 0 ? taskData.assignedTo.map((id) => {
                      const member = teamMembers.find((item) => item._id === id);
                      return (
                        <span key={id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                          {member?.name || member?.email || id}
                        </span>
                      );
                    }) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Pick one or more users to complete the task.</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={createTask}
                  disabled={creatingTask || generatingDraft}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {creatingTask ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {creatingTask ? 'Creating task...' : 'Create task from draft'}
                </button>
              </div>
            </section>
          </div>
        </div>

        <SelectUsers
          open={openUsers}
          onClose={() => setOpenUsers(false)}
          selectedUsers={taskData.assignedTo}
          setSelectedUsers={(value) => handleValueChange('assignedTo', value)}
        />
      </div>
    </DashBoardLayout>
  );
};

export default AiTaskCreator;