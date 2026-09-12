import React, { useContext, useState } from "react";
import { Loader2 } from 'lucide-react'
import { validateEmail } from "../../utils/helper";
import { Link, useNavigate } from "react-router";
import AuthLayout from "../../components/layouts/AuthLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { UserContext } from "../../context/UserContext";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminInvitation, setAdminInvitation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const getErrorMessage = (apiError, fallbackMessage) => {
    return apiError?.response?.data?.message || apiError?.message || fallbackMessage
  }

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName,
        email,
        password,
        adminInvitation,
      });

      const { token, role } = response.data;
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        navigate(role === "admin" ? "/dashboard" : "/user-dashboard");
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to create your account right now. Please try again.')
      setError(message)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-medium tracking-tight">Create account</h2>
        </div>

        {error && (
          <div className="animate-fade-in rounded-lg bg-red-50 p-3 text-center text-sm text-red-500 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div>
            <input
              className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (error) setError("")
              }}
              type="text"
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          <div>
            <input
              className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError("")
              }}
              type="email"
              placeholder="Email address"
              autoComplete="email"
            />
          </div>

          <div>
            <input
              className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <input
              className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
              value={adminInvitation}
              onChange={(e) => {
                setAdminInvitation(e.target.value)
                if (error) setError("")
              }}
              type="text"
              placeholder="Admin invite code (optional)"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3.5 text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
