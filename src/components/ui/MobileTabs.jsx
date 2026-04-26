import React from 'react';
import { DASHBOARD_MENU, SIDE_MENU_USER } from '../../utils/data';
import { useNavigate } from 'react-router';

const MobileTabs = ({ user, activeMenu, onLogout }) => {
  const navigate = useNavigate();
  const menu = user?.role === 'admin' ? DASHBOARD_MENU : SIDE_MENU_USER;

  const visibleTabs = menu.filter((item) => item.path !== '/logout' && item.path !== '/user/logout');

  const handleTabClick = (path) => {
    if (path === '/logout' || path === '/user/logout') {
      onLogout?.();
      return;
    }
    navigate(path);
  };

  return (
    <div className="lg:hidden border-b border-slate-200 bg-white/95 backdrop-blur sticky top-16 z-10 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 px-3 py-2 min-w-max">
          {visibleTabs.map((item) => {
            const isActive = item.path.includes(activeMenu) || activeMenu.includes(item.path.split('/').pop());
            return (
              <button
                key={item.id || item.path}
                type="button"
                onClick={() => handleTabClick(item.path)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabs;
