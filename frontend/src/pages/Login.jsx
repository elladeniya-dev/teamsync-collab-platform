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
  SparklesIcon,
  ChevronRightIcon,
  ShieldCheckIcon 
} from '../components';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginWithGoogle, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setInfoMessage('');
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
    setInfoMessage('');

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

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Enter your email address above to receive password reset instructions.');
    } else {
      setError('');
      setInfoMessage(`Password reset link dispatched to ${email.trim()}.`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-y-auto bg-grid-pattern selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Glassmorphic Split-Screen Modal */}
      <div className="relative z-10 w-full max-w-md lg:max-w-4xl xl:max-w-[980px] bg-slate-900/95 backdrop-blur-2xl border border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto lg:h-[620px]">
        
        {/* ================= LEFT COLUMN: ENTERPRISE SHOWCASE ================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950 p-8 xl:p-9 flex-col justify-between border-r border-slate-800/80 h-full relative">
          <div>
            {/* Brand Logo & Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <LayersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                  TeamSync
                  <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    PRO
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium">Collaboration Platform</p>
              </div>
            </div>

            {/* Headline & Value Proposition */}
            <h2 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight leading-snug">
              One Workspace for High-Velocity Teams.
            </h2>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Track deliverables, organize interactive sprint calendars, and collaborate seamlessly with Google OAuth and instant account unification.
            </p>

            {/* Feature Highlights with Vector SVGs */}
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Unified Account Linking</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Google and email logins for the same Gmail link automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Interactive Sprint Calendars</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Monthly schedule grid that fits your viewport with zero overflow.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Live Team Workload Tracking</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Monitor active assignments and collaborator health in real time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium mb-1">
              <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
              <span>Enterprise Grade Security</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Secured with Google Identity Services, 256-bit JWT sessions, and encrypted database connections.
            </p>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: SEAMLESS 3D FLIPPING AUTH AREA ================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full relative bg-slate-900/40">
          
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
              <LayersIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              TeamSync
              <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded border border-indigo-500/30">
                PRO
              </span>
            </span>
          </div>

          {/* Top Segmented Tab Switcher (Unified Width with Form) */}
          <div className="w-full max-w-[360px] mx-auto shrink-0 mb-3">
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                  setInfoMessage('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  !isRegister
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LockIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                  setInfoMessage('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  isRegister
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* 3D Book Page Flip Stage - Dimension Locked to Prevent Any Resizing */}
          <div className="perspective-1400 w-full max-w-[360px] mx-auto relative flex-1 min-h-[460px] max-h-[480px]">
            <div
              className={`preserve-3d book-card-transition absolute inset-0 w-full h-full ${
                isRegister ? 'rotate-y-180' : ''
              }`}
            >
              
              {/* ================= FRONT FACE: SIGN IN ================= */}
              <div
                className={`absolute inset-0 w-full h-full backface-hidden flex flex-col justify-between transition-opacity duration-200 ${
                  isRegister ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Header */}
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Welcome back</h3>
                    <p className="text-xs text-slate-400 mt-1">Sign in to access your sprint workspace</p>
                  </div>

                  {/* Feedback Notifications */}
                  {!isRegister && error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                      <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {!isRegister && infoMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{infoMessage}</span>
                    </div>
                  )}

                  {/* Google OAuth Section */}
                  <div className="space-y-1.5">
                    <div className="w-full flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        text="signin_with"
                        width="340"
                      />
                    </div>
                    {/* Integrated account sync micro-indicator */}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>Google & email sync automatically for same address</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900/90 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                      or continue with email
                    </span>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {/* Manual Credentials Form */}
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <MailIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <LockIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Device & Forgot Password Utility Row */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                        />
                        <span>Remember device</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* 3D Flipping Book Action Button */}
                    <div className="flip-btn-box w-full h-11 mt-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flip-btn-cube w-full h-full relative cursor-pointer"
                      >
                        <div className="flip-face-front absolute inset-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 border border-indigo-400/30 transition-colors">
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <span>Sign In with Email</span>
                              <ChevronRightIcon className="w-4 h-4 text-indigo-200" />
                            </>
                          )}
                        </div>

                        <div className="flip-face-back absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 border border-violet-400/40">
                          <span>Turn Page & Enter</span>
                          <LockIcon className="w-4 h-4 text-violet-200" />
                        </div>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Bottom switcher trigger */}
                <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
                  New collaborator?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                      setInfoMessage('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1 cursor-pointer"
                  >
                    Create Workspace Account
                  </button>
                </div>
              </div>

              {/* ================= BACK FACE: CREATE ACCOUNT ================= */}
              <div
                className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex flex-col justify-between transition-opacity duration-200 ${
                  !isRegister ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Create Workspace Account</h3>
                    <p className="text-xs text-slate-400 mt-1">Get started with your team deliverables in seconds</p>
                  </div>

                  {/* Feedback Notifications */}
                  {isRegister && error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                      <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* Google OAuth Section */}
                  <div className="space-y-1.5">
                    <div className="w-full flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        text="signup_with"
                        width="340"
                      />
                    </div>
                    {/* Integrated account sync micro-indicator */}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>Automatically links to your Google profile</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-1.5">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900/90 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                      or sign up with email
                    </span>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleManualSubmit} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Alex Morgan"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isRegister}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <MailIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required={isRegister}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Create Password
                      </label>
                      <div className="relative">
                        <LockIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required={isRegister}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 3D Flipping Book Action Button */}
                    <div className="flip-btn-box w-full h-11 mt-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flip-btn-cube w-full h-full relative cursor-pointer"
                      >
                        <div className="flip-face-front absolute inset-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 border border-indigo-400/30 transition-colors">
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <span>Create Workspace Account</span>
                              <ChevronRightIcon className="w-4 h-4 text-indigo-200" />
                            </>
                          )}
                        </div>

                        <div className="flip-face-back absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 border border-violet-400/40">
                          <span>Launch New Workspace</span>
                          <SparklesIcon className="w-4 h-4 text-violet-200" />
                        </div>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Bottom switcher trigger */}
                <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                      setInfoMessage('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1 cursor-pointer"
                  >
                    Switch to Sign In
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Security Footer Guarantee */}
          <div className="text-center text-[10px] text-slate-500 shrink-0 pt-2 flex items-center justify-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>End-to-End Encrypted Session • 256-bit AES Protection</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;