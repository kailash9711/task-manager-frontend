import React, { useContext } from 'react'
import { UserContext } from '../../context/UserContext';
import NavBar from '../ui/NavBar';
import Slide from '../ui/Slide';
import MobileTabs from '../ui/MobileTabs';

const DashBoardLayout = ({children,activeMenu}) => {
  const { user, clearUser } = useContext(UserContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearUser();
  };

  return (
    <div className='min-h-screen bg-slate-50 pt-16 dark:bg-slate-950'>
      <NavBar />

      {user && (
        <>
          <MobileTabs user={user} activeMenu={activeMenu} onLogout={handleLogout} />
          <div className='flex min-h-[calc(100vh-64px)]'>
            <div className='hidden w-72 shrink-0 lg:block'>
              <Slide activeMenu={activeMenu} />
            </div>
            <main className='w-full p-4 text-sm md:p-5'>
              {children}
            </main>
          </div>
        </>
      )}
      
    </div>
  
  )
}

export default DashBoardLayout