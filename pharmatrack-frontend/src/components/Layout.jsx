import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    Package,
    ShoppingCart,
    LogOut,
    AlertTriangle,
    Layers,
    FileText,
    Users,
    UserCircle,
    Shield,
    Truck,
    Bell,
    CheckCircle2,
    Clock,
    ArrowRight
} from "lucide-react";
import AIChatbot from "./AIChatbot";
import { IMAGE_BASE_URL, getDashboardSummary, markAlertsAsRead } from "../services/api";

const NotificationBell = () => {
    const [counts, setCounts] = useState({ alerts: 0, leads: 0 });
    const [lastSeenCount, setLastSeenCount] = useState(Number(localStorage.getItem("lastSeenNotificationCount") || 0));
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchCounts = async () => {
        try {
            const data = await getDashboardSummary();
            setCounts({
                alerts: data.unread_alerts || 0,
                leads: data.ready_leads || 0
            });
        } catch (err) {
            console.error("Pulse error:", err);
        }
    };

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 60000); // Pulse check every minute

        const handleRefresh = () => fetchCounts();
        window.addEventListener("refreshNotifications", handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener("refreshNotifications", handleRefresh);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const total = counts.alerts + counts.leads;
    const hasNew = total > lastSeenCount;

    const toggleDropdown = async () => {
        if (!isOpen && total > 0) {
            try {
                await markAlertsAsRead();
                // We don't reset count immediately here to avoid UI jump, 
                // but next pulse check will clear it.
            } catch (err) {
                console.error("Mark read error:", err);
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group
                ${total > 0 ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "bg-slate-50 text-slate-400"}`}
            >
                <Bell size={20} className={total > 0 ? "animate-swing" : ""} />
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-rose-500/20">
                        {total}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-2xl shadow-indigo-500/10 p-2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notification</h3>
                    </div>

                    <div className="p-2 space-y-1">
                        {counts.alerts > 0 && (
                            <button
                                onClick={() => { navigate('/alerts'); setIsOpen(false); }}
                                className="w-full text-left p-4 rounded-2xl hover:bg-rose-50 group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">System Alerts</p>
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">{counts.alerts} Critical Issues</p>
                                    </div>
                                    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-rose-400" />
                                </div>
                            </button>
                        )}

                        {counts.leads > 0 && (
                            <button
                                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                                className="w-full text-left p-4 rounded-2xl hover:bg-indigo-50 group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">Restock Leads</p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">{counts.leads} Customers Waiting</p>
                                    </div>
                                    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-emerald-400" />
                                </div>
                            </button>
                        )}

                        {total === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
                                    <Clock size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-400">System is healthy.<br />No pending notifications.</p>
                            </div>
                        )}
                    </div>

                    {total > 0 && (
                        <div className="p-4 border-top border-slate-100 text-center">
                            <button onClick={() => { navigate('/dashboard'); setIsOpen(false); }} className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">View All Insights</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const [userStr, setUserStr] = useState(localStorage.getItem("user"));
    const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

    useEffect(() => {
        const handleUserUpdate = () => {
            setUserStr(localStorage.getItem("user"));
            setAvatarTimestamp(Date.now()); // Force re-render of avatar on update
        };
        window.addEventListener("userUpdated", handleUserUpdate);
        return () => window.removeEventListener("userUpdated", handleUserUpdate);
    }, []);

    const user = userStr ? JSON.parse(userStr) : { username: "User", role: "staff" };

    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http") && !url.includes(IMAGE_BASE_URL)) return url;
        const path = url.startsWith("/") ? url : `/${url}`;
        return `${IMAGE_BASE_URL}${path}?t=${avatarTimestamp}`;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Medicines", path: "/medicines", icon: Package },
        { name: "Batches", path: "/batches", icon: Layers },
        { name: "Sales", path: "/sales", icon: ShoppingCart },
        { name: "Purchases", path: "/purchases", icon: FileText },
        { name: "Supply Network", path: "/suppliers", icon: Truck },
        { name: "Resource Alerts", path: "/alerts", icon: AlertTriangle },
    ];

    if (user.role === 'admin') {
        navItems.push({ name: "User Registry", path: "/users", icon: Users });
    }

    navItems.push({ name: "User Profile", path: "/profile", icon: UserCircle });

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Professional Sidebar */}
            <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-50 no-print">
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Shield className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            Pharma<span className="text-indigo-400">Track</span>
                        </h2>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-4">Main Operation</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group
                                ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "hover:bg-white/5 hover:text-white"}`
                            }
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Elite Topbar */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-10 flex items-center justify-between sticky top-0 z-40 no-print">
                    <div>
                        <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Operational Dashboard</h1>
                        <p className="text-lg font-bold text-slate-800">System Overview</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900 leading-tight">{user.full_name || user.username}</p>
                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{user.role}</p>
                            </div>
                            <div className="h-10 w-10 bg-indigo-50 border-2 border-indigo-100 rounded-xl overflow-hidden flex items-center justify-center text-indigo-600 font-black shadow-sm group cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/profile')}>
                                {user.avatar_url ? (
                                    <img
                                        src={getFullImageUrl(user.avatar_url)}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = ""; e.target.className = "hidden"; }}
                                    />
                                ) : (
                                    <span>{user.username?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-10 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
                <AIChatbot role={user.role} />
            </main>
        </div>
    );
};

export default Layout;
