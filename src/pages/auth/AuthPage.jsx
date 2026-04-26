import React, { useContext, useState, useEffect } from 'react';
import { AlertCircle, LoaderCircle, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import AuthLayout from '../../components/layouts/AuthLayout';
import { validateEmail } from '../../utils/helper';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import { UserContext } from '../../context/UserContext';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminInvitation, setAdminInvitation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
    setError('');
  }, [location.pathname]);

  const toggleAuth = () => {
    const newPath = isLogin ? '/signup' : '/login';
    navigate(newPath);
  };

  const getErrorMessage = (apiError, fallbackMessage) => {
    return apiError?.response?.data?.message || apiError?.message || fallbackMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim() || (!isLogin && password.length < 8)) {
      setError(isLogin ? 'Please enter your password.' : 'Password must be at least 8 characters long.');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setError('Please enter your name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isLogin ? API_PATHS.AUTH.LOGIN : API_PATHS.AUTH.REGISTER;
      const payload = isLogin
        ? { email, password }
        : { name: fullName, email, password, adminInvitation };

      const response = await axiosInstance.post(endpoint, payload);
      const { token, role } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        updateUser(response.data);
        navigate(role === 'admin' ? '/dashboard' : '/user-dashboard');
      }
    } catch (error) {
      const fallback = isLogin
        ? 'Unable to sign in right now. Please try again.'
        : 'Unable to create your account right now. Please try again.';
      setError(getErrorMessage(error, fallback));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-4">
        {/* Toggle Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => navigate('/login')}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition-all ${isLogin
                  ? 'bg-white text-blue-600 shadow-md dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition-all ${!isLogin
                  ? 'bg-white text-blue-600 shadow-md dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white xl:text-3xl">
              {isLogin ? 'Welcome back' : 'Join the workspace'}
            </h3>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isLogin
                ? 'Enter your credentials to continue.'
                : 'Create your account in seconds.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 backdrop-blur-sm dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`flex flex-col ${isLogin ? 'gap-5' : 'gap-3.5'}`}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <UserRound className="h-4.5 w-4.5" />
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 pl-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/20"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  placeholder="Jane Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
            <div className="group relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 pl-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
              {isLogin && <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Forgot?</button>}
            </div>
            <div className="group relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 pl-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder={isLogin ? "Your password" : "Min. 8 characters"}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invite Code (Optional)</label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 pl-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/20"
                  value={adminInvitation}
                  onChange={(e) => setAdminInvitation(e.target.value)}
                  type="text"
                  placeholder="For admin access"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative mt-1 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-950/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500 dark:hover:shadow-blue-900/40"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
            {isSubmitting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <span>{isLogin ? 'Sign in to account' : 'Create free account'}</span>
            )}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={toggleAuth}
              className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isLogin ? 'Sign up now' : 'Log in instead'}
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AuthPage;
