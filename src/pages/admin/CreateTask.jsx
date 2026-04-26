import React, { useEffect, useState } from 'react'
import DashBoardLayout from '../../components/layouts/DashBoardLayout'
import { X, Plus, Trash2, Upload, Paperclip, Loader2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';  
import SelectUsers from '../../components/inputs/SelectUsers';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import ConfirmDeleteTask from '../../components/modals/ConfirmDeleteTask';
import { addNotification } from '../../utils/notifications';


const CreateTask = () => {

  const location = useLocation();
  const {taskId} = location.state || {};
  const navigate = useNavigate();

  const [taskData, setTaskData] = useState(
    {
      title: '',
      description: '',
      priority: 'low',
      dueDate: '',
      assignedTo: [],
      todoCheckList: [],
      attachments: [],
      todoInput: '',
    }
  )   
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [breakingTask, setBreakingTask] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [typingSuggestions, setTypingSuggestions] = useState([]);

  const handleValueChange = (key, value) => {
    setTaskData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearData = () => {
    setTaskData({
      title: '',
      description: '',
      priority: 'low',
      dueDate: '',
      assignedTo: [],
      todoCheckList: [],
      attachments: [],
      todoInput: '',
    })
  }

  const taskPayload = {
    title: taskData.title.trim(),
    description: taskData.description.trim(),
    priority: taskData.priority,
    dueDate: taskData.dueDate || null,
    assignedTo: taskData.assignedTo,
    todoCheckList: taskData.todoCheckList,
    attachments: taskData.attachments,
  };

  const createTask = async () => {
    const response = await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, taskPayload);
    return response.data;
  }

  const updateTask = async () => {
    const updatePath = API_PATHS.TASKS.UPDATE_TASK.replace(':id', taskId);
    const response = await axiosInstance.put(updatePath, taskPayload);
    return response.data;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskPayload.title) {
      setError('Task title is required.');
      return;
    }

    if (!taskPayload.assignedTo.length) {
      setError('Please select at least one user.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (taskId) {
        const response = await updateTask();
        const updatedTask = response?.task || response;
        const assignedIds = Array.isArray(updatedTask?.assignedTo)
          ? updatedTask.assignedTo.map((user) => (typeof user === 'string' ? user : user?._id)).filter(Boolean)
          : taskPayload.assignedTo;

        addNotification({
          title: 'Task updated',
          message: `Task "${taskPayload.title}" was updated by admin.`,
          type: 'info',
          recipientRole: 'all',
          recipientIds: assignedIds,
          taskId: updatedTask?._id || taskId,
        });
      } else {
        const response = await createTask();
        const createdTask = response?.task || response;
        const assignedIds = Array.isArray(createdTask?.assignedTo)
          ? createdTask.assignedTo.map((user) => (typeof user === 'string' ? user : user?._id)).filter(Boolean)
          : taskPayload.assignedTo;

        addNotification({
          title: 'New task assigned',
          message: `You were assigned to "${taskPayload.title}".`,
          type: 'success',
          recipientRole: 'user',
          recipientIds: assignedIds,
          taskId: createdTask?._id,
        });

        addNotification({
          title: 'Task created',
          message: `Admin created "${taskPayload.title}" and assigned it to ${assignedIds.length} user${assignedIds.length === 1 ? '' : 's'}.`,
          type: 'info',
          recipientRole: 'admin',
          taskId: createdTask?._id,
        });
      }

      clearData();
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save task.');
    } finally {
      setLoading(false);
    }
  }



  //get task by id
  const getTaskById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const detailPath = API_PATHS.TASKS.GET_BY_ID.replace(':id', id);
      const response = await axiosInstance.get(detailPath);
      const task = response.data;
      const assignedUsers = Array.isArray(task.assignedTo)
        ? task.assignedTo.map((user) => (typeof user === 'string' ? user : user?._id)).filter(Boolean)
        : [];

      setTaskData((prev) => ({
        ...prev,
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'low',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        assignedTo: assignedUsers,
        todoCheckList: task.todoCheckList || [],
        attachments: task.attachments || [],
      }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to fetch task details.');
    } finally {
      setLoading(false);
    }
  }

  //delete task
  const deleteTask = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const deletePath = API_PATHS.TASKS.DELETE_TASK.replace(':id', id);
      await axiosInstance.delete(deletePath);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete task.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (taskId) {
      getTaskById(taskId);
    }
  }, [taskId]);

  const addTodoItem = () => {
    const todoText = taskData.todoInput?.trim();
    if (!todoText) return;

    handleValueChange('todoCheckList', [
      ...taskData.todoCheckList,
      { text: todoText, completed: false },
    ]);
    handleValueChange('todoInput', '');
  }

  const removeTodoItem = (index) => {
    const updated = taskData.todoCheckList.filter((_, itemIndex) => itemIndex !== index);
    handleValueChange('todoCheckList', updated);
  }

  const toggleTodoCompletion = (index) => {
    const updated = taskData.todoCheckList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, completed: !item.completed } : item
    ));
    handleValueChange('todoCheckList', updated);
  }

  const uploadAttachment = async (file) => {
    if (!file) return;

    try {
      setUploadingAttachment(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post(API_PATHS.TASKS.UPLOAD_ATTACHMENT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const attachmentUrl = response?.data?.attachment?.url;
      if (!attachmentUrl) {
        setError('Upload succeeded but no file URL was returned.');
        return;
      }

      if (!taskData.attachments.includes(attachmentUrl)) {
        handleValueChange('attachments', [...taskData.attachments, attachmentUrl]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to upload attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  }

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    await uploadAttachment(selectedFile);
    event.target.value = '';
  }

  const removeAttachment = (attachmentIndex) => {
    const updated = taskData.attachments.filter((_, index) => index !== attachmentIndex);
    handleValueChange('attachments', updated);
  }

  const runBreakTask = async () => {
    if (!taskData.title.trim() && !taskData.description.trim()) {
      setError('Add a title or description before breaking task.');
      return;
    }

    try {
      setBreakingTask(true);
      const response = await axiosInstance.post(API_PATHS.AI.BREAK_TASK, {
        title: taskData.title,
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
  }

  useEffect(() => {
    const text = `${taskData.title} ${taskData.description}`.trim();
    if (text.length < 8) {
      setTypingSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axiosInstance.post(API_PATHS.AI.SUGGESTIONS, {
          text,
          mode: 'typing',
        });
        setTypingSuggestions(Array.isArray(response?.data?.suggestions) ? response.data.suggestions : []);
      } catch {
        setTypingSuggestions([]);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [taskData.title, taskData.description]);

  const completedCount = taskData.todoCheckList.filter((item) => item.completed).length;
  const progress = taskData.todoCheckList.length > 0
    ? Math.round((completedCount / taskData.todoCheckList.length) * 100)
    : 0;

  return (
    <DashBoardLayout activeMenu="create-task">
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 px-4 py-6 md:p-8 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-slate-900">{
            taskId ? 'Edit Task' : 'Create Task'
          }</h1>
        {taskId && (
          <button
            type="button"
            onClick={() => setOpenDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 size={16} /> Delete Task
          </button>
        )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Task Title
          </label>
          <input
            type="text"
            placeholder="Create App UI"
            value={taskData.title}
            onChange={({target}) => handleValueChange('title', target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {typingSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {typingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleValueChange('description', suggestion)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Description
          </label>
          <textarea
            type="text"
            placeholder="Describe task"
            value={taskData.description}
            onChange={({target}) => handleValueChange('description', target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-slate-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Priority, Due Date, Assign To */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Priority
            </label>
            <select
              value={taskData.priority}
              onChange={({target}) => handleValueChange('priority', target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={taskData.dueDate}
              onChange={({target}) => handleValueChange('dueDate', target.value)}
              className="form-input w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white  "
              placeholder="dd/mm/yyyy"
            />
          </div>

          {/* Assign To */}
          <div >
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Assign To
            </label>
            <button
              type="button"
           onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.97]"
      >
        {taskData.assignedTo.length > 0 ? `Selected (${taskData.assignedTo.length})` : 'Select Users'}
      </button>

            <SelectUsers
              open ={open}
              onClose={() => setOpen(false)}
              selectedUsers={taskData.assignedTo}
              setSelectedUsers={(value) => handleValueChange('assignedTo', value)}
            />
          </div>
        </div>

        {/* TODO Checklist */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">TODO Checklist</h3>
          <button
            type="button"
            onClick={runBreakTask}
            disabled={breakingTask}
            className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {breakingTask ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {breakingTask ? 'Breaking task...' : 'One-click Break Task'}
          </button>

          {aiExplanation && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {aiExplanation}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Enter Task"
              value={taskData.todoInput}
              onChange={({target}) => handleValueChange('todoInput', target.value)}
              // onKeyPress={(e) => e.key === 'Enter' && addTodoItem()}
              className="flex-1"
            />
            <button
              type="button"
              onClick={addTodoItem}
              variant="ghost"
              className="px-4"
            >
              <Plus size={20} /> Add
            </button>
          </div>
          
          {/* Todo Items List */}
          <div className="space-y-2">
            {taskData.todoCheckList.map((item, index) => (
              <div key={`${item.text}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(item.completed)}
                    onChange={() => toggleTodoCompletion(index)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-slate-600 ${item.completed ? 'line-through opacity-60' : ''}`}>{item.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeTodoItem(index)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Attachments */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Attachments</h3>
          
          {/* Existing Attachments */}
          <div className="space-y-2 mb-3">
            {taskData.attachments.map((attachment, index) => (
              <div key={`${attachment}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Paperclip size={18} className="text-slate-400" />
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {decodeURIComponent(attachment.split('/').pop() || attachment)}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer transition-colors">
              <Upload size={18} />
              {uploadingAttachment ? 'Uploading...' : 'Upload File'}
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadingAttachment}
              />
            </label>
            <p className="text-xs text-slate-500">Max size: 10MB. Supported: image, pdf, doc, xls, ppt, txt, csv, zip, rar.</p>
          </div>
        </div> 

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Progress</p>
            <p className="text-sm font-semibold text-slate-600">{progress}%</p>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-red-500 to-red-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        
        <button
          type="submit"
          disabled={loading || uploadingAttachment}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'SAVING...' : uploadingAttachment ? 'WAITING FOR UPLOAD...' : taskId ? 'UPDATE TASK' : 'CREATE TASK'}
        </button>
      </form>

      <ConfirmDeleteTask
        open={openDeleteModal}
        loading={loading}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={() => deleteTask(taskId)}
      />
    </div>
    </DashBoardLayout>

  )
}

export default CreateTask
