import React, { useContext, useState } from 'react'
import { AlertCircle, LoaderCircle, Lock, Mail } from 'lucide-react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Link, useNavigate } from 'react-router'
import { validateEmail } from '../../utils/helper'
import { API_PATHS } from '../../utils/apiPaths'
import axiosInstance from '../../utils/axiosInstance'
import { UserContext } from '../../context/UserContext'



const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const {updateUser} = useContext(UserContext)

  const getErrorMessage = (apiError, fallbackMessage) => {
    return apiError?.response?.data?.message || apiError?.message || fallbackMessage
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('')

    if(!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if(!password.trim()) {
      setError('Please enter your password.')
      return
    }

    try {
      setIsSubmitting(true)
      // Make API call to login endpoint
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password })

      const { token, role } = response.data
      if(token) {
          localStorage.setItem('token', token)
          updateUser(response.data)

          if(role === 'admin') {
            navigate('/dashboard')
          } else {
            navigate('/user-dashboard')
          }
          } 



    } catch (error) {
      const message = getErrorMessage(error, 'Unable to sign in right now. Please try again.')
      setError(message)
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
    
  }

    
  return (
    <AuthLayout>
      <div className='space-y-10'>
        <div className='space-y-4 text-center lg:text-left'>
          <p className='text-xs font-bold uppercase tracking-[0.3em] text-blue-500'>Welcome back</p>
          <h3 className='text-4xl font-bold tracking-tight text-slate-900 dark:text-white xl:text-5xl'>Sign in to your workspace</h3>
          <p className='mx-auto max-w-md text-base leading-relaxed text-slate-500 lg:mx-0 dark:text-slate-400'>
            Enter your credentials to access your personalized dashboard and continue your progress.
          </p>
        </div>

        {error && (
          <div className='flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 backdrop-blur-sm dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200' role='alert'>
            <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className='flex flex-col gap-6'>
          <div className='space-y-2'>
            <label className='text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300'>Email address</label>
            <div className='group relative'>
              <div className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500'>
                <Mail className='h-5 w-5' />
              </div>
              <input
                className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pl-12 text-slate-900 dark:text-white outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-blue-900/20'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                type='email'
                placeholder='you@example.com'
                autoComplete='email'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300'>Password</label>
              <button type='button' className='text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400'>Forgot password?</button>
            </div>
            <div className='group relative'>
              <div className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500'>
                <Lock className='h-5 w-5' />
              </div>
              <input
                className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pl-12 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/20'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                type='password'
                placeholder='Your password'
                autoComplete='current-password'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-950/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500 dark:hover:shadow-blue-900/40'
          >
            <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full' />
            {isSubmitting ? (
              <LoaderCircle className='h-5 w-5 animate-spin' />
            ) : (
              <span>Sign in to your account</span>
            )}
          </button>

          <p className='text-center text-sm text-slate-500 dark:text-slate-400'>
            Don't have an account?{' '}
            <Link to='/signup' className='font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400'>
              Create one for free
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login
