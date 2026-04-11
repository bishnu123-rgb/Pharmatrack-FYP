import { useState, useEffect } from "react";
import { 
    MessageSquare, 
    User, 
    Phone, 
    Package, 
    Calendar, 
    CheckCircle2, 
    Loader2, 
    ArrowLeft,
    Search,
    Filter,
    ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStockRequests, fulfillStockRequest } from "../services/api";
import { toast } from "react-hot-toast";

const StockRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRequests = async () => {
        try {
            const data = await getStockRequests();
            setRequests(data);
        } catch (err) {
            toast.error("Failed to load stock requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleFulfill = async (id) => {
        try {
            await fulfillStockRequest(id);
            toast.success("Request marked as fulfilled.");
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            toast.error("Action failed. Please try again.");
        }
    };

    const filteredRequests = requests.filter(r => 
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_phone.includes(searchTerm)
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Customer Waitlist</h1>
                    <p className="text-slate-500 font-bold border-l-4 border-violet-500 pl-4">
                        Manage stock notifications and customer leads for out-of-stock items.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search names, medicines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-80 font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* List & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Stats Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-violet-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-violet-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <MessageSquare size={120} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Active Demand</p>
                        <h2 className="text-5xl font-black tracking-tighter mb-4">{requests.length}</h2>
                        <p className="text-xs font-bold leading-relaxed opacity-80">
                            Customers waiting for inventory restocking. High leads indicate priority items for procurement.
                        </p>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Waitlist Tips</h4>
                        <div className="space-y-3">
                            <div className="flex gap-3 text-xs font-bold text-slate-600">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                                <span>Call customers as soon as new batches are verified.</span>
                            </div>
                            <div className="flex gap-3 text-xs font-bold text-slate-600">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                                <span>Prioritize Chronic Meds for recurring sales.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Table Ledger */}
                <div className="lg:col-span-3">
                    {filteredRequests.length > 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Requested</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Date</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRequests.map((req, idx) => {
                                        const isReady = req.current_stock > 0;
                                        const waMessage = encodeURIComponent(`Hello ${req.customer_name}, good news! ${req.medicine_name} is now back in stock at PharmaTrack. Visit us or reply to reserve yours now!`);
                                        const waLink = `https://wa.me/${req.customer_phone.replace(/\D/g, '')}?text=${waMessage}`;

                                        return (
                                            <tr key={req.id} className={`group hover:bg-slate-50/50 transition-colors ${isReady ? 'bg-emerald-50/30' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isReady ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-violet-100 text-violet-600'}`}>
                                                            {req.customer_name[0]}
                                                        </div>
                                                        <span className="font-black text-slate-900 tracking-tight">{req.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <a href={`tel:${req.customer_phone}`} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                                                        <Phone size={14} /> {req.customer_phone}
                                                    </a>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm tracking-tight">{req.medicine_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{[req.dosage_form, req.strength].filter(Boolean).join(" | ")}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {isReady ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase bg-emerald-100 px-3 py-1 rounded-full w-fit">
                                                            <Package size={12} /> {req.current_stock} In Stock
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[10px] font-black uppercase bg-slate-100 px-3 py-1 rounded-full w-fit">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        {new Date(req.requested_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isReady && (
                                                            <a 
                                                                href={waLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2 shrink-0"
                                                            >
                                                                <MessageSquare size={12} fill="white" /> Notify WhatsApp
                                                            </a>
                                                        )}
                                                        <button 
                                                            onClick={() => handleFulfill(req.id)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shrink-0"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <Filter size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-800">Clear Waitlist</h3>
                                <p className="text-slate-400 font-bold text-sm max-w-xs">No pending stock requests found. Your inventory is currently meeting public demand.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockRequests;
