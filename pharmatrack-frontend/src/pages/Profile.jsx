import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    getProfile, updateProfile, uploadAvatar, changePassword
} from "../services/api";
import {
    User, Mail, Phone, Calendar, Shield, Loader2, Camera,
    Edit3, AlertCircle, CheckCircle2, XCircle, Key, LogOut,
    Eye, EyeOff, Save, X, ArrowRight, Activity
} from "lucide-react";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [dialog, setDialog] = useState({ show: false, title: "", message: "", type: "error" }); // "success" or "error"

    const [formData, setFormData] = useState({ full_name: "", email: "", phone: "" });
    const [passData, setPassData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const fetchProfileData = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setFormData({
                full_name: data.full_name,
                email: data.email,
                phone: data.phone || ""
            });
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const showToast = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 5000);
    };

    const showDialog = (title, message, type = "error") => {
        setDialog({ show: true, title, message, type });
    };

    const closeDialog = () => setDialog({ ...dialog, show: false });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile(formData);
            await fetchProfileData();
            setIsEditMode(false);
            showToast("Profile identity updated successfully!");
        } catch (err) {
            showDialog("Update Failed", err.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append("avatar", file);

        setSaving(true);
        try {
            await uploadAvatar(uploadData);
            await fetchProfileData();
            showToast("Avatar updated successfully!");
        } catch (err) {
            showDialog("Upload Failed", "Could not process image file.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            return showDialog("Validation Error", "New passwords do not match. Please verify and try again.", "error");
        }

        if (passData.newPassword === passData.currentPassword) {
            return showDialog("Security Policy", "You cannot use your current password as your new password. Please choose a different one.", "error");
        }

        setSaving(true);
        try {
            await changePassword({
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            });
            setShowPasswordModal(false);
            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            showToast("Credentials rotated successfully!");
        } catch (err) {
            showDialog("Security Error", err.message || "Failed to change password. Ensure your current password is correct.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse pb-20">
                <div className="h-64 bg-slate-100 rounded-[3rem]"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-20">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="h-64 bg-slate-50 rounded-[3rem]"></div>
                        <div className="h-48 bg-slate-50 rounded-[3rem]"></div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="h-32 bg-slate-50 rounded-[2.5rem]"></div>
                        <div className="h-64 bg-slate-50 rounded-[2.5rem]"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identity Node Offline</h2>
                <p className="text-slate-500 font-bold max-w-sm">Your profile telemetry could not be retrieved.</p>
            </div>
            <button onClick={fetchProfileData} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95">
                Retry Connection
            </button>
        </div>
    );

    const API_URL = "http://localhost:5000";

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">

            {/* Custom Message Dialog - Center Screen */}
            {dialog.show && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${dialog.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${dialog.type === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                            {dialog.type === 'error' ? <XCircle size={40} /> : <CheckCircle2 size={40} />}
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{dialog.title}</h3>
                        <p className="text-slate-500 font-bold leading-relaxed mb-8">{dialog.message}</p>

                        <button
                            onClick={closeDialog}
                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${dialog.type === 'error' ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                        >
                            Got it, thanks
                        </button>
                    </div>
                </div>
            )}

            {/* Elegant Toast Message */}
            {successMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-12 duration-500 border border-emerald-400/30 backdrop-blur-md">
                    <CheckCircle2 size={20} className="animate-bounce" />
                    {successMessage}
                </div>
            )}

            {/* Header Hero Area */}
            <div className="relative">
                <div className="h-48 md:h-64 bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-transparent to-blue-600/40 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(79,70,229,0.15),transparent)]"></div>

                    {/* Animated Decal */}
                    <div className="absolute top-10 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-1000 animate-pulse"></div>

                    {/* Floating elements for mobile flair */}
                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-xl animate-bounce-subtle"></div>
                </div>

                <div className="absolute -bottom-16 left-6 md:left-12 flex flex-col md:flex-row md:items-end gap-5 md:gap-10 w-[90%] md:w-auto">
                    <div className="relative group shrink-0">
                        <div className={`w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[2.5rem] bg-white p-1.5 md:p-2 shadow-2xl relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02] ${saving ? 'opacity-50' : ''}`}>
                            {profile.avatar_url ? (
                                <img
                                    src={`${API_URL}${profile.avatar_url}`}
                                    alt="Avatar"
                                    className="w-full h-full rounded-[1.7rem] md:rounded-[2rem] object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full rounded-[1.7rem] md:rounded-[2rem] bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 flex items-center justify-center text-indigo-600 text-5xl md:text-6xl font-black relative overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/30 backdrop-blur-sm -skew-y-12"></div>
                                    <span className="relative z-10">{profile.username[0].toUpperCase()}</span>
                                </div>
                            )}

                            <button
                                onClick={handleAvatarClick}
                                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[1.7rem] md:rounded-[2rem] z-20"
                            >
                                <Camera size={28} className="mb-1 animate-bounce-subtle" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Change Photo</span>
                            </button>

                            {saving && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[1.7rem] md:rounded-[2rem] z-30">
                                    <Loader2 className="animate-spin text-indigo-600" size={28} />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="mb-4 space-y-1 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-[2rem] border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">{profile.full_name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm ${profile.role_name === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                                {profile.role_name === 'admin' ? 'System Administrator' : profile.role_name}
                            </span>
                        </div>
                        <p className="text-indigo-100/80 font-bold flex items-center gap-2 text-sm md:text-base">
                            <Mail size={16} />
                            {profile.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-20">
                {/* Main Content Info */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -translate-y-4 translate-x-4 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700"></div>

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">Account Details</h2>
                            {!isEditMode ? (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="flex items-center gap-2 text-indigo-600 font-black text-xs bg-indigo-50 px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                >
                                    <Edit3 size={14} />
                                    Edit info
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditMode(false)}
                                    className="text-slate-400 hover:text-rose-500 transition p-2"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {isEditMode ? (
                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-slate-700 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-slate-700 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter your phone"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-slate-700 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2.5"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Update Details
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8 relative z-10 animate-in fade-in">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Name</p>
                                    <h4 className="text-base font-black text-slate-800 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <User size={18} />
                                        </div>
                                        {profile.full_name}
                                    </h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email Address</p>
                                    <h4 className="text-base font-black text-slate-800 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Mail size={18} />
                                        </div>
                                        {profile.email}
                                    </h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Phone</p>
                                    <h4 className="text-base font-black text-slate-800 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Phone size={18} />
                                        </div>
                                        {profile.phone || <span className="text-slate-300 italic">Not set</span>}
                                    </h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Member Since</p>
                                    <h4 className="text-base font-black text-slate-800 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                        {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h4>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Security Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight">Security & Access</h3>
                                <p className="text-slate-400 font-bold text-xs italic">Manage your password and session</p>
                            </div>
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10">
                                <Shield size={24} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="bg-white text-slate-900 px-6 py-3.5 rounded-xl font-black text-sm hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2.5"
                            >
                                <Key size={16} />
                                Change Password
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl font-black text-sm transition-all flex items-center gap-2.5"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Status</p>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full mb-4 overflow-hidden">
                            <div className="w-[100%] h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-slate-600">Last Login</p>
                            <p className="font-mono text-[10px] text-slate-400">
                                {profile.last_login ? new Date(profile.last_login).toLocaleString() : "First Session"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-[2.5rem] p-7 border border-indigo-100 group">
                        <h4 className="font-black text-indigo-900 mb-5 flex items-center gap-3 text-sm">
                            <Activity size={18} className="text-indigo-400" />
                            Work Authorization
                        </h4>
                        <ul className="space-y-3">
                            {(profile.role_name === 'admin'
                                ? ['Full System Access', 'Finance Controls', 'Staff Management', 'Inventory Policy']
                                : ['Update Inventory', 'Processing Sales', 'View Reports', 'Stock Checks']
                            ).map((cap, i) => (
                                <li key={cap} className="flex items-center gap-3 text-[11px] text-indigo-800/80 font-bold group-hover:translate-x-1 transition-transform duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-sm"></div>
                                    {cap}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Password Modal - Ultra Compact & Responsive */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                        <button
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition p-2"
                        >
                            <X size={18} />
                        </button>

                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Update</h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Update Credentials</p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                <div className="relative">
                                    <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type={showPass.current ? "text" : "password"}
                                        value={passData.currentPassword}
                                        onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-sm text-slate-700 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition"
                                    >
                                        {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                <div className="relative">
                                    <Shield size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type={showPass.new ? "text" : "password"}
                                        value={passData.newPassword}
                                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-sm text-slate-700 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition"
                                    >
                                        {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative">
                                    <CheckCircle2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type={showPass.confirm ? "text" : "password"}
                                        value={passData.confirmPassword}
                                        onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-sm text-slate-700 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition"
                                    >
                                        {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-slate-900 text-white py-3 rounded-lg font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 mt-2 flex items-center justify-center gap-2 group"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Update Credentials
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
