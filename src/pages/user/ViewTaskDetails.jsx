import React, { useEffect, useMemo, useState } from 'react'
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import { ArrowLeft, CalendarClock, CircleCheckBig, Loader2, Paperclip, Plus, Sparkles, Trash2, Upload } from 'lucide-react';

const ViewTaskDetails = () => {
  useUserAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftDueDate, setDraftDueDate] = useState('');
  const [draftChecklist, setDraftChecklist] = useState([]);
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [breakingTask, setBreakingTask] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [typingSuggestions, setTypingSuggestions] = useState([]);

  const isProtectedSubtask = (item) => Boolean(item?.locked || item?.source === 'admin' || item?.source === 'ai');

  useEffect(() => {
    const getTask = async () => {
      try {
        setLoading(true);
        const path = API_PATHS.TASKS.GET_BY_ID.replace(':id', id);
        const response = await axiosInstance.get(path);
        const taskData = response.data || null;
        setTask(taskData);
        setDraftDueDate(taskData?.dueDate ? new Date(taskData.dueDate).toISOString().slice(0, 10) : '');
        setDraftChecklist(Array.isArray(taskData?.todoCheckList) ? taskData.todoCheckList : []);
        setDraftAttachments(Array.isArray(taskData?.attachments) ? taskData.attachments : []);
      } catch (error) {
        console.error('Error fetching task detail:', error);
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) getTask();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    const text = newSubtask.trim();

    if (text.length < 8) {
      setTypingSuggestions([]);
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axiosInstance.post(
          API_PATHS.AI.SUGGESTIONS,
          {
            text,
            context: task?.title || '',
            mode: 'typing',
          },
          { signal: controller.signal }
        );
        setTypingSuggestions(Array.isArray(response?.data?.suggestions) ? response.data.suggestions : []);
      } catch {
        setTypingSuggestions([]);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [newSubtask, task?.title]);

  const completedCount = useMemo(
    () => draftChecklist.filter((item) => Boolean(item.completed)).length,
    [draftChecklist]
  );

  const progress = useMemo(
    () => (draftChecklist.length ? Math.round((completedCount / draftChecklist.length) * 100) : 0),
    [completedCount, draftChecklist]
  );

  const toggleChecklistItem = (index) => {
    setDraftChecklist((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, completed: !item.completed } : item
    )));
  };

  const updateChecklistText = (index, value) => {
    setDraftChecklist((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (isProtectedSubtask(item)) return item;
      return { ...item, text: value };
    }));
  };

  const removeChecklistItem = (index) => {
    setDraftChecklist((prev) => {
      const target = prev[index];
      if (isProtectedSubtask(target)) return prev;
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const addChecklistItem = () => {
    const text = newSubtask.trim();
    if (!text) return;

    setDraftChecklist((prev) => [...prev, { text, completed: false, source: 'user', locked: false }]);
    setNewSubtask('');
    setTypingSuggestions([]);
  };

  const uploadAttachment = async (file) => {
    if (!file) return;

    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post(API_PATHS.TASKS.UPLOAD_ATTACHMENT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const nextUrl = response?.data?.attachment?.url;
      if (nextUrl && !draftAttachments.includes(nextUrl)) {
        setDraftAttachments((prev) => [...prev, nextUrl]);
      }
    } finally {
      setUploadingAttachment(false);
    }
  };

  const runBreakTask = async () => {
    if (!task?.title && !task?.description) return;

    try {
      setBreakingTask(true);
      const response = await axiosInstance.post(API_PATHS.AI.BREAK_TASK, {
        title: task?.title,
        description: task?.description,
      });

      const nextSubtasks = Array.isArray(response?.data?.subtasks) ? response.data.subtasks : [];
      const explanation = response?.data?.explanation || '';

      setAiExplanation(explanation);

      if (nextSubtasks.length) {
        const existing = new Set(draftChecklist.map((item) => String(item.text || '').trim().toLowerCase()));
        const additions = nextSubtasks
          .map((text) => String(text || '').trim())
          .filter((text) => text && !existing.has(text.toLowerCase()))
          .map((text) => ({ text, completed: false, source: 'user', locked: false }));

        if (additions.length) {
          setDraftChecklist((prev) => [...prev, ...additions]);
        }
      }
    } catch (error) {
      console.error('Unable to break task:', error);
    } finally {
      setBreakingTask(false);
    }
  };

  const saveChanges = async () => {
    if (!task?._id) return;

    try {
      setSaving(true);

      const checklistPath = API_PATHS.TASKS.UPDATE_CHECKLIST.replace(':id', task._id);
      await axiosInstance.put(checklistPath, { todoCheckList: draftChecklist });

      const updatePath = API_PATHS.TASKS.UPDATE_TASK.replace(':id', task._id);
      const response = await axiosInstance.put(updatePath, {
        dueDate: draftDueDate || null,
        attachments: draftAttachments,
      });

      const nextTask = response?.data?.task || response?.data || task;
      setTask(nextTask);
      setPreviewOpen(false);
      navigate('/user/tasks');
    } catch (error) {
      console.error('Unable to save task updates:', error);
    } finally {
      setSaving(false);
    }
  };

  const timelineItems = useMemo(
    () => (Array.isArray(task?.timeline) ? [...task.timeline].sort((a, b) => new Date(b.at) - new Date(a.at)) : []),
    [task?.timeline]
  );

  return (
    <DashBoardLayout activeMenu="user/tasks">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate('/user/tasks')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to My Tasks
        </button>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading task details...</p>}

        {!loading && !task && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
            Task details not found.
          </div>
        )}

        {!loading && task && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{task.description || 'No description added.'}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <CalendarClock className="size-4" />
                {task.dueDate ? moment(task.dueDate).format('dddd, MMMM D YYYY, h:mm A') : 'No due date'}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Priority</p>
                <p className="mt-1 text-base font-semibold text-slate-900 capitalize dark:text-slate-100">{task.priority || 'low'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                <p className="mt-1 text-base font-semibold text-slate-900 capitalize dark:text-slate-100">{task.status || 'pending'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{progress}%</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Deadline (editable)</label>
                <input
                  type="date"
                  value={draftDueDate}
                  onChange={(e) => setDraftDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">One-Click Break Task</label>
                <button
                  type="button"
                  onClick={runBreakTask}
                  disabled={breakingTask}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {breakingTask ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {breakingTask ? 'Breaking task...' : 'Break task into subtasks'}
                </button>
              </div>
            </div>

            {aiExplanation && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                {aiExplanation}
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Checklist (User can add or complete)</h2>
              <div className="mt-3 space-y-2">
                {draftChecklist.map((item, index) => (
                  <div key={`${item._id || item.text}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/50">
                    <input
                      type="checkbox"
                      checked={Boolean(item.completed)}
                      onChange={() => toggleChecklistItem(index)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      value={item.text}
                      onChange={(e) => updateChecklistText(index, e.target.value)}
                      disabled={isProtectedSubtask(item)}
                      className={`flex-1 bg-transparent text-sm outline-none ${item.completed ? 'line-through opacity-70' : ''} ${isProtectedSubtask(item) ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                    />
                    {isProtectedSubtask(item) ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {draftChecklist.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No checklist items.</p>}

                <div className="rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
                  <div className="flex gap-2">
                    <input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add your own subtask"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950/40"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="size-4" />
                      Add
                    </button>
                  </div>

                  {typingSuggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {typingSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setNewSubtask(suggestion)}
                          className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Attachments</h2>
              <div className="mt-3 space-y-2">
                {draftAttachments.map((attachment, index) => (
                  <a
                    key={`${attachment}-${index}`}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 underline"
                  >
                    <Paperclip className="size-4" />
                    {decodeURIComponent(attachment.split('/').pop() || attachment)}
                  </a>
                ))}
                {draftAttachments.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No attachments.</p>}

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Upload className="size-4" />
                  {uploadingAttachment ? 'Uploading...' : 'Attach file'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingAttachment}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      await uploadAttachment(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timeline</h2>
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                {timelineItems.length > 0 ? timelineItems.map((item, index) => (
                  <div key={`${item.type}-${item.at}-${index}`} className="flex items-start gap-3 text-sm">
                    <CircleCheckBig className="mt-0.5 size-4 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{moment(item.at).format('MMM D, YYYY h:mm A')}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500 dark:text-slate-400">No timeline events yet.</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Preview before saving
              </button>
            </div>
          </div>
        )}

        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Preview changes</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review updates before saving this task.</p>

              <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <p><span className="font-semibold">Deadline:</span> {draftDueDate || 'No due date'}</p>
                <p><span className="font-semibold">Checklist:</span> {completedCount}/{draftChecklist.length} completed</p>
                <p><span className="font-semibold">Progress:</span> {progress}%</p>
                <p><span className="font-semibold">Attachments:</span> {draftAttachments.length}</p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashBoardLayout>
  )
}

export default ViewTaskDetails
