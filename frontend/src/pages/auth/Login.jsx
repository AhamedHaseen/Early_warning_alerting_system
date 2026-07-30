import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Activity, ShieldCheck, GraduationCap, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, user, role } = useAuth();
  const navigate = useNavigate();

  const roles = ['Students', 'Lecturers', 'Admins'];
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // We only auto-redirect if a valid role is present
    if (user && role) {
      navigate(`/${role}`);
    }
  }, [user, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await login(email, password);
      if (authError) throw authError;

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: 'Login successful'
      });
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      
      {/* Left side branding / Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white flex-col justify-center relative overflow-hidden p-12">
        {/* Floating Icons Background */}
        <div className="absolute top-[10%] left-[15%] text-white/10 animate-bounce" style={{animationDuration: '3s'}}>
          <BookOpen size={64} />
        </div>
        <div className="absolute bottom-[20%] right-[10%] text-white/10 animate-pulse">
          <Activity size={96} />
        </div>
        <div className="absolute top-[30%] right-[20%] text-white/10 animate-bounce" style={{animationDuration: '4s'}}>
          <Users size={48} />
        </div>
        <div className="absolute bottom-[30%] left-[20%] text-white/10 animate-pulse">
          <ShieldCheck size={80} />
        </div>
        <div className="absolute top-[60%] left-[40%] text-white/10 animate-bounce" style={{animationDuration: '5s'}}>
          <GraduationCap size={72} />
        </div>

        {/* Decorative blur blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md mb-8 border border-white/20 shadow-2xl">
            <GraduationCap className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
            Early Warning Academic System
          </h1>
          <p className="text-xl text-blue-200/80 leading-relaxed font-light mb-8">
            Identify at-risk students, track attendance, and provide timely interventions to ensure academic success.
          </p>
          
          <div className="flex items-center space-x-3 text-2xl font-semibold">
            <span className="text-white/70">Built for</span>
            <span className="text-blue-300 min-w-[120px] transition-all duration-300 ease-in-out">
              {roles[currentRoleIndex]}
            </span>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile background decor */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl lg:hidden"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl lg:hidden"></div>
        
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white relative z-10">
          
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 mb-4 shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Early Warning System</h1>
            <p className="text-slate-500 mt-2 text-sm">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pb-2">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/30 disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
