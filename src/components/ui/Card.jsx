import React from 'react'

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 dark:bg-slate-900 dark:border-slate-800 ${className}`}>
      {title ? (
        <p className="text-gray-900 text-sm font-semibold uppercase tracking-wide mb-3 dark:text-slate-100">{title}</p>
      ) : null}
      <div>{children}</div>
    </div>
  )
}

export default Card
