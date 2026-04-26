import { useEffect } from 'react';
import { useLocation } from 'react-router';

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const titleMap = {
      '/login': 'Login | Task Manager',
      '/signUp': 'Sign Up | Task Manager',
      '/signup': 'Sign Up | Task Manager',
      '/dashboard': 'Admin Dashboard | Task Manager',
      '/admin/tasks': 'Manage Tasks | Task Manager',
      '/admin/users': 'Manage Users | Task Manager',
      '/admin/ai-task-creator': 'AI Task Creator | Task Manager',
      '/create-task': 'Create Task | Task Manager',
      '/user-dashboard': 'User Dashboard | Task Manager',
      '/user/dashboard': 'User Dashboard | Task Manager',
      '/user/tasks': 'My Tasks | Task Manager',
      '/user/completed': 'Completed Tasks | Task Manager',
      '/user/insights': 'AI Insights | Task Manager',
      '/user/roadmap': 'Learning Roadmap | Task Manager',
      '/assistant': 'AI Chat Assistant | Task Manager',
    };

    // Handle dynamic routes like /user/tasks/:id
    let currentTitle = titleMap[location.pathname] || 'Task Manager';
    
    if (location.pathname.startsWith('/user/tasks/')) {
        currentTitle = 'Task Details | Task Manager';
    }

    document.title = currentTitle;
  }, [location]);

  return null;
};

export default PageTitle;
