import { ArrowRight, BookOpen, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';

const Auth: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setError(null);

    try {
      if (isSignUp) {
        // Cycle/option are intentionally left unset here — the user picks them
        // in the Onboarding flow after their first sign-in. Previously this set
        // placeholder strings ('O_LEVEL' / 'SCIENCE') that didn't match any real
        // Cycle/Option enum value, which permanently broke every new account:
        // fetchProfile would treat onboarding as already complete, then crash
        // indexing SUBJECTS_CONFIG with the bogus keys, leaving the profile
        // fetch silently failing on every future login.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        showToast('Registration Successful. Please check your email to verify your account.', 'success');
      } else {
        // signIn function logic from reference
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl shadow-inner">
              <BookOpen className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-center text-slate-900 dark:text-white mb-2 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-lg">
            {isSignUp ? 'Join Study Helplanner' : 'Sign in to Study Helplanner'}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl border-2 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-0 outline-none transition-all ${
                      errors.fullName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-slate-100 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500'
                    }`}
                    placeholder="Enter your name"
                    required={isSignUp}
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fullName}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-11 pr-4 py-4 rounded-2xl border-2 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-0 outline-none transition-all ${
                    errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-100 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500'
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-12 py-4 rounded-2xl border-2 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-0 outline-none transition-all ${
                    errors.password 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-100 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500'
                  }`}
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-4 rounded-2xl border-2 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-0 outline-none transition-all ${
                      errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-slate-100 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500'
                    }`}
                    placeholder="Confirm your password"
                    required={isSignUp}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-lg">{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setErrors({});
                  setFullName('');
                  setConfirmPassword('');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
