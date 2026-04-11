import { useState, useEffect } from "react";
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
    Truck
} from "lucide-react";
import AIChatbot from "./AIChatbot";
import { IMAGE_BASE_URL } from "../services/api";

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
            <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-50">
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
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-10 flex items-center justify-between sticky top-0 z-40">
                    <div>
                        <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Operational Dashboard</h1>
                        <p className="text-lg font-bold text-slate-800">System Overview</p>
                    </div>

                    <div className="flex items-center gap-6">
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
                <AIChatbot role="admin" />
            </main>
        </div>
    );
};

export default Layout;
