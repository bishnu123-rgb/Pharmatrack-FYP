import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package,
    AlertCircle,
    Calendar,
    TrendingUp,
    Loader2,
    PlusCircle,
    ShoppingBag,
    History,
    Clock,
    User,
    ArrowRight,
    DollarSign,
    BrainCircuit,
    Sparkles,
    MessageSquare,
    X
} from "lucide-react";
import { getDashboardSummary, getInventoryInsights } from "../services/api";

const StatCard = ({ title, value, icon: Icon, color, subtext, trend, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 premium-shadow border border-white/20 ring-1 ring-slate-900/5 group transition-all duration-500 relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-indigo-200' : ''}`}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 transition-transform duration-700`}></div>

        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl ${color.replace('bg-', 'bg-').replace('-500', '-500/10')} border ${color.replace('bg-', 'border-').replace('-500', '-500/20')} flex items-center justify-center ${color.replace('bg-', 'text-')}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {trend && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {trend}
                        </span>
                    )}
                    <p className="text-[11px] font-bold text-slate-400">{subtext}</p>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [time, setTime] = useState(new Date());

    // AI Insight State
    const [aiInsight, setAiInsight] = useState("");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [showInsight, setShowInsight] = useState(false);

    const handleGetInsight = async () => {
        if (aiInsight) {
            setShowInsight(!showInsight);
            return;
        }

        setIsInsightLoading(true);
        setShowInsight(true);
        try {
            const data = await getInventoryInsights(stats);
            setAiInsight(data.tip || "Focus on restocking high-velocity items and verifying expiry dates for clinical safety.");
        } catch (err) {
            setAiInsight("Operational intelligence engine temporarily offline. Continue following standard pharmacy protocols.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const fetchStats = async () => {
            try {
                const data = await getDashboardSummary();
                setStats(data);
            } catch (err) {
                setError("Dashboard data failed to load.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Offline</h2>
                    <p className="text-slate-500 font-bold max-w-sm">
                        {error || "Dashboard data could not be retrieved at this time."}
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
    }

    const maxWeeklyValue = Math.max(
        ...(stats?.weekly_sales || []).map(s => Number(s.total || 0)),
        ...(stats?.weekly_sales || []).map(s => Number(s.profit || 0)),
        1
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 font-black tracking-[0.2em] uppercase text-[10px] animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        Live Operations Active
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{user.full_name?.split(' ')[0] || user.username}</span>
                    </h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        <span className="text-slate-300 mx-2">|</span>
                        <Clock size={14} className="text-slate-400" />
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => navigate('/sales')}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all hover:scale-[1.05] active:scale-95 shadow-lg shadow-indigo-200"
                    >
                        <ShoppingBag size={18} />
                        New Sale
                    </button>
                    <button
                        onClick={() => navigate('/medicines')}
                        className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <PlusCircle size={18} />
                        Add Stock
                    </button>
                    <button
                        onClick={() => navigate('/alerts')}
                        className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:border-amber-600 hover:text-amber-600 transition-all shadow-sm"
                    >
                        <AlertCircle size={18} />
                        View Alerts
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Available Medicines"
                    value={stats?.total_medicines || 0}
                    icon={Package}
                    color="bg-blue-500"
                    subtext="Unique items in store"
                    trend="+12% this month"
                    onClick={() => navigate('/medicines')}
                />
                <StatCard
                    title="Low Stock"
                    value={stats?.low_stock_items || 0}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    subtext="Required attention"
                    trend={stats?.low_stock_items > 0 ? "Action Required" : "Optimal"}
                    onClick={() => navigate('/alerts')}
                />
                <StatCard
                    title="Expired Medicines"
                    value={stats?.expired_batches || 0}
                    icon={Calendar}
                    color="bg-rose-500"
                    subtext="Items to remove"
                    trend="Immediate action"
                    onClick={() => navigate('/alerts')}
                />
                <StatCard
                    title="Today's Sales"
                    value={`NPR ${(stats?.today_sales || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-indigo-500"
                    subtext="Daily revenue flow"
                    trend="+5.2% v/s yesterday"
                    onClick={() => navigate('/sales')}
                />
                {stats?.today_profit !== null && (
                    <StatCard
                        title="Net Profit (Today)"
                        value={`NPR ${(stats?.today_profit || 0).toLocaleString()}`}
                        icon={DollarSign}
                        color="bg-emerald-500"
                        subtext="Actual earnings"
                        trend="Manager's View"
                        onClick={() => navigate('/sales')}
                    />
                )}
                <StatCard
                    title="Stock Requests"
                    value={stats?.stock_requests || 0}
                    icon={MessageSquare}
                    color="bg-violet-500"
                    subtext="Waiting for restock"
                    trend={stats?.ready_leads > 0 ? `${stats.ready_leads} Ready to Notify` : "Store Leads"}
                    onClick={() => navigate('/stock-requests')}
                />

            </div>

            {/* Sales Chart and Notices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {/* Background Glass Accent Orbs */}
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 premium-shadow border border-white/40 relative group overflow-hidden flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Sales Performance</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Last 7 Days Revenue</p>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-4 md:gap-8 pt-4 border-b border-slate-100 pb-2">
                        {stats.weekly_sales && stats.weekly_sales.length > 0 ? (
                            stats.weekly_sales.map((sale, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar h-full justify-end">
                                    <div className="relative w-full flex flex-row items-end justify-center gap-1 group-hover/bar:-translate-y-2 transition-transform duration-500">
                                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-20 shadow-xl whitespace-nowrap">
                                            Rev: {(sale.total || 0).toLocaleString()}
                                            {sale.profit !== null && ` | Profit: ${(sale.profit || 0).toLocaleString()}`}
                                        </div>
                                        {/* Sales Bar */}
                                        <div
                                            className="w-4 bg-slate-50 group-hover/bar:bg-indigo-50 transition-all duration-500 rounded-t-lg relative overflow-hidden"
                                            style={{ height: `${(sale.total / maxWeeklyValue) * 180 + 10}px` }}
                                        >
                                            <div
                                                className="absolute inset-x-0 bottom-0 bg-indigo-500 opacity-60 group-hover/bar:opacity-100 transition-all duration-700"
                                                style={{ height: sale.total > 0 ? '100%' : '2px' }}
                                            ></div>
                                        </div>
                                        {/* Profit Bar - Admin Only */}
                                        {sale.profit !== null && (
                                            <div
                                                className="w-4 bg-slate-50 group-hover/bar:bg-emerald-50 transition-all duration-500 rounded-t-lg relative overflow-hidden"
                                                style={{ height: `${(sale.profit / maxWeeklyValue) * 180 + 10}px` }}
                                            >
                                                <div
                                                    className="absolute inset-x-0 bottom-0 bg-emerald-500 opacity-60 group-hover/bar:opacity-100 transition-all duration-700"
                                                    style={{ height: sale.profit > 0 ? '100%' : '2px' }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sale.day.substring(0, 3)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-[200px] opacity-40">
                                <TrendingUp size={40} className="text-slate-300 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No sales recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#0f172a] rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-900/20 flex flex-col min-h-[400px] relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                    <h3 className="text-xl font-black text-white mb-8 relative z-10 flex items-center gap-3">
                        Important Notices
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    </h3>

                    <div className="space-y-6 relative z-10">
                        {stats?.low_stock_items > 0 && (
                            <div onClick={() => navigate('/alerts')} className="flex gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:scale-[1.02] hover:bg-amber-500/20 transition-all cursor-pointer group">
                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                <div className="flex-1">
                                    <p className="text-sm font-black text-amber-100 leading-tight tracking-tight">Stock Needs Re-order</p>
                                    <p className="text-xs text-amber-500/80 font-bold mt-1.5">{stats.low_stock_items} items are running low.</p>
                                </div>
                                <ArrowRight className="text-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity mt-auto mb-auto ml-auto" size={16} />
                            </div>
                        )}
                        {stats?.expired_batches > 0 && (
                            <div onClick={() => navigate('/alerts')} className="flex gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:scale-[1.02] hover:bg-rose-500/20 transition-all cursor-pointer group">
                                <Calendar className="text-rose-500 shrink-0" size={20} />
                                <div className="flex-1">
                                    <p className="text-sm font-black text-rose-100 leading-tight tracking-tight">Expired Stock</p>
                                    <p className="text-xs text-rose-500/80 font-bold mt-1.5">{stats.expired_batches} batches have already expired.</p>
                                </div>
                                <ArrowRight className="text-rose-500/50 opacity-0 group-hover:opacity-100 transition-opacity mt-auto mb-auto ml-auto" size={16} />
                            </div>
                        )}

                        {!stats?.low_stock_items && !stats?.expired_batches && (
                            <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                                    <Package className="text-white/50" size={32} />
                                </div>
                                <p className="text-white/50 text-xs font-black uppercase tracking-widest">Store is clear</p>
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 mt-auto opacity-20 pointer-events-none">
                            <div className="h-px bg-white/10 w-full mb-4"></div>
                            <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em] text-center">Pharmacy Protocol v1.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity and Fast Moving */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Recent Activity Log */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 premium-shadow border border-white/40 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Live Activity Log</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Recent Sales & Purchases</p>
                        </div>
                        <History size={20} className="text-slate-300" />
                    </div>

                    <div className="flex-1 space-y-4">
                        {stats.activities && stats.activities.length > 0 ? (
                            stats.activities.map((activity, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(activity.type === 'SALE' ? '/sales' : '/purchases')}
                                    className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 shadow-sm hover:shadow-md transition-all group scale-in cursor-pointer"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {activity.type === 'SALE' ? <ShoppingBag size={20} /> : <Package size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">{activity.detail}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activity.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {activity.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900 tracking-tight">NPR {(activity.amount || 0).toLocaleString()}</p>
                                        <ArrowRight className="text-slate-300 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                <History size={48} className="text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No activity recorded</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fast Moving Items */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 premium-shadow border border-white/40 flex flex-col min-h-[400px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 pt-10 opacity-5">
                        <TrendingUp size={120} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-8 relative z-10">Fast-Moving Items</h3>

                    <div className="space-y-6 relative z-10 h-full">
                        {stats.fast_moving && stats.fast_moving.length > 0 ? (
                            stats.fast_moving.map((item, idx) => (
                                <div key={idx} onClick={() => navigate('/medicines')} className="space-y-3 group/item p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm font-black text-slate-800 tracking-tight group-hover/item:text-indigo-600 transition-colors uppercase truncate max-w-[150px]">{item.name}</p>
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{item.sold} sold</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 group-hover/item:bg-indigo-600 transition-all duration-1000 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                                            style={{ width: `${(item.sold / Math.max(...stats.fast_moving.map(m => m.sold))) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Analyzing sales velocity...</p>
                        )}

                        <div className="mt-auto pt-10">
                            <div className="p-6 rounded-3xl bg-indigo-600 flex flex-col items-center text-center gap-4 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer group/card" onClick={() => navigate('/sales')}>
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white group-hover/card:scale-110 transition-transform">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-white font-black tracking-tight leading-tight">Generate New Sale</p>
                                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Process order now</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Strategy Modal - Management Only */}
            {['admin', 'pharmacist'].includes(user.role) && (
                <div className="fixed top-24 right-8 z-[100] flex flex-col items-end gap-4 animate-in slide-in-from-right-10 duration-700">
                    <button
                        onClick={handleGetInsight}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 group ${showInsight ? 'bg-indigo-600' : 'bg-slate-900 hover:bg-indigo-600'}`}
                    >
                        <div className="relative">
                            <BrainCircuit size={28} className={`text-white transition-all duration-500 ${isInsightLoading ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900 animate-ping"></div>
                        </div>
                    </button>

                    {showInsight && (
                        <div className="max-w-xs bg-slate-900 border border-slate-800 text-white p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-5 fade-in duration-500 relative">
                            <div className="flex items-center gap-2 mb-3 text-indigo-400">
                                <Sparkles size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Smart Strategy Node</span>
                                <button onClick={() => setShowInsight(false)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            {isInsightLoading ? (
                                <div className="flex items-center gap-3 py-2">
                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-400">Analyzing System State...</span>
                                </div>
                            ) : (
                                <p className="text-sm font-bold leading-relaxed text-indigo-50 italic">
                                    "{aiInsight}"
                                </p>
                            )}
                            <div className="absolute -top-2 right-8 w-4 h-4 bg-slate-900 rotate-45 border-t border-l border-slate-800"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
