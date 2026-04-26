import React from 'react'
import ThemeSwitch from '../ui/ThemeSwitch'

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.12),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#111827_100%)]" />
      <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-4">
          {/* Central Branding */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 p-2.5 backdrop-blur-md ring-1 ring-white/10 shadow-lg">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-blue-400">Task Manager</p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="relative">
            <div className="relative rounded-[1.8rem] border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-7 dark:bg-slate-900/95 dark:border-slate-800">
              <div className="absolute right-5 top-5 scale-90 origin-right">
                <ThemeSwitch />
              </div>
              {children}
            </div>
          </div>

          {/* Minimal Footer Info */}
          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
            <span>Fast Planning</span>
            <span className="opacity-30">|</span>
            <span>Visibility</span>
            <span className="opacity-30">|</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
