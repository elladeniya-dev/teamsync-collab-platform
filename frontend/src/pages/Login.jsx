import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { 
  LayersIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  MailIcon, 
  LockIcon, 
  UserIcon, 
  EyeIcon, 
  EyeOffIcon,
  SparklesIcon 
} from '../components';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginWithGoogle, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setSubmitting(true);
      await loginWithGoogle(credentialResponse.credential);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Google Auth Failed:', err);
      setError(
        err.response?.data?.error || 'Google authentication failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed.');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isRegister && !name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    try {
      setSubmitting(true);
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Auth Error:', err);
      setError(
        err.response?.data?.error ||
          'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-grid-pattern selection:bg-indigo-500 selection:text-white">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Side: Product Showcase (Visible on Large Screens) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/70 relative">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <LayersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  TeamSync
                  <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    PRO
                  </span>
                </span>
                <p className="text-xs text-slate-400">Collaboration Platform</p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              One Workspace for High-Velocity Teams.
            </h2>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Track deliverables, organize interactive sprint calendars, and collaborate with your team with seamless Google OAuth and instant account unification.
            </p>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Unified Account Linking</h4>
                  <p className="text-[11px] text-slate-400">Google and email logins for the same Gmail link automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Interactive Sprint Calendars</h4>
                  <p className="text-[11px] text-slate-400">Monthly schedule grid that fits your viewport with zero overflow.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Live Team Workload Tracking</h4>
                  <p className="text-[11px] text-slate-400">Monitor active assignments and collaborator health in real time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial / Social proof snippet */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-1">
              <SparklesIcon className="w-4 h-4" />
              <span>Enterprise Grade Security</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Secured with Google Identity Services, 256-bit JWT sessions, and encrypted database connections.
            </p>
          </div>
        </div>

        {/* Right Side: The 3D Book-Flipping Auth Interface */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          
          {/* Top Segmented Book Tab Switcher */}
          <div className="max-w-md mx-auto w-full mb-6">
            <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center relative">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  !isRegister
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📘</span>
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  isRegister
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📖</span>
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* 3D Book Page Flip Perspective Container */}
          <div className="perspective-1400 w-full max-w-md mx-auto">
            <div
              className={`preserve-3d book-card-transition relative w-full ${
                isRegister ? 'rotate-y-180' : ''
              }`}
              style={{ minHeight: isRegister ? '510px' : '470px' }}
            >
              
              {/* ================= FRONT FACE: SIGN IN ================= */}
              <div
                className={`backface-hidden w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between transition-opacity duration-300 ${
                  isRegister ? 'pointer-events-none opacity-0 absolute inset-0' : 'relative opacity-100'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Welcome back</h3>
                    <p className="text-xs text-slate-400 mt-1">Sign in to resume your team deliverables</p>
                  </div>

                  {/* Error Notification */}
                  {!isRegister && error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* Google OAuth Button */}
                  <div className="flex justify-center w-full pt-1">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      text="signin_with"
                      width="350"
                    />
                  </div>

                  {/* Divider with guaranteed whitespace-nowrap */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap shrink-0">
                      or continue with email
                    </span>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleManualSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <MailIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <LockIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 3D Flipping Book Action Button */}
                    <div className="flip-btn-box w-full h-11 mt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flip-btn-cube w-full h-full relative cursor-pointer"
                      >
                        {/* Front Face of the Button */}
                        <div className="flip-face-front absolute inset-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 border border-indigo-400/30">
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <span>Sign In with Email</span>
                              <span className="text-indigo-200">➔</span>
                            </>
                          )}
                        </div>

                        {/* Back Face of the Button (Revealed on 3D Flip) */}
                        <div className="flip-face-back absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 border border-violet-400/40">
                          <span>📖 Turn Page & Enter</span>
                          <span>✨</span>
                        </div>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Bottom switcher trigger */}
                <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                  New collaborator?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
                  >
                    Flip to Register 📖
                  </button>
                </div>
              </div>

              {/* ================= BACK FACE: REGISTER / CREATE ACCOUNT ================= */}
              <div
                className={`backface-hidden rotate-y-180 w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between transition-opacity duration-300 ${
                  !isRegister ? 'pointer-events-none opacity-0 absolute inset-0' : 'relative opacity-100'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Create Workspace Account</h3>
                    <p className="text-xs text-slate-400 mt-1">Get started with your team deliverables in seconds</p>
                  </div>

                  {/* Error Notification */}
                  {isRegister && error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* Google OAuth Button */}
                  <div className="flex justify-center w-full pt-1">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      text="signup_with"
                      width="350"
                    />
                  </div>

                  {/* Divider with guaranteed whitespace-nowrap */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap shrink-0">
                      or sign up with email
                    </span>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Alex Morgan"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isRegister}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <MailIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required={isRegister}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Create Password
                      </label>
                      <div className="relative">
                        <LockIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required={isRegister}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 3D Flipping Book Action Button */}
                    <div className="flip-btn-box w-full h-11 mt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flip-btn-cube w-full h-full relative cursor-pointer"
                      >
                        {/* Front Face */}
                        <div className="flip-face-front absolute inset-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 border border-indigo-400/30">
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <span>Create Workspace Account</span>
                              <span className="text-indigo-200">➔</span>
                            </>
                          )}
                        </div>

                        {/* Back Face */}
                        <div className="flip-face-back absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 border border-violet-400/40">
                          <span>🚀 Launch New Workspace</span>
                          <span>✨</span>
                        </div>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Bottom switcher trigger */}
                <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
                  >
                    Flip to Sign In 📘
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Unified Account Callout */}
          <div className="max-w-md mx-auto w-full mt-4 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-center gap-2 text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Same Gmail address? Google & email logins sync to the same profile.</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
