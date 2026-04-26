import React from 'react';
import { Mail, ListChecks, LoaderCircle, CheckCircle2 } from 'lucide-react';

const TeamMemberCard = ({ user, onDelete }) => {
  const initials = String(user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {initials || 'U'}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-slate-100">{user.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400"><Mail className="size-3.5" /> {user.email}</p>
          </div>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{user.role || 'user'}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"><ListChecks className="size-3.5" /> Pending</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.pendingTasks || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"><LoaderCircle className="size-3.5" /> Active</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.inProgressTasks || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"><CheckCircle2 className="size-3.5" /> Done</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.completedTasks || 0}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete?.(user)}
        className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
      >
        Remove Member
      </button>
      </div>
    </div>
  );
};

export default TeamMemberCard;
