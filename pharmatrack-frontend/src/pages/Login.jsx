import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { Lock, User, Loader2, ArrowRight, HeartPulse, ShieldCheck, Activity, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(username, password);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">

      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-50 to-emerald-50 relative overflow-hidden flex-col p-20 justify-between">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-white/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-20">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 border border-indigo-50">
              <HeartPulse className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Pharma<span className="text-indigo-600">Track</span>
            </h2>
          </div>

          <div className="space-y-8 mt-10">
            <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
              Caring for your <br />
              <span className="text-indigo-600">Pharmacy</span> <br />
              Operations.
            </h1>
            <p className="text-slate-600 text-xl font-medium max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
              A simple, powerful way to manage medicines and help your clinic run smoothly every single day.
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="relative z-10 flex gap-10 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-700">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-50">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-slate-900 font-extrabold text-sm">Live Updates</p>
              <p className="text-slate-500 text-xs font-bold mt-0.5">Track stock as it happens</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-slate-900 font-extrabold text-sm">Safe & Secure</p>
              <p className="text-slate-500 text-xs font-bold mt-0.5">Reliable data protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ──────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md space-y-10 lg:space-y-12 py-10 lg:py-0">

          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <HeartPulse className="text-emerald-500" size={22} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">
              Pharma<span className="text-indigo-600">Track</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <div className="w-12 h-1 bg-indigo-600 rounded-full mb-6" />
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Sign In</h3>
            <p className="text-slate-500 text-base lg:text-lg font-bold">
              Welcome back! Please enter your details below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username / Email */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username or Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 sm:py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all duration-300 shadow-sm"
                  placeholder="e.g. bishnu_01 or user@example.com"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password with show/hide toggle */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-14 py-4 sm:py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all duration-300 shadow-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end pr-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>


            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-sm font-bold text-center shadow-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  Sign In to PharmaTrack
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="pt-2 text-center">
            <p className="text-slate-500 font-bold">
              New to the team?{" "}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-200 underline-offset-8">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer watermark */}
        <div className="hidden sm:block absolute bottom-8 lg:bottom-10 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center w-full left-0 opacity-40">
          PharmaTrack — Pharmacy Management Portal
        </div>
      </div>
    </div>
  );
};

export default Login;
