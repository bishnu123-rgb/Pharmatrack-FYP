import { useState, useEffect, useMemo, useRef } from "react";
import {
    getUsers, updateUser, deleteUser
} from "../services/api";
import {
    User, Shield, Users, Loader2, CheckCircle2,
    XCircle, MoreVertical, AlertCircle, Search,
    Filter, Activity, Lock, Unlock, UserCheck, ChevronDown, Trash2
} from "lucide-react";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [toggling, setToggling] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    const roles = [
        { id: 1, name: 'admin', label: 'Admin (Manager)' },
        { id: 2, name: 'staff', label: 'Staff (Operator)' },
        { id: 3, name: 'pharmacist', label: 'Pharmacist' }
    ];

    useEffect(() => {
        loadUsers();

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setError("Failed to load staff list.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setToggling(id);
        try {
            await updateUser(id, { status: newStatus });
            await loadUsers();
        } catch (err) {
            alert("Failed to update staff status.");
        } finally {
            setToggling(null);
        }
    };

    const handleRoleChange = async (userId, roleId) => {
        setToggling(userId);
        setActiveMenu(null);
        try {
            await updateUser(userId, { role_id: roleId });
            await loadUsers();
        } catch (err) {
            alert("Failed to change user role.");
        } finally {
            setToggling(null);
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`Are you sure you want to PERMANENTLY delete ${user.full_name}? This action cannot be undone.`)) {
            setToggling(user.user_id);
            setActiveMenu(null);
            try {
                await deleteUser(user.user_id);
                await loadUsers();
            } catch (err) {
                alert(err.message || "Failed to delete user.");
            } finally {
                setToggling(null);
            }
        }
    };

    const stats = useMemo(() => {
        const active = users.filter(u => u.status === 'active').length;
        const admins = users.filter(u => u.role_name === 'admin').length;
        return { total: users.length, active, admins };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
        </div>
    );

    if (error && users.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Staff Registry Offline</h2>
                <p className="text-slate-500 font-bold max-w-sm">
                    {error || "We couldn't connect to the staff database."}
                </p>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Staff Registry
                    </h1>
                    <p className="text-slate-500 font-bold">Manage system access and roles for your pharmacy team.</p>
                </div>

                <div className="relative group w-full lg:w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search staff members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                    />
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Staff</p>
                        <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.total}</h3>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
                        <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.active}</h3>
                    </div>
                </div>

                <div className="bg-[#0f172a] p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Shield size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mb-1">Administrators</p>
                        <h3 className="text-3xl font-black text-white leading-none">{stats.admins}</h3>
                    </div>
                </div>
            </div>

            {/* Registry Table */}
            <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 sm:px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
                                <th className="hidden sm:table-cell px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                                <th className="hidden md:table-cell px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Active</th>
                                <th className="px-6 sm:px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((u) => (
                                <tr key={u.user_id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                    <td className="px-6 sm:px-10 py-6">
                                        <div className="flex items-center gap-4 sm:gap-5">
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-base sm:text-lg font-black shadow-lg transition-transform group-hover:scale-105 duration-500
                                                ${u.status === 'active' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-200 text-slate-500 shadow-none'}
                                            `}>
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">{u.full_name}</p>
                                                <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold tracking-tight line-clamp-1">{u.email}</p>
                                                <div className="sm:hidden mt-1">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${u.role_name === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                        {u.role_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-10 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit
                                            ${u.role_name === 'admin'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                            }
                                        `}>
                                            <Shield size={12} />
                                            {u.role_name}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-10 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm text-slate-900 font-black flex items-center gap-2">
                                                <Activity size={12} className={u.status === 'active' ? 'text-emerald-500' : 'text-slate-300'} />
                                                {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                {u.last_login ? new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 sm:px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 sm:gap-3 sm:translate-x-4 sm:opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                            <button
                                                onClick={() => toggleStatus(u.user_id, u.status)}
                                                disabled={toggling === u.user_id}
                                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition shadow-sm border
                                                    ${u.status === 'active'
                                                        ? 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50'
                                                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
                                                    }
                                                `}
                                            >
                                                {toggling === u.user_id ? <Loader2 size={12} className="animate-spin" /> : (u.status === 'active' ? <Lock size={12} /> : <Unlock size={12} />)}
                                                <span className="hidden sm:inline">{u.status === 'active' ? 'Lock Account' : 'Unlock Account'}</span>
                                                <span className="sm:hidden">{u.status === 'active' ? 'Lock' : 'Unlock'}</span>
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === u.user_id ? null : u.user_id)}
                                                    className={`p-3.5 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90 ${activeMenu === u.user_id ? 'ring-4 ring-indigo-50 border-indigo-200 text-indigo-600' : ''}`}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {activeMenu === u.user_id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 border border-slate-100 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden"
                                                    >
                                                        <div className="px-5 py-3 border-b border-slate-50 mb-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Actions</p>
                                                        </div>
                                                        <div className="space-y-1 p-1">
                                                            <p className="px-4 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Change Role</p>
                                                            {roles.map(role => (
                                                                <button
                                                                    key={role.id}
                                                                    onClick={() => handleRoleChange(u.user_id, role.id)}
                                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all
                                                                        ${u.role_name === role.name
                                                                            ? 'bg-indigo-50 text-indigo-600'
                                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                                                        }
                                                                    `}
                                                                >
                                                                    {role.label}
                                                                    {u.role_name === role.name && <CheckCircle2 size={14} className="text-indigo-600" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-slate-50 p-1">
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete Staff Member
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-32 bg-slate-50/50">
                        <Users size={64} className="mx-auto mb-6 opacity-20 text-slate-400" />
                        <h3 className="text-xl font-black text-slate-900 italic">No matches found</h3>
                        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto mt-2">Try adjusting your search to find the staff member you are looking for.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
