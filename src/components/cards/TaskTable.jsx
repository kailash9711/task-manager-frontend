import React from 'react'

const getPriorityBadge = (priority) => {
  if (priority === 'high') return 'bg-red-100 text-red-700';
  if (priority === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

const getStatusBadge = (status) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'in-progress') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-700';
}

const TaskTable = ({ tableData, onTaskClick }) => {
  return (
    <div>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="">
            <th className="text-left text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
              Task Name
            </th>
            <th className="text-left text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
              Status
            </th>
            <th className="text-left text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
              priority
            </th>
            <th className="text-left text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
              Due Date
            </th>

          </tr>
        </thead>
        <tbody>
          {tableData.map((task) => (
            <tr
              key={task._id}
              onClick={() => onTaskClick?.(task)}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                {task.title}
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(task.status)}`}>
                  {task.status || 'pending'}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                  {task.priority || 'low'}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
              </td>
               </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TaskTable
