import { useUserAuth } from '../../hooks/useUserAuth';
import { useContext, useEffect, useState } from 'react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router';
import moment from 'moment';
import { addThousandsSeparator } from '../../utils/helper';
import { ArrowRight, CalendarDays, CheckCircle2, CircleDot, ListChecks } from 'lucide-react';
import TaskTable from '../../components/cards/TaskTable';
import CustomPie from '../../components/cards/CustomPie';
import CustomBar from '../../components/cards/CustomBar';

const COLORS = ['#4F46E5', '#EC4899', '#F59E0B'];
const DashBoard = () => {
  useUserAuth();

const { user } = useContext(UserContext);
const navigate = useNavigate();
const [dashboardData, setDashboardData] = useState(null);
const [pieChartData, setPieChartData] = useState([]);
const [barChartData, setBarChartData] = useState([]);

const onSeeMore = () => {
  navigate('/admin/tasks')
}

const onTaskClick = (task) => {
  if (!task?._id) return;
  navigate('/create-task', { state: { taskId: task._id } });
}

const prepareChartData = (data) => { 
  const taskDistribution = data?.taskDistribution || null;
  const taskPriorityLevels = data?.taskPriorityLevels || null;

  const taskDistributionData = [
    { status: 'pending', count: taskDistribution?.pending || 0 },
    { status: 'in_progress', count: taskDistribution?.in_progress || 0 },
    { status: 'completed', count: taskDistribution?.completed || 0 },
  ];

  setPieChartData(taskDistributionData);

  const priorityLevelsData = [
    { priority: 'low', count: taskPriorityLevels?.low || 0 },
    { priority: 'medium', count: taskPriorityLevels?.medium || 0 },
    { priority: 'high', count: taskPriorityLevels?.high || 0 },
  ];

  setBarChartData(priorityLevelsData);
}



useEffect(() => {
  let isMounted = true;

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
      if (isMounted && response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  fetchDashboardData();

  return () => {
    isMounted = false;
  };
}, [])

  return (
    <DashBoardLayout activeMenu="dashboard" >
      <div className="space-y-6">
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100'>Welcome, {user?.name}</h1>
            <p className='text-slate-600 dark:text-slate-300'>Here is your live task performance overview.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm w-fit dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <CalendarDays className="size-4" />
            {moment().format('MMMM Do YYYY')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">All Tasks</p>
              <ListChecks className="size-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{addThousandsSeparator(dashboardData?.charts?.taskDistribution?.All || 0)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Completed</p>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{addThousandsSeparator(dashboardData?.charts?.taskDistribution?.completed || 0)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">In Progress</p>
              <CircleDot className="size-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{addThousandsSeparator(dashboardData?.charts?.taskDistribution?.in_progress || 0)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold dark:text-slate-400">Pending</p>
              <CircleDot className="size-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 dark:text-slate-100">{addThousandsSeparator(dashboardData?.charts?.taskDistribution?.pending || 0)}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <CustomPie 
              data={pieChartData}
              colors={COLORS}
            />
          </div>

          <div>
            <CustomBar
              data ={barChartData}
              colors={COLORS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide dark:text-slate-300">
                Recent Tasks
              </p>

              <button onClick={onSeeMore} className="text-slate-800 font-medium flex items-center gap-1 dark:text-slate-100">
                See all <ArrowRight className="text-blue-600 size-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto pr-1">
              <TaskTable tableData={dashboardData?.recentTasks || []} onTaskClick={onTaskClick} />
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Showing 5 tasks at a time. Scroll to view older recent tasks.</p>
          </div>
        </div>

      </div>
    </DashBoardLayout>
   
  )
}


export default DashBoard;
