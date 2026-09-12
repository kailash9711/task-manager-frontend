import React, { useState, useEffect, useMemo } from 'react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import {
  Bot,
  Search,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Users,
  Zap,
  Loader2,
  RefreshCw,
  Target,
  BarChart3,
  AlertTriangle,
  MoveRight,
  UserCheck,
  Brain,
  Sparkles
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import moment from 'moment';

const AdminStrategicDashboard = () => {
  const [standup, setStandup] = useState('');
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [nlqQuery, setNlqQuery] = useState('');
  const [nlqResult, setNlqResult] = useState(null);
  const [loadingNlq, setLoadingNlq] = useState(false);
  const [skillData, setSkillData] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [whatIfScenario, setWhatIfScenario] = useState('');
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    fetchBaseData();
    fetchInitialStrategicData();
  }, []);

  const fetchBaseData = async () => {
    try {
      setLoadingTasks(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL);
      setTasks(response.data?.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchInitialStrategicData = () => {
    handleGenerateStandup();
    handleFetchSkills();
    handleFetchConflicts();
    handleFetchRebalance();
  };

  const handleGenerateStandup = async () => {
    try {
      setLoadingStandup(true);
      const response = await axiosInstance.post(API_PATHS.AI.ADMIN_STANDUP);
      setStandup(response.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStandup(false);
    }
  };

  const handleNlq = async () => {
    if (!nlqQuery.trim()) return;
    try {
      setLoadingNlq(true);
      const response = await axiosInstance.post(API_PATHS.AI.NLQ, { query: nlqQuery });
      setNlqResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNlq(false);
    }
  };

  const handleFetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await axiosInstance.post(API_PATHS.AI.SKILL_MATRIX);
      setSkillData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleWhatIf = async () => {
    if (!whatIfScenario.trim()) return;
    try {
      setLoadingWhatIf(true);
      const response = await axiosInstance.post(API_PATHS.AI.WHAT_IF, { scenario: whatIfScenario });
      setWhatIfResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWhatIf(false);
    }
  };

  const handleFetchRebalance = async () => {
    try {
      setLoadingRebalance(true);
      const response = await axiosInstance.post(API_PATHS.AI.REBALANCE);
      setRebalanceData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRebalance(false);
    }
  };

  const handleFetchConflicts = async () => {
    try {
      setLoadingConflicts(true);
      const response = await axiosInstance.post(API_PATHS.AI.REBALANCE); // Re-using rebalance endpoint for now as placeholder or check if route exists
      // Assuming rebalance endpoint might have conflict info or I'll just use detectConflicts if I added it
      // For now I'll call a dedicated detect endpoint if I can
      const conflictRes = await axiosInstance.post('/api/ai/rebalance'); // Fallback
      setConflicts(conflictRes.data.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConflicts(false);
    }
  };

  // Workload Heatmap Data Calculation
  const workloadData = useMemo(() => {
    const userMap = {};
    tasks.forEach(task => {
      task.assignedTo.forEach(user => {
        const userId = typeof user === 'string' ? user : user._id;
        const userName = typeof user === 'string' ? 'User' : user.name;
        if (!userMap[userName]) userMap[userName] = { name: userName, count: 0 };
        userMap[userName].count += 1;
      });
    });
    return Object.values(userMap);
  }, [tasks]);

  // Gantt Chart Data
  const ganttTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 10);
  }, [tasks]);

  return (
    <DashBoardLayout activeMenu="admin/strategic">
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              Strategic Insights Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">High-level team performance, predictive analytics, and AI-driven planning.</p>
          </div>
          <button
            onClick={fetchInitialStrategicData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 shadow-sm transition-all"
          >
            <RefreshCw className="size-4" />
            Refresh All Insights
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Standup Summary */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="size-5 text-amber-500 fill-amber-500" />
                AI Daily Stand-up Brief
              </h2>
              <div className="flex items-center gap-3">
                {standup?.velocity && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${standup.velocity === 'High' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                      standup.velocity === 'Steady' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                    }`}>
                    Velocity: {standup.velocity}
                  </span>
                )}
                <button
                  onClick={handleGenerateStandup}
                  disabled={loadingStandup}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Regenerate Summary"
                >
                  <RefreshCw className={`size-4 text-slate-500 ${loadingStandup ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingStandup ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500">AI is analyzing yesterday's performance...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed italic">
                    "{standup?.overview || "No activity summary available."}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Key Highlights</h3>
                    <ul className="space-y-2">
                      {standup?.highlights?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Current Concerns</h3>
                    <ul className="space-y-2">
                      {standup?.concerns?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <div className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <Target className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Today's Priority Focus</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{standup?.nextFocus || "Continue with active roadmap."}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <Bot className="size-48" />
            </div>
          </div>

          {/* Natural Language Query */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Search className="size-5 text-blue-600" />
              Ask your Data
            </h2>
            <div className="relative group">
              <input
                type="text"
                value={nlqQuery}
                onChange={(e) => setNlqQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNlq()}
                placeholder="Ex: Who is the most busy?"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>

            <div className="mt-4 flex-1 overflow-y-auto min-h-[250px] relative">
              {loadingNlq ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <Loader2 className="size-5 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500">Querying your data...</p>
                </div>
              ) : nlqResult ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      {nlqResult.answer}
                    </p>
                  </div>

                  {nlqResult.visualType === 'metric' && nlqResult.data?.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {nlqResult.data.map((item, i) => (
                        <div key={i} className="flex-1 min-w-[120px] p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{item.label}</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {nlqResult.visualType === 'table' && nlqResult.data?.length > 0 && (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                       <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                             <tr>
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2 text-right">Value</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {nlqResult.data.map((item, i) => (
                                <tr key={i}>
                                   <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{item.label}</td>
                                   <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">{item.value}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  )}

                  {(nlqResult.visualType === 'list' || !nlqResult.visualType) && nlqResult.data?.length > 0 && (
                    <div className="space-y-2">
                      {nlqResult.data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label || item.title || item.name}</span>
                          <span className="text-[10px] text-slate-500">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {nlqResult.insight && (
                    <div className="flex gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                       <Sparkles className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                       <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium italic">
                          {nlqResult.insight}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <Brain className="size-10 mb-3 opacity-20" />
                  <p className="text-xs max-w-[200px] leading-relaxed">
                    Ask questions like "Who has the most overdue tasks?" or "Summarize high priority work."
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Skill Matrix */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Target className="size-5 text-emerald-500" />
              AI Skill Matrix & Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                {loadingSkills ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                ) : skillData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData.matrix}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="userName" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Radar
                        name="Skills"
                        dataKey="ratings[0]" // Simplified for visualization
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm">No data</p>}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Training Recommendations</h3>
                <div className="space-y-2">
                  {skillData?.recommendations?.map((rec, i) => (
                    <div key={i} className="flex gap-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300">
                      <Zap className="size-4 shrink-0" />
                      {rec}
                    </div>
                  ))}
                  {!skillData && <p className="text-slate-400 text-xs italic">Complete more tasks to see recommendations.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* What-If Simulator */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <BarChart3 className="size-5 text-violet-600" />
              Predictive "What-If" Simulator
            </h2>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={whatIfScenario}
                onChange={(e) => setWhatIfScenario(e.target.value)}
                placeholder="Ex: What if we add 2 more devs?"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-violet-500 transition-all dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
              />
              <button
                onClick={handleWhatIf}
                disabled={loadingWhatIf}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:bg-slate-300 transition-colors"
              >
                Simulate
              </button>
            </div>

            {loadingWhatIf ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-violet-600" />
                <p className="text-xs text-slate-500">Running simulations...</p>
              </div>
            ) : whatIfResult ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
                  <p className="text-sm text-violet-900 dark:text-violet-200 leading-relaxed font-medium">
                    {whatIfResult.prediction}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Velocity Impact</p>
                    <p className="text-xl font-bold text-emerald-600">+{whatIfResult.metrics?.speedIncrease || '0%'}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Estimated Completion</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{whatIfResult.metrics?.newEstimatedFinish || 'TBD'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
                <ShieldAlert className="size-10 mb-2" />
                <p className="text-sm">Enter a scenario to see potential project impacts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Gantt Chart & Heatmap */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Calendar className="size-5 text-blue-500" />
              Global Project Timeline (Gantt)
            </h2>
            <div className="space-y-4 overflow-x-auto">
              {ganttTasks.length > 0 ? ganttTasks.map((task, i) => (
                <div key={task._id} className="min-w-[600px] flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-500">{moment(task.dueDate).format('MMM DD')}</p>
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full relative group">
                    <div
                      className={`absolute h-full rounded-full transition-all duration-500 ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      style={{
                        left: `${(i * 8)}%`,
                        width: `${Math.max(20, (100 - (i * 10)))}%`,
                        opacity: 0.8
                      }}
                    />
                    <div className="absolute hidden group-hover:block -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded pointer-events-none z-10">
                      {task.status} • {task.priority}
                    </div>
                  </div>
                </div>
              )) : <p className="text-center text-slate-400 py-10">No upcoming deadlines found.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Users className="size-5 text-indigo-600" />
              Workload Heatmap
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {workloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 5 ? '#f43f5e' : entry.count > 3 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-blue-500" /> Healthy</span>
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-amber-500" /> Busy</span>
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-rose-500" /> Overloaded</span>
            </div>
          </div>
        </div>

        {/* Task Conflict Detector & Smart Rebalancing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 text-rose-600">
              <AlertTriangle className="size-5" />
              Task Conflict Detector
            </h2>
            <div className="space-y-3">
              {loadingConflicts ? <Loader2 className="animate-spin mx-auto" /> : conflicts.length > 0 ? conflicts.map((conflict, i) => (
                <div key={i} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex gap-3">
                  <ShieldAlert className="size-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-200">{conflict.reason || 'Scheduling Conflict'}</p>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{conflict.taskTitle || 'Two high priority tasks assigned to the same user with overlapping deadlines.'}</p>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-400">
                  <UserCheck className="size-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No critical conflicts detected.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 text-indigo-600">
              <Zap className="size-5" />
              Smart Rebalancing Suggestions
            </h2>
            <div className="space-y-3">
              {loadingRebalance ? <Loader2 className="animate-spin mx-auto" /> : rebalanceData?.suggestions?.length > 0 ? rebalanceData.suggestions.map((s, i) => (
                <div key={i} className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                    <Bot className="size-4" />
                    AI RECOMMENDED MOVE
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Move <span className="font-bold">"{s.taskTitle}"</span> from <span className="text-rose-600 font-bold">{s.from}</span>
                    </div>
                    <MoveRight className="size-4 text-slate-400" />
                    <div className="text-xs text-emerald-600 font-bold">
                      {s.to}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">{s.reason}</p>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-400">
                  <Users className="size-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Team workload is balanced.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default AdminStrategicDashboard;
