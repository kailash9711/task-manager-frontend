import React from 'react'
import ThemeSwitch from '../ui/ThemeSwitch'

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-white dark:selection:text-slate-900">
      {/* Theme Switch top right */}
      <div className="absolute right-6 top-6 z-50">
        <ThemeSwitch />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in-up space-y-10 opacity-0">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
