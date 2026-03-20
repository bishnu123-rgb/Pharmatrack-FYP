import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Calendar, DollarSign, Fingerprint, Loader2, AlertCircle, AlertTriangle, Search, Package, Eye, Barcode, ShieldCheck, FileDown, CheckCircle2, History, Zap, LayoutGrid, List } from "lucide-react";
import { getBatches, createBatch, updateBatch, deleteBatch, getMedicines, IMAGE_BASE_URL } from "../services/api";

const Batches = () => {
    const [batches, setBatches] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewingBatch, setViewingBatch] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMedicine, setFilterMedicine] = useState("all");
    const [filterExpiry, setFilterExpiry] = useState("all"); // 'all', 'soon', 'expired'
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formData, setFormData] = useState({
        batch_number: "", expiry_date: "", cost_price: "", selling_price: "", medicine_id: "", barcode: ""
    });
    const [error, setError] = useState("");
    const [viewType, setViewType] = useState("grid"); // 'list', 'grid'
    const [notifications, setNotifications] = useState([]);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canEdit = ["admin", "pharmacist"].includes(user.role);

    // Toast Helper
    const notify = (message, type = "success") => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setModalOpen(false);
                setViewingBatch(null);
                setDeleteConfirmId(null);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const fetchData = async () => {
        try {
            const [bat, meds] = await Promise.all([getBatches(), getMedicines()]);
            setBatches(bat || []);
            setMedicines(meds || []);
        } catch (err) {
            setError("Failed to fetch data. System might be offline.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (editId) {
                await updateBatch(editId, formData);
            } else {
                await createBatch(formData);
            }
            notify(editId ? "Batch updated successfully!" : "New batch added to system!");
            setModalOpen(false);
            setEditId(null);
            fetchData();
        } catch (err) {
            setError(err.message || "Operation failed.");
        }
    };

    const handleEdit = (batch) => {
        setFormData({
            batch_number: batch.batch_number || "",
            expiry_date: batch.expiry_date ? batch.expiry_date.split("T")[0] : "",
            cost_price: batch.cost_price || "",
            selling_price: batch.selling_price || "",
            medicine_id: batch.medicine_id || "",
            barcode: batch.barcode || ""
        });
        setError("");
        setEditId(batch.batch_id);
        setModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteBatch(deleteConfirmId);
            notify("Batch archived and moved to history!");
            setDeleteConfirmId(null);
            fetchData();
        } catch (err) {
            alert("Failed to remove batch.");
        }
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { label: "Unknown", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: null };
        const daysUntil = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 0) return { label: "Expired", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: <AlertCircle size={8} /> };
        if (daysUntil <= 90) return { label: "Expiring Soon", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <AlertTriangle size={8} /> };
        return { label: "Safe Shelf Life", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <ShieldCheck size={8} /> };
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http") && !url.includes(IMAGE_BASE_URL)) return url;
        const path = url.startsWith("/") ? url : `/${url}`;
        return `${IMAGE_BASE_URL}${path}?t=${Date.now()}`;
    };

    const exportCSV = () => {
        if (!batches.length) return;
        const headers = ["Batch ID", "Medicine", "Tracking ID", "Barcode", "Expiry Date", "Expiry Status", "Stock Quantity", "Cost Price", "Sale Price"];
        const rows = batches.map(b => {
            const status = getExpiryStatus(b.expiry_date);
            return [
                b.batch_id,
                `"${b.medicine_name}"`,
                `"${b.batch_number}"`,
                `"${b.barcode || 'N/A'}"`,
                new Date(b.expiry_date).toLocaleDateString(),
                `"${status.label}"`,
                b.current_quantity || 0,
                b.cost_price,
                b.selling_price
            ];
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SupplyChain_Batches_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredBatches = batches.filter(batch => {
        const batchNum = (batch.batch_number || "").toLowerCase();
        const medName = (batch.medicine_name || "").toLowerCase();
        const barcodeStr = (batch.barcode || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesSearch = batchNum.includes(term) || medName.includes(term) || barcodeStr.includes(term);
        const matchesMed = filterMedicine === "all" || (batch.medicine_id && batch.medicine_id.toString() === filterMedicine);

        const daysUntil = Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        let matchesExpiry = true;
        if (filterExpiry === 'soon') matchesExpiry = daysUntil > 0 && daysUntil <= 90;
        else if (filterExpiry === 'expired') matchesExpiry = daysUntil <= 0;

        return matchesSearch && matchesMed && matchesExpiry;
    });

    const HighlightText = ({ text, highlight }) => {
        if (!highlight.trim() || !text) return <>{text}</>;
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = String(text).split(regex);
        return (
            <>
                {parts.map((part, i) => regex.test(part) ?
                    <span key={i} className="text-indigo-600 font-black bg-indigo-50 px-0.5 rounded mr-[1px]">{part}</span> :
                    <span key={i}>{part}</span>)}
            </>
        );
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
        </div>
    );

    if (error && batches.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100"><AlertCircle size={40} /></div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Offline</h2>
                <p className="text-slate-500 font-bold max-w-sm">{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg active:scale-[0.98]">Retry Connection</button>
        </div>
    );

    return (
        <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Stock Batches</h1>
                        <p className="text-slate-500 font-bold">Track barcodes, active pricing, and ensure safe shelf-life.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm mr-2">
                            <button
                                onClick={() => setViewType("grid")}
                                className={`p-2 rounded-xl transition-all duration-300 ${viewType === "grid" ? "bg-white text-indigo-600 shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewType("list")}
                                className={`p-2 rounded-xl transition-all duration-300 ${viewType === "list" ? "bg-white text-indigo-600 shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button onClick={exportCSV} className="flex items-center gap-2 bg-white text-slate-600 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all">
                            <FileDown size={16} /> Export CSV
                        </button>
                        {canEdit && (
                            <button onClick={() => { setError(""); setModalOpen(true); setEditId(null); setFormData({ batch_number: "", expiry_date: "", cost_price: "", selling_price: "", medicine_id: "", barcode: "" }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <Plus size={16} /> Add New Batch
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 min-w-[220px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input type="text" placeholder="Search batch number, medicine or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all" />
                    </div>
                    <select value={filterMedicine} onChange={(e) => setFilterMedicine(e.target.value)} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] uppercase tracking-widest font-black text-slate-600 outline-none cursor-pointer focus:border-indigo-400 shadow-sm appearance-none">
                        <option value="all">All Product Stocks</option>
                        {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
                    </select>
                </div>

                {/* Quick-Filter Navigation */}
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setFilterExpiry('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterExpiry === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                        All Batches
                    </button>
                    <button onClick={() => setFilterExpiry('soon')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterExpiry === 'soon' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50'}`}>
                        <Zap size={12} /> Expiring Soon
                    </button>
                    <button onClick={() => setFilterExpiry('expired')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterExpiry === 'expired' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}>
                        <AlertCircle size={12} /> Expired Supply
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredBatches.length} Batch{filteredBatches.length !== 1 ? 'es' : ''} matched</span>
                </div>

                {viewType === "list" ? (
                    <div className="hidden md:block bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0"></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Batch Identification</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock Quantity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sale Price</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredBatches.map((b) => {
                                        const status = getExpiryStatus(b.expiry_date);
                                        return (
                                            <tr key={b.batch_id} className="group hover:bg-slate-50/50 transition-colors duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-400 shadow-sm group-hover:border-indigo-200 transition-colors duration-300 flex items-center justify-center">
                                                            {b.image_url ? (
                                                                <img src={getImageUrl(b.image_url)} alt={b.medicine_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Lot"; }} />
                                                            ) : (
                                                                <Fingerprint size={18} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight">
                                                                <HighlightText text={b.medicine_name} highlight={searchTerm} />
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                    ID: <HighlightText text={b.batch_number} highlight={searchTerm} />
                                                                </span>
                                                                {b.barcode && (
                                                                    <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                                        <Barcode size={10} /> <HighlightText text={b.barcode} highlight={searchTerm} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            {new Date(b.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${status.color} ${status.bg} ${status.border}`}>
                                                            {status.icon} {status.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${Number(b.current_quantity) <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((Number(b.current_quantity) / 100) * 100, 100)}%` }}></div>
                                                        </div>
                                                        <span className={`text-sm font-black tracking-tight ${Number(b.current_quantity) <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>{b.current_quantity || 0} <span className="text-[10px] text-slate-400 font-bold ml-0.5">Units</span></span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-black text-indigo-600 tracking-tight">NPR {Number(b.selling_price).toFixed(2)}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <button onClick={() => setViewingBatch(b)} className="p-2.5 bg-white text-slate-500 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Eye size={16} /></button>
                                                        {canEdit && (
                                                            <>
                                                                <button onClick={() => handleEdit(b)} className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Edit size={16} /></button>
                                                                {user.role === "admin" && (
                                                                    <button onClick={() => setDeleteConfirmId(b.batch_id)} className="p-2.5 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Trash2 size={16} /></button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBatches.map((b) => {
                            const status = getExpiryStatus(b.expiry_date);
                            const stockPercent = Math.min((Number(b.current_quantity) / 100) * 100, 100);
                            return (
                                <div key={b.batch_id} className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 -z-0"></div>

                                    <div className="relative z-10 space-y-5">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-400 group-hover:border-indigo-200 group-hover:rotate-3 transition-all duration-700 flex items-center justify-center">
                                                {b.image_url ? (
                                                    <img src={getImageUrl(b.image_url)} alt={b.medicine_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Lot"; }} />
                                                ) : (
                                                    <Fingerprint size={24} />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color} ${status.bg} ${status.border} animate-pulse`}>
                                                    {status.label}
                                                </span>
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    ID: <HighlightText text={b.batch_number} highlight={searchTerm} />
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                                <HighlightText text={b.medicine_name} highlight={searchTerm} />
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Calendar size={12} className="text-slate-400" />
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Exp: {new Date(b.expiry_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Stock</p>
                                                <p className={`text-sm font-black ${Number(b.current_quantity) <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>{b.current_quantity || 0} Units</p>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px]">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${Number(b.current_quantity) <= 10 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]'}`} style={{ width: `${stockPercent}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-center">Price</p>
                                                <p className="text-lg font-black text-indigo-600 tracking-tighter leading-none">NPR {Number(b.selling_price).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setViewingBatch(b)} className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"><Eye size={18} /></button>
                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => handleEdit(b)} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"><Edit size={18} /></button>
                                                        {user.role === "admin" && <button onClick={() => setDeleteConfirmId(b.batch_id)} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"><Trash2 size={18} /></button>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mobile View: High-Fidelity Cards */}
                <div className="md:hidden space-y-4">
                    {filteredBatches.map((b) => {
                        const status = getExpiryStatus(b.expiry_date);
                        return (
                            <div key={b.batch_id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-4 active:scale-[0.99] transition-all" onClick={() => setViewingBatch(b)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                                        {b.image_url ? (
                                            <img src={getImageUrl(b.image_url)} alt={b.medicine_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Fingerprint size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-black text-slate-900 truncate tracking-tight">{b.medicine_name}</h3>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Batch: {b.batch_number}</p>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${status.color} ${status.bg} ${status.border}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Qty On Hand</p>
                                        <p className={`text-sm font-black ${Number(b.current_quantity) <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>{b.current_quantity || 0} Units</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Unit Price</p>
                                        <p className="text-sm font-black text-indigo-600">NPR {Number(b.selling_price).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                        <Calendar size={12} className="text-slate-400" />
                                        Exp: {new Date(b.expiry_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setViewingBatch(b)} className="p-2.5 bg-white text-slate-500 rounded-xl border border-slate-200 shadow-sm active:scale-90 transition-transform"><Eye size={14} /></button>
                                        {canEdit && <button onClick={() => handleEdit(b)} className="p-2.5 bg-white text-indigo-600 rounded-xl border border-slate-200 shadow-sm active:scale-90 transition-transform"><Edit size={14} /></button>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredBatches.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                            <Fingerprint size={48} className="mb-4 opacity-20" />
                            <p className="font-black text-sm text-slate-600 uppercase tracking-widest">No Batches Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Fact Sheet */}
            {
                viewingBatch && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-start pt-16 justify-center p-4" onClick={() => setViewingBatch(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            
                            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white relative shrink-0">
                                <button onClick={() => setViewingBatch(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Batch Tracking</p>
                                <h3 className="text-xl font-black tracking-tight leading-tight">{viewingBatch.batch_number}</h3>
                                {viewingBatch.barcode && (
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 bg-slate-800 w-max px-2 py-1 rounded">
                                        <Barcode size={12} /> {viewingBatch.barcode}
                                    </p>
                                )}
                            </div>

                            
                            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-4">
                                    <div className="w-14 h-14 bg-white rounded-xl border border-indigo-200 overflow-hidden flex items-center justify-center shadow-sm">
                                        {viewingBatch.image_url ? (
                                            <img src={getImageUrl(viewingBatch.image_url)} alt={viewingBatch.medicine_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={24} className="text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Medical Context</p>
                                        <p className="text-sm font-black text-slate-800 leading-tight">{viewingBatch.medicine_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                                {viewingBatch.dosage_form || 'Formulation'}
                                            </span>
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                {viewingBatch.strength || 'Standard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-4 rounded-xl border ${getExpiryStatus(viewingBatch.expiry_date).bg} ${getExpiryStatus(viewingBatch.expiry_date).border}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shelf Life</p>
                                            <History size={10} className="text-slate-300" />
                                        </div>
                                        <p className={`text-xs font-black ${getExpiryStatus(viewingBatch.expiry_date).color}`}>{getExpiryStatus(viewingBatch.expiry_date).label}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                                            {Math.ceil((new Date(viewingBatch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) > 0
                                                ? `${Math.ceil((new Date(viewingBatch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} Days Left`
                                                : "Expired"}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Quantities</p>
                                        <p className="text-xl font-black text-slate-800 tracking-tight">{viewingBatch.current_quantity || 0}</p>
                                        <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Units Available</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost Price</p>
                                        <p className="text-sm font-black text-slate-800">NPR {viewingBatch.cost_price}</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Selling Price</p>
                                        <p className="text-sm font-black text-indigo-700">NPR {viewingBatch.selling_price}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                                <button onClick={() => setViewingBatch(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-md">Done</button>
                            </div>
                        </div>
                    </div>
                )
            }

            
            {
                modalOpen && (
                    <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col relative overflow-hidden">
                            
                            <div className="p-5 border-b border-slate-100 bg-white z-10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{editId ? "Update Batch" : "Add New Batch"}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supply Chain Entry</p>
                                </div>
                                <button type="button" onClick={() => setModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"><X size={18} /></button>
                            </div>

                            
                            <form id="batchForm" onSubmit={handleSubmit} className="p-6 bg-white space-y-5 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Select Medicine</label>
                                        <select required disabled={!!editId} value={formData.medicine_id} onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm appearance-none cursor-pointer disabled:opacity-50">
                                            <option value="" disabled hidden>Choose Context</option>
                                            {medicines.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Tracking ID (Batch)</label>
                                        <div className="relative">
                                            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="text" required value={formData.batch_number} onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all text-slate-900" placeholder="e.g. BN-99203" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Expiry Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="date" required value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all text-slate-900 cursor-pointer" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Cost Price (NPR)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="number" step="0.01" required value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all text-slate-900" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Selling Price (NPR)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="number" step="0.01" required value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all text-slate-900" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Product Barcode (UPC)</label>
                                        <div className="relative">
                                            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all text-slate-900" placeholder="Scan or type 890... barcode" />
                                        </div>
                                    </div>
                                </div>
                                {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 text-center">{error}</div>}
                            </form>

                            
                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 z-10 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-[0.5] py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm">Cancel</button>
                                <button type="submit" form="batchForm" className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                                    {editId ? "Save Changes" : "Save Batch Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirm Modal */}
            {
                deleteConfirmId && (
                    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[120] flex items-start pt-32 justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative text-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-[6px] border-rose-100">
                                <AlertTriangle size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Archive Batch?</h3>
                            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This supply chain record will be safely removed from active view but kept for historical audits.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-sm active:scale-95">Cancel</button>
                                <button onClick={executeDelete} className="flex-[1.5] py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/30 transition-all active:scale-95">Confirm Archive</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Notification Center */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
                {notifications.map(n => (
                    <div key={n.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 ${n.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400/30' : 'bg-rose-600/90 text-white border-rose-400/30'}`}>
                        {n.type === 'success' ? <CheckCircle2 size={20} className="animate-bounce" /> : <AlertCircle size={20} className="animate-pulse" />}
                        <p className="font-black text-sm tracking-tight">{n.message}</p>
                    </div>
                ))}
            </div>
        </>
    );
};
export default Batches;
