import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, resendCode, verifyEmail } from "../services/api";
import toast from "react-hot-toast";
import {
    User, Mail, Lock, Loader2, ArrowLeft, CheckCircle,
    HeartPulse, ShieldCheck, Eye, EyeOff, Check, X,
    Activity, Database, Scale, Shield, ArrowRight, Clock
} from "lucide-react";


/* ── Password Strength ───────────────────────────────────── */
const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
};
const strengthMeta = [
    { label: "Too Short", bar: "bg-rose-400", text: "text-rose-500" },
    { label: "Weak", bar: "bg-orange-400", text: "text-orange-500" },
    { label: "Fair", bar: "bg-yellow-400", text: "text-yellow-600" },
    { label: "Good", bar: "bg-emerald-400", text: "text-emerald-600" },
    { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-700" },
];

/* ── Role Card definitions ───────────────────────────────── */
const ROLES = [
    {
        value: "pharmacist",
        label: "Pharmacist",
        icon: <Shield size={28} />,
        desc: "Manages inventory, suppliers, batches & clinical data.",
        note: "Requires admin approval before login.",
        accent: "indigo",
    },
    {
        value: "staff",
        label: "Staff",
        icon: <Activity size={28} />,
        desc: "Handles sales, purchases & general repository use.",
        note: null,
        accent: "emerald",
    },
];

/* ── Privacy Policy Modal ────────────────────────────────────── */
const PolicyModal = ({ onClose }) => (
    <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(20px)" }}
        onClick={onClose}
    >
        <div
            className="bg-white w-full max-w-lg rounded-[1.75rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            style={{ maxHeight: "88vh" }}
            onClick={e => e.stopPropagation()}
        >
            {/* ── Header ── */}
            <div className="shrink-0 px-8 pt-8 pb-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-1.5">PharmaTrack Clinical System</p>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Privacy Policy</h2>
                        <p className="text-xs text-slate-400 font-bold mt-1">Effective Date: 20 February 2026 &nbsp;·&nbsp; Version 1.0</p>
                    </div>
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <Scale size={22} />
                    </div>
                </div>
                <p className="mt-4 text-[11px] text-slate-500 font-medium leading-relaxed border-l-2 border-indigo-300 pl-3 text-justify">
                    This Privacy Policy describes how PharmaTrack collects, uses, and protects personal information
                    provided during account registration and system use.
                </p>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                {/* Section 1 */}
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Database size={13} className="text-indigo-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">1. Information We Collect</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-9 text-justify">
                        Upon registration, we collect your <span className="font-bold text-slate-700">full name, username, email address, and professional role</span>.
                        This information is used solely for authentication, role-based access control, and system audit purposes.
                        No additional personal data is collected without your explicit consent.
                    </p>
                </div>

                <div className="border-t border-slate-50" />

                {/* Section 2 */}
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Shield size={13} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">2. Data Security</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-9 text-justify">
                        All passwords are <span className="font-bold text-slate-700">hashed using bcrypt</span> before storage - they are never stored in plain text.
                        System access is governed by <span className="font-bold text-slate-700">JWT-based authentication</span> with short-lived access tokens (15 minutes)
                        and rotating refresh tokens (7 days). Tokens are invalidated upon logout.
                    </p>
                </div>

                <div className="border-t border-slate-50" />

                {/* Section 3 */}
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Activity size={13} className="text-amber-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">3. Use of Data</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-9 text-justify">
                        Collected data is used exclusively for <span className="font-bold text-slate-700">system operations</span> - including identity verification,
                        access management, and activity logging. Your data is never sold, transferred, or disclosed to any third party under any circumstances.
                    </p>
                </div>

                <div className="border-t border-slate-50" />

                {/* Section 4 */}
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Scale size={13} className="text-slate-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">4. User Responsibilities</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-9 text-justify">
                        By creating an account, you agree to use PharmaTrack solely for legitimate pharmaceutical operations within your organisation.
                        <span className="font-bold text-slate-700"> All system actions are logged</span> and may be reviewed by authorised administrators for compliance and audit purposes.
                        Misuse of the system may result in account suspension.
                    </p>
                </div>

                <div className="border-t border-slate-50" />

                {/* Section 5 */}
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                            <User size={13} className="text-rose-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">5. Your Rights</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-9 text-justify">
                        You have the right to request access to, correction of, or deletion of your personal data at any time.
                        Account deactivation and data removal requests should be submitted to your system administrator.
                        We are committed to responding within a reasonable timeframe.
                    </p>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">PharmaTrack &copy; 2026</p>
                <button
                    onClick={onClose}
                    className="px-7 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
                >
                    I Accept &amp; Close
                </button>
            </div>
        </div>
    </div>
);

/* ── Register Component ──────────────────────────────────── */
const Register = () => {
    const [formData, setFormData] = useState({
        username: "", full_name: "", email: "",
        password: "", confirm_password: "", role_name: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [policyOpen, setPolicyOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState(false);
    const [verificationStage, setVerificationStage] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();


    const strengthen = getStrength(formData.password);
    const passwordsMatch = formData.confirm_password.length > 0 && formData.password.length > 0 && formData.password === formData.confirm_password;
    const passwordsMismatch = formData.confirm_password.length > 0 && formData.password !== formData.confirm_password;
    const update = (field, val) => setFormData(p => ({ ...p, [field]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
            toast.error("Access Restricted: Only @gmail.com addresses are permitted.");
            return;
        }
        if (!formData.role_name) { toast.error("Please select your professional role."); return; }
        if (formData.password !== formData.confirm_password) { toast.error("Passwords do not match."); return; }
        if (!acceptedTerms) { toast.error("You must accept the Privacy Policy to proceed."); return; }

        setLoading(true);
        try {
            const { confirm_password, ...submitData } = formData;
            const response = await registerUser(submitData);
            if (response.requiresVerification) {
                setVerificationStage(true);
                toast.success("Verification code sent to your Gmail!");
            } else {
                setSuccess(true);
                setTimeout(() => navigate("/login"), 2500);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            const data = await verifyEmail(formData.email, verificationCode);
            setSuccess(true);
            setVerificationStage(false);
            if (data.requiresApproval) {
                toast.success("Account created! Please wait for administrator approval before logging in.", { duration: 5000 });
            } else {
                toast.success("Account verified successfully! Redirecting to login...");
            }
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setResending(true);
        try {
            await resendCode(formData.email);
            setResendTimer(60);
            toast.success("New code sent! Check your Gmail.");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setResending(false);
        }
    };

    // Timer logic for resend button
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);


    const inputCls = "w-full py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-sm";

    return (
        <div className="min-h-screen bg-white flex overflow-hidden font-sans">

            {/* ── Left Panel ─────────────────────────────────── */}
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
                            Start helping <br />
                            <span className="text-indigo-600">lives</span> today.
                        </h1>
                        <p className="text-slate-600 text-xl font-medium max-w-md leading-relaxed">
                            Join the PharmaTrack network - built for care, safety, and operational excellence.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-50">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">Your Data is Safe</p>
                            <p className="text-slate-500 font-bold">Industry-standard JWT security.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-white relative overflow-y-auto">
                <div className="w-full max-w-md space-y-6 py-10 lg:py-12">

                    {/* Mobile-only logo */}
                    <div className="flex lg:hidden items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <HeartPulse className="text-emerald-500" size={22} />
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight">
                            Pharma<span className="text-indigo-600">Track</span>
                        </span>
                    </div>

                    <Link to="/login" className="inline-flex items-center text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors gap-2">
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>

                    <div className="space-y-2">
                        <div className="w-12 h-1 bg-indigo-600 rounded-full mb-4" />
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                            {verificationStage ? "Verify Identity" : "Create Account"}
                        </h3>
                        <p className="text-slate-500 text-base lg:text-lg font-bold">
                            {verificationStage
                                ? "Enter the 6-digit code sent to your Gmail."
                                : "Sign up with your @gmail.com account."}
                        </p>
                    </div>


                    {success ? (
                        <div className="text-center py-12 sm:py-20 px-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
                            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-emerald-500 mb-6 sm:mb-8 border border-emerald-50 shadow-sm">
                                <CheckCircle size={44} />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">Account Created!</h2>
                            <p className="text-slate-500 font-bold leading-relaxed text-base sm:text-lg">
                                Your account is ready.<br />Taking you to the login screen…
                            </p>
                        </div>
                    ) : verificationStage ? (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-1.5 text-center">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Verification Code</label>
                                <div className="flex justify-center gap-3">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        required
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                        className="w-full text-center py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-3xl font-black tracking-[0.5em] text-indigo-600 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="mt-6 flex flex-col items-center gap-4">
                                    <p className="text-slate-400 font-bold text-xs">
                                        Code sent to {formData.email}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={resendTimer > 0 || resending}
                                        className={`text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all
                                            ${resendTimer > 0 || resending
                                                ? "text-slate-300 bg-slate-50 cursor-not-allowed"
                                                : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95"
                                            }`}
                                    >
                                        {resending ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={12} className="animate-spin" />
                                                Resending...
                                            </div>
                                        ) : resendTimer > 0 ? (
                                            `Resend Code in ${resendTimer}s`
                                        ) : (
                                            "Resend Code"
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={verifying}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group">
                                {verifying ? <Loader2 className="animate-spin" size={22} /> : (
                                    <>
                                        Verify & Create Account
                                        <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setVerificationStage(false); setVerificationCode(""); }}
                                className="w-full text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors py-2"
                            >
                                Change Email Address
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input type="text" required placeholder="e.g. Bishnu Parajuli"
                                        disabled={verificationStage}
                                        value={formData.full_name} onChange={e => update("full_name", e.target.value)}

                                        className={`${inputCls} pl-14 pr-5`} />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input type="text" required placeholder="bishnu_01"
                                        disabled={verificationStage}
                                        value={formData.username} onChange={e => update("username", e.target.value)}

                                        className={`${inputCls} pl-14 pr-5`} autoComplete="username" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input type="email" required placeholder="yourname@gmail.com"
                                        disabled={verificationStage}
                                        value={formData.email} onChange={e => update("email", e.target.value)}

                                        className={`${inputCls} pl-14 pr-5`} autoComplete="email" />
                                </div>
                            </div>

                            {/* ── Role Cards ─────────────────────────────── */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES.map(role => {
                                        const selected = formData.role_name === role.value;
                                        const isIndigo = role.accent === "indigo";
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => update("role_name", role.value)}
                                                className={`relative text-left px-3 py-3 rounded-2xl border-2 transition-all duration-200 w-full
                                                    ${selected
                                                        ? isIndigo
                                                            ? "border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100"
                                                            : "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100"
                                                        : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white shadow-sm"
                                                    }`}
                                            >
                                                {/* Corner tick */}
                                                {selected && (
                                                    <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white
                                                        ${isIndigo ? "bg-indigo-500" : "bg-emerald-500"}`}>
                                                        <Check size={10} strokeWidth={3} />
                                                    </div>
                                                )}
                                                {/* Icon */}
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all
                                                    ${selected
                                                        ? isIndigo ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                                                        : "bg-white text-slate-400 border border-slate-100"
                                                    }`}>
                                                    {role.value === "pharmacist" ? <Shield size={17} /> : <Activity size={17} />}
                                                </div>
                                                {/* Label */}
                                                <p className={`font-black text-sm leading-tight mb-1
                                                    ${selected ? isIndigo ? "text-indigo-700" : "text-emerald-700" : "text-slate-700"}`}>
                                                    {role.label}
                                                </p>
                                                <p className={`text-[10px] font-medium leading-relaxed
                                                    ${selected ? isIndigo ? "text-indigo-500" : "text-emerald-600" : "text-slate-400"}`}>
                                                    {role.desc}
                                                </p>
                                                {role.note && (
                                                    <p className={`flex items-center gap-1 text-[9px] font-black mt-1.5 uppercase tracking-wide
                                                        ${selected && isIndigo ? "text-indigo-400" : "text-slate-300"}`}>
                                                        <Clock size={9} /> {role.note}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                                        value={formData.password} onChange={e => update("password", e.target.value)}
                                        className={`${inputCls} pl-14 pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} autoComplete="new-password" />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors">
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {formData.password.length > 0 && (
                                    <div className="flex items-center gap-3 pt-1 pl-1">
                                        <div className="flex gap-1 flex-1">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300
                                                    ${i < strengthen
                                                        ? (strengthMeta[Math.max(strengthen - 1, 0)]?.bar || "bg-slate-200")
                                                        : "bg-slate-100"
                                                    }`} />
                                            ))}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${strengthMeta[Math.max(strengthen - 1, 0)]?.text || "text-slate-400"}`}>
                                            {strengthen === 0 ? "Too Short" : strengthMeta[strengthen - 1].label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input type={showConfirm ? "text" : "password"} required placeholder="••••••••"
                                        value={formData.confirm_password} onChange={e => update("confirm_password", e.target.value)}
                                        className={`${inputCls} pl-14 pr-12 ${passwordsMatch ? "border-emerald-300 focus:border-emerald-400" : passwordsMismatch ? "border-rose-300 focus:border-rose-400" : ""} [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                                        autoComplete="new-password" />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors">
                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {passwordsMatch && <p className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 pl-1 pt-0.5"><Check size={11} strokeWidth={3} /> Passwords match</p>}
                                {passwordsMismatch && <p className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 pl-1 pt-0.5"><X size={11} strokeWidth={3} /> Passwords do not match</p>}
                            </div>

                            {/* Terms with clickable Policy link */}
                            <div className="flex items-center gap-3 px-1 py-1">
                                <input type="checkbox" id="terms"
                                    className="w-4 h-4 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer accent-indigo-600"
                                    checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                                <label htmlFor="terms" className="text-sm font-bold text-slate-500 cursor-pointer select-none">
                                    I agree to the{" "}
                                    <button
                                        type="button"
                                        onClick={() => setPolicyOpen(true)}
                                        className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition-colors"
                                    >
                                        Privacy Policy
                                    </button>
                                    {" "}and clinical terms.
                                </label>
                            </div>

                            {/* Error */}
                            {/* Errors are now handled via toast notifications */}

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group">
                                {loading ? <Loader2 className="animate-spin" size={22} /> : (
                                    <>
                                        Get Verification Code
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}


                </div>

                <div className="hidden sm:block absolute bottom-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center w-full left-0 opacity-40">
                    PharmaTrack - Pharmacy Management Portal
                </div>
            </div>

            {/* ── Privacy Policy Modal ────────────────────────── */}
            {policyOpen && <PolicyModal onClose={() => setPolicyOpen(false)} />}
        </div>
    );
};

export default Register;
