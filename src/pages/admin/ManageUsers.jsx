import React, { useEffect, useMemo, useState } from 'react'
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import TeamMemberCard from '../../components/cards/TeamMemberCard';
import { Download, Search, Users } from 'lucide-react';
import { useUserAuth } from '../../hooks/useUserAuth';

const ManageUsers = () => {
  useUserAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const getUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(API_PATHS.USERS.GET_TEAM_MEMBERS);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load team members.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  const handleDeleteMember = async (user) => {
    try {
      const deletePath = API_PATHS.USERS.DELETE_TEAM_MEMBER.replace(':id', user._id);
      await axiosInstance.delete(deletePath);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete team member.');
    }
  }

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (filterRole === 'all') return true;
        return user.role === filterRole;
      })
      .filter((user) => {
        const text = `${user.name || ''} ${user.email || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [users, filterRole, search]);

  const downloadTeamCsv = () => {
    if (!users.length) return;

    const headers = ['Name', 'Email', 'Role', 'Pending Tasks', 'In Progress Tasks', 'Completed Tasks'];
    const rows = users.map((user) => [
      user.name,
      user.email,
      user.role,
      user.pendingTasks || 0,
      user.inProgressTasks || 0,
      user.completedTasks || 0,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `team-members-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <DashBoardLayout activeMenu="users">
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/20 to-slate-100 px-4 py-6 md:p-8 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Team Members</h1>
              <p className="text-slate-600 dark:text-slate-300">Manage users, monitor workload, and export all member details.</p>
            </div>

            <button
              type="button"
              onClick={downloadTeamCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Download className="size-4" />
              Download Member Details
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
                <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team member by name or email"
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">Loading team members...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600 inline-flex flex-col items-center gap-2 w-full dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
              <Users className="size-5" />
              No team members found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredUsers.map((user) => (
                <TeamMemberCard key={user._id} user={user} onDelete={handleDeleteMember} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashBoardLayout>
  )
}

export default ManageUsers
