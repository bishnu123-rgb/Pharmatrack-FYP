import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/api";
import { Lock, Loader2, ArrowLeft, HeartPulse, CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err?.message || "Failed to reset password. Link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden font-sans">
            {/* ── Left Panel ─────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-50 to-emerald-50 relative overflow-hidden flex-col p-20 justify-between">
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-white/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[80px]" />

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
                        <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                            Security <br />
                            <span className="text-indigo-600">Restored</span>.
                        </h1>
                        <p className="text-slate-600 text-xl font-medium max-w-md leading-relaxed">
                            Create a strong new password to protect your account and pharmaceutical data.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p className="text-slate-900 font-extrabold text-sm">Update Securely</p>
                            <p className="text-slate-500 text-xs font-bold mt-0.5">Passwords are never stored in plain text</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Panel (Form) ──────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-white relative">
                <div className="w-full max-w-md space-y-10">

                    <Link to="/login" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors gap-2">
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>

                    <div className="space-y-3">
                        <div className="w-12 h-1 bg-indigo-600 rounded-full mb-6" />
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Reset Password</h3>
                        <p className="text-slate-500 text-base lg:text-lg font-bold">
                            Choose a strong password for your Pharmacy account.
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-16 pr-14 py-4 sm:py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all duration-300 shadow-sm"
                                        placeholder="New Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-16 pr-6 py-4 sm:py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all duration-300 shadow-sm"
                                        placeholder="Confirm Password"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-sm font-bold text-center shadow-sm">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={22} />
                                ) : (
                                    <>Reset Password</>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-12 px-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-emerald-500 mb-6 border border-emerald-50 shadow-sm">
                                <CheckCircle size={44} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Password Reset!</h2>
                            <p className="text-slate-500 font-bold leading-relaxed text-base">
                                Your password has been updated securely.<br />Taking you to the login screen…
                            </p>
                        </div>
                    )}
                </div>

                <div className="hidden sm:block absolute bottom-8 lg:bottom-10 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center w-full left-0 opacity-40">
                    PharmaTrack — Pharmacy Management Portal
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
