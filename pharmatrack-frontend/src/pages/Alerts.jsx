import { useState, useEffect, useMemo } from "react";
import {
    AlertTriangle, Bell, RefreshCcw, Loader2, Calendar,
    Package, AlertCircle, TrendingDown, Clock, Search,
    Filter, ArrowRight, ShoppingCart, Eye, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAlerts, triggerAlertGeneration } from "../services/api";

const Alerts = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const data = await getAlerts();
            setAlerts(data);
        } catch (err) {
            setError("Failed to fetch alerts");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await triggerAlertGeneration();
            await fetchAlerts();
        } catch (err) {
            alert("System scan failed. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    const stats = useMemo(() => {
        const expiry = alerts.filter(a => a.alert_type === 'EXPIRY').length;
        const lowStock = alerts.filter(a => a.alert_type === 'LOW_STOCK').length;
        return { total: alerts.length, expiry, lowStock };
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        if (activeFilter === "ALL") return alerts;
        return alerts.filter(a => a.alert_type === activeFilter);
    }, [alerts, activeFilter]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 sm:gap-4">
                        Stock Alerts
                        <span className="flex h-2.5 w-2.5 sm:h-3 sm:w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-rose-500"></span>
                        </span>
                    </h1>
                    <p className="text-xs sm:text-base text-slate-500 font-bold">Real-time monitoring of inventory health and compliance.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="group flex items-center justify-center gap-3 bg-white border border-slate-200 px-6 sm:px-8 py-3.5 sm:py-4 rounded-[1.2rem] sm:rounded-[1.5rem] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50 w-full lg:w-auto"
                    >
                        <RefreshCcw size={18} className={`${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} text-indigo-600`} />
                        <span className="text-sm sm:text-base text-slate-700">{refreshing ? "Scanning..." : "Run System Scan"}</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => setActiveFilter("ALL")}
                    className={`cursor-pointer group p-8 rounded-[2.5rem] border transition-all duration-300 bg-white ${activeFilter === 'ALL' ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${activeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                            <Bell size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Alerts</p>
                            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.total}</h3>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setActiveFilter("EXPIRY")}
                    className={`cursor-pointer group p-8 rounded-[2.5rem] border transition-all duration-300 bg-white ${activeFilter === 'EXPIRY' ? 'border-rose-600 shadow-xl shadow-rose-100 ring-4 ring-rose-50' : 'border-slate-100 shadow-sm hover:border-rose-200'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${activeFilter === 'EXPIRY' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-400 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Near Expiry</p>
                            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.expiry}</h3>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setActiveFilter("LOW_STOCK")}
                    className={`cursor-pointer group p-8 rounded-[2.5rem] border transition-all duration-300 bg-white ${activeFilter === 'LOW_STOCK' ? 'border-amber-600 shadow-xl shadow-amber-100 ring-4 ring-amber-50' : 'border-slate-100 shadow-sm hover:border-amber-200'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${activeFilter === 'LOW_STOCK' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-400 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Low Stock</p>
                            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.lowStock}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {filteredAlerts.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-50 flex flex-col items-center">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                        <Bell size={40} className="animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Status: All Clear</h3>
                    <p className="text-slate-500 font-bold mt-2 max-w-sm">No critical items detected. Keep up the great inventory management!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredAlerts.map((alert) => (
                        <div
                            key={alert.alert_id}
                            className={`group relative p-8 rounded-[3rem] border transition-all duration-500 hover:shadow-2xl overflow-hidden
                                ${alert.alert_type === 'EXPIRY'
                                    ? 'bg-gradient-to-br from-rose-50/50 to-white border-rose-100 hover:border-rose-300'
                                    : 'bg-gradient-to-br from-amber-50/50 to-white border-amber-100 hover:border-amber-300'
                                }
                            `}
                        >
                            {/* Visual Decor */}
                            <div className={`absolute -right-8 -top-8 w-48 h-48 blur-[80px] opacity-10 transition-all group-hover:opacity-30 
                                ${alert.alert_type === 'EXPIRY' ? 'bg-rose-500' : 'bg-amber-500'}
                            `}></div>

                            <div className="flex gap-6 relative z-10">
                                <div className={`p-5 rounded-[1.5rem] h-fit shadow-lg shadow-black/5
                                    ${alert.alert_type === 'EXPIRY' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}
                                `}>
                                    <AlertTriangle size={28} />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">{alert.medicine_name}</h4>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                Detected {new Date(alert.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                                            ${alert.alert_type === 'EXPIRY' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}
                                        `}>
                                            {alert.alert_type === 'EXPIRY' ? 'Near Expiry' : 'Low Stock'}
                                        </div>
                                    </div>

                                    <p className="text-lg text-slate-600 font-bold leading-snug">{alert.message}</p>

                                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100/50">
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm uppercase tracking-widest">
                                            <Package size={14} className="text-indigo-500" />
                                            Batch: {alert.batch_number}
                                        </span>

                                        {alert.alert_type === 'EXPIRY' ? (
                                            <button
                                                onClick={() => navigate('/batches')}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-black/10 active:scale-95 ml-auto"
                                            >
                                                Verify Lot <Eye size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate('/purchases')}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 ml-auto"
                                            >
                                                Restock Now <ShoppingCart size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Alerts;
