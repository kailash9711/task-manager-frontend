import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { DASHBOARD_MENU, SIDE_MENU_USER } from '../../utils/data';
import { useNavigate } from 'react-router';


const Slide = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const selectedNav = user?.role === 'admin' ? DASHBOARD_MENU : SIDE_MENU_USER;
  const navItems = selectedNav.filter((item) => item.path !== '/logout' && item.path !== '/user/logout');
  const logoutItem = selectedNav.find((item) => item.path === '/logout' || item.path === '/user/logout');

  const handleClick = (path) => {
    if (path === '/logout' || path === '/user/logout') {
      handleLogout();
      return;
    }

    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearUser();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 border-r border-slate-200 bg-linear-to-b from-white to-slate-50 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Overview
          </h3>
          <nav className="space-y-1.5">
            {navItems.map((item, index) => (
              <button
                key={`menu_${index}`}
                onClick={() => handleClick(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  item.path.includes(activeMenu) || activeMenu.includes(item.path.split('/').pop())
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {logoutItem && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleClick(logoutItem.path)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-900/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <logoutItem.icon className="h-4 w-4" />
              {logoutItem.label}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Slide;
