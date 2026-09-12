import React, { useContext } from 'react'
import Login from './pages/auth/Login'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router'
import SignUp from './pages/auth/SignUp'
import DashBoard from './pages/admin/DashBoard'
import { UserProvider, UserContext } from './context/UserContext'
import UserDashBoard from './pages/user/UserDashBoard'
import CreateTask from './pages/admin/CreateTask'
import Manage from './pages/admin/Manage'
import ManageUsers from './pages/admin/ManageUsers'
import AiTaskCreator from './pages/admin/AiTaskCreator'
import MyTask from './pages/user/MyTask'
import ViewTaskDetails from './pages/user/ViewTaskDetails'
import ChatAssistant from './pages/shared/ChatAssistant'
import AiInsights from './pages/user/AiInsights'
import CompletedTasks from './pages/user/CompletedTasks'
import UserRoadmap from './pages/user/UserRoadmap'
import AdminStrategicDashboard from './pages/admin/AdminStrategicDashboard'
import PageTitle from './components/PageTitle'

const App = () => {
  return (

    <BrowserRouter>
      <PageTitle />
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signUp" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />

          {/* admin Routes */}
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/admin/tasks" element={<Manage />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/strategic" element={<AdminStrategicDashboard />} />
          <Route path="/admin/ai-task-creator" element={<AiTaskCreator />} />
          <Route path="/create-task" element={<CreateTask />} />
          <Route path="/user-dashboard" element={<UserDashBoard />} />
          <Route path="/user/dashboard" element={<UserDashBoard />} />
          <Route path="/user/tasks" element={<MyTask />} />
          <Route path="/user/tasks/:id" element={<ViewTaskDetails />} />
          <Route path="/user/completed" element={<CompletedTasks />} />
          <Route path="/user/insights" element={<AiInsights />} />
          <Route path="/user/roadmap" element={<UserRoadmap />} />
          <Route path="/assistant" element={<ChatAssistant />} />

          {/* default route */}
          <Route path="/" element={<Root />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}


export default App

const Root = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Loading workspace...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />
  return user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/user-dashboard" />
}