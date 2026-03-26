import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Package, Loader2, AlertCircle, Eye, Search, FileDown, ShieldAlert, AlertTriangle, Filter, CheckCircle2, Zap, LayoutGrid, List } from "lucide-react";
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, getCategories, IMAGE_BASE_URL } from "../services/api";

const Medicines = () => {
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewingMed, setViewingMed] = useState(null);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'low', 'empty'
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formData, setFormData] = useState({
        name: "", category_id: "", description: "", dosage_form: "",
        strength: "", manufacturer: "", image_url: "", indications: "",
        side_effects: "", requires_prescription: false, imageFile: null
    });
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
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
        if (!formData.imageFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(formData.imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [formData.imageFile]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setModalOpen(false);
                setViewingMed(null);
                setDeleteConfirmId(null);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const fetchData = async () => {
        try {
            const [meds, cats] = await Promise.all([getMedicines(), getCategories()]);
            setMedicines(meds || []);
            setCategories(cats || []);
        } catch (err) {
            setError("Failed to fetch data. The database might be offline.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== "imageFile" && formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });
            if (formData.imageFile) {
                submitData.append("image", formData.imageFile);
            }

            if (editId) {
                await updateMedicine(editId, submitData);
            } else {
                await createMedicine(submitData);
            }
            notify(editId ? "Medicine updated successfully!" : "Medicine added to repository!");
            setModalOpen(false);
            setEditId(null);
            fetchData();
        } catch (err) {
            setError(err.message || "Operation failed.");
        }
    };

    const handleEdit = (med) => {
        setFormData({
            name: med.name || "",
            category_id: med.category_id || "",
            description: med.description || "",
            dosage_form: med.dosage_form || "",
            strength: med.strength || "",
            manufacturer: med.manufacturer || "",
            image_url: med.image_url || "",
            indications: med.indications || "",
            side_effects: med.side_effects || "",
            requires_prescription: med.requires_prescription ? true : false,
            imageFile: null
        });
        setError("");
        setEditId(med.medicine_id);
        setModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteMedicine(deleteConfirmId);
            notify("Medicine archived successfully!");
            setDeleteConfirmId(null);
            fetchData();
        } catch (err) {
            alert("Failed to remove medicine.");
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http") && !url.includes(IMAGE_BASE_URL)) return url;
        // Normalize leading slash
        const path = url.startsWith("/") ? url : `/${url}`;
        // Add cache buster for database images
        return `${IMAGE_BASE_URL}${path}?t=${Date.now()}`;
    };

    const exportCSV = () => {
        if (!medicines.length) return;
        const headers = ["Item ID", "Name", "Category", "Medicine Type", "Power/Size", "Manufacturer", "Requires RX", "Master Stock"];
        const rows = medicines.map(m => [
            `Item-${m.medicine_id}`, `"${m.name}"`, `"${m.category_name || 'General'}"`,
            `"${m.dosage_form || 'N/A'}"`, `"${m.strength || 'N/A'}"`, `"${m.manufacturer || 'N/A'}"`,
            m.requires_prescription ? 'Yes' : 'No', m.total_stock || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Master_Stock_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredMedicines = medicines.filter(med => {
        const matchesSearch = (med.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (med.manufacturer || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === "all" || (med.category_id && med.category_id.toString() === filterCategory);

        let matchesStatus = true;
        if (filterStatus === 'low') matchesStatus = med.total_stock > 0 && med.total_stock <= 10;
        else if (filterStatus === 'empty') matchesStatus = med.total_stock <= 0;

        return matchesSearch && matchesCat && matchesStatus;
    });

    const HighlightText = ({ text, highlight }) => {
        if (!highlight.trim() || !text) return <>{text}</>;
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
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

    if (error && medicines.length === 0) return (
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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Stock Items</h1>
                        <p className="text-slate-500 font-bold">Manage your pharmacy's medicine catalog, stock levels, and clinical data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 mr-2 shadow-inner">
                            <button onClick={() => setViewType("grid")} className={`p-2 rounded-xl transition-all duration-300 ${viewType === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`} title="Grid View">
                                <LayoutGrid size={16} />
                            </button>
                            <button onClick={() => setViewType("list")} className={`p-2 rounded-xl transition-all duration-300 ${viewType === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`} title="List View">
                                <List size={16} />
                            </button>
                        </div>

                        <button onClick={exportCSV} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm active:scale-95">
                            <FileDown size={16} /> Export CSV
                        </button>
                        {canEdit && (
                            <button onClick={() => { setError(""); setPreviewUrl(null); setModalOpen(true); setEditId(null); setFormData({ name: "", category_id: "", description: "", dosage_form: "", strength: "", manufacturer: "", image_url: "", indications: "", side_effects: "", requires_prescription: false, imageFile: null }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <Plus size={16} /> Add New Medicine
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 min-w-[220px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input type="text" placeholder="Search medicines or manufacturer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all" />
                    </div>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] uppercase tracking-widest font-black text-slate-600 outline-none cursor-pointer focus:border-indigo-400 shadow-sm appearance-none">
                        <option value="all">All Medicine Groups</option>
                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Quick-Filter Navigation */}
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                        All Inventory
                    </button>
                    <button onClick={() => setFilterStatus('low')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === 'low' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50'}`}>
                        <Zap size={12} /> Low Stock
                    </button>
                    <button onClick={() => setFilterStatus('empty')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === 'empty' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}>
                        <AlertTriangle size={12} /> Out of Stock
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredMedicines.length} Item{filteredMedicines.length !== 1 ? 's' : ''} matched</span>
                </div>

                {/* Dynamic View: Table (List) or Grid */}
                {viewType === "list" ? (
                    <div className="hidden md:block bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0"></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medicine Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Group & Type</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Master Stock</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredMedicines.map((med) => (
                                        <tr key={med.medicine_id} className="group hover:bg-slate-50/50 transition-colors duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 shrink-0 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                                                        {med.image_url ?
                                                            <img src={getImageUrl(med.image_url)} alt={med.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Rx"; }} /> :
                                                            <Package className="text-slate-300" size={20} />
                                                        }
                                                        {med.requires_prescription && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center" title="Prescription Required">
                                                                <ShieldAlert className="text-white" size={8} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                                                            <HighlightText text={med.name} highlight={searchTerm} />
                                                            {med.requires_prescription && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100">RX</span>}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                                                            <span>Item ID: ITM-{med.medicine_id.toString().padStart(4, '0')}</span>
                                                            {med.manufacturer && <span className="text-slate-300">•</span>}
                                                            {med.manufacturer && <span><HighlightText text={med.manufacturer} highlight={searchTerm} /></span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1.5">
                                                    <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">{med.category_name || "General"}</span>
                                                    {(med.dosage_form || med.strength) && (
                                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                                            {med.dosage_form} <span className="text-slate-300">•</span> {med.strength}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${Number(med.total_stock) <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((Number(med.total_stock) / 200) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className={`text-sm font-black tracking-tight ${Number(med.total_stock) <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{med.total_stock || 0} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-0.5">Units</span></p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <button onClick={() => setViewingMed(med)} className="p-2.5 bg-white text-slate-500 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Eye size={16} /></button>
                                                    {canEdit && (
                                                        <>
                                                            <button onClick={() => handleEdit(med)} className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Edit size={16} /></button>
                                                            {user.role === "admin" && (
                                                                <button onClick={() => setDeleteConfirmId(med.medicine_id)} className="p-2.5 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"><Trash2 size={16} /></button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredMedicines.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                                <Package size={64} className="mb-6 opacity-20" />
                                <p className="font-black text-lg text-slate-600">No Items Found</p>
                                <p className="text-sm font-bold text-slate-400 mt-1">Try a different search or click "Add New Medicine".</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredMedicines.map((med) => (
                            <div key={med.medicine_id} className="group bg-white rounded-[2.5rem] border border-slate-100 premium-shadow p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:w-32 group-hover:h-32"></div>

                                <div className="flex items-start gap-4 mb-6 relative">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                        {med.image_url ?
                                            <img src={getImageUrl(med.image_url)} alt={med.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> :
                                            <Package size={24} className="text-slate-200" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-100">{med.category_name || "General"}</span>
                                            {med.requires_prescription && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100">Prescription Required</span>}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                            <HighlightText text={med.name} highlight={searchTerm} />
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ITM-{med.medicine_id.toString().padStart(4, '0')} • {med.dosage_form || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.75rem] border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Stock</p>
                                            <p className={`text-lg font-black tracking-tight ${Number(med.total_stock) <= 10 ? 'text-rose-600' : 'text-slate-800'}`}>{med.total_stock || 0} Units</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <div className="relative w-8 h-8">
                                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                                    <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                    <path className={Number(med.total_stock) <= 10 ? "text-rose-500" : "text-emerald-500"} strokeDasharray={`${Math.min((Number(med.total_stock) / 200) * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => setViewingMed(med)} className="flex-1 bg-white hover:bg-slate-900 hover:text-white text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Eye size={14} /> View Profile
                                        </button>
                                        {canEdit && (
                                            <button onClick={() => handleEdit(med)} className="p-3 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95">
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        {user.role === "admin" && (
                                            <button onClick={() => setDeleteConfirmId(med.medicine_id)} className="p-3 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mobile View: High-Fidelity Cards */}
                <div className="md:hidden space-y-4">
                    {filteredMedicines.map((med) => (
                        <div key={med.medicine_id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-4 active:scale-[0.99] transition-all" onClick={() => setViewingMed(med)}>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
                                    {med.image_url ?
                                        <img src={getImageUrl(med.image_url)} alt={med.name} className="w-full h-full object-cover" /> :
                                        <Package className="text-slate-300" size={24} />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-slate-900 truncate tracking-tight leading-tight">{med.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{med.category_name || "General"}</p>
                                </div>
                                <div className="flex flex-col gap-1 items-end shrink-0">
                                    {med.requires_prescription && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100">RX</span>}
                                    <span className="text-[9px] font-black text-slate-400">ID: {med.medicine_id}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Master Stock</p>
                                    <p className={`text-sm font-black ${Number(med.total_stock) <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>{med.total_stock || 0} Units</p>
                                </div>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setViewingMed(med)} className="p-3 bg-white text-slate-500 rounded-xl border border-slate-200 shadow-sm active:scale-90 transition-transform"><Eye size={16} /></button>
                                    {canEdit && <button onClick={() => handleEdit(med)} className="p-3 bg-white text-indigo-600 rounded-xl border border-slate-200 shadow-sm active:scale-90 transition-transform"><Edit size={16} /></button>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredMedicines.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                            <Package size={48} className="mb-4 opacity-20" />
                            <p className="font-black text-sm text-slate-600 uppercase tracking-widest">No Items Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fact Sheet */}
            {viewingMed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-start pt-16 justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-start gap-4 bg-slate-50 relative shrink-0">
                            <button onClick={() => setViewingMed(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 bg-white rounded-lg shadow-sm border border-slate-200 transition-colors"><X size={16} /></button>
                            <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 p-1 flex-shrink-0">
                                {viewingMed.image_url ?
                                    <img src={getImageUrl(viewingMed.image_url)} alt="" className="w-full h-full object-contain rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Rx"; }} /> :
                                    <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center text-slate-300"><Package size={20} /></div>
                                }
                            </div>
                            <div className="pr-6">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{viewingMed.category_name || "General"}</p>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">{viewingMed.name}</h3>
                                {viewingMed.manufacturer && <p className="text-[10px] font-bold text-indigo-600 mt-1">{viewingMed.manufacturer}</p>}
                            </div>
                        </div>

                        {/* Scrolling Body */}
                        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Power / Size</p>
                                    <p className="text-xs font-black text-slate-800">{viewingMed.strength || "N/A"}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Medicine Type</p>
                                    <p className="text-xs font-black text-slate-800">{viewingMed.dosage_form || "N/A"}</p>
                                </div>
                            </div>

                            {viewingMed.description && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ShieldAlert size={12} /> Simple Summary</p>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{viewingMed.description}</p>
                                </div>
                            )}

                            {viewingMed.indications && (
                                <div>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Helps With / Used For</p>
                                    <p className="text-xs font-bold text-indigo-900 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">{viewingMed.indications}</p>
                                </div>
                            )}

                            {viewingMed.side_effects && (
                                <div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Side Effects & Risks</p>
                                    <p className="text-xs font-bold text-amber-900 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">{viewingMed.side_effects}</p>
                                </div>
                            )}

                            {viewingMed.requires_prescription && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-black text-rose-600">
                                    <ShieldAlert size={16} /> Prescription Required
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Edit Form Modal*/}
            {
                modalOpen && (
                    <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col relative overflow-hidden">

                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 bg-white shrink-0 z-10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{editId ? "Update Medicine" : "Add New Medicine"}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inventory Data Entry</p>
                                </div>
                                <button type="button" onClick={() => setModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"><X size={18} /></button>
                            </div>

                            {/* Form Body */}
                            <form id="medForm" onSubmit={handleSubmit} className="p-6 bg-white space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Full Name</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm" placeholder="e.g. Paracetamol" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Medicine Group</label>
                                        <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm appearance-none cursor-pointer">
                                            <option value="" disabled hidden>Choose Group</option>
                                            {categories.map((cat) => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Power / Size</label>
                                        <input type="text" value={formData.strength} onChange={(e) => setFormData({ ...formData, strength: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm" placeholder="e.g. 500mg" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Medicine Type</label>
                                        <select value={formData.dosage_form} onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm appearance-none cursor-pointer">
                                            <option value="" disabled hidden>Select Type</option>
                                            <option value="Tablet">Tablet</option>
                                            <option value="Capsule">Capsule</option>
                                            <option value="Syrup">Syrup</option>
                                            <option value="Injection">Injection</option>
                                            <option value="Ointment">Ointment</option>
                                            <option value="Drops">Drops</option>
                                            <option value="Inhaler">Inhaler</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Manufacturer</label>
                                        <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm" placeholder="e.g. GSK, Pfizer" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><ShieldAlert size={10} /> Simple Summary</label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm font-bold text-slate-900 shadow-sm min-h-[50px] custom-scrollbar" placeholder="General info about this item..." rows="2" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1 block">What it treats (Used For)</label>
                                        <textarea value={formData.indications} onChange={(e) => setFormData({ ...formData, indications: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-indigo-50/30 border border-indigo-100 focus:border-indigo-400 outline-none text-sm font-bold text-indigo-900 shadow-sm min-h-[50px] custom-scrollbar" placeholder="e.g. Relieves pain..." rows="2" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1 block">Side Effects & Risks</label>
                                        <textarea value={formData.side_effects} onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-amber-50/30 border border-amber-100 focus:border-amber-400 outline-none text-sm font-bold text-amber-900 shadow-sm min-h-[50px] custom-scrollbar" placeholder="e.g. Nausea, headache..." rows="2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Product Photo</label>
                                        <div className="flex items-center gap-4">
                                            {(previewUrl || formData.image_url) && (
                                                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                                                    <img
                                                        key={previewUrl || formData.image_url}
                                                        src={previewUrl || getImageUrl(formData.image_url)}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                                                    />
                                                </div>
                                            )}
                                            <div className="relative overflow-hidden flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-400 flex items-center justify-between shadow-sm cursor-pointer hover:bg-slate-100 transition-colors">
                                                <span className="text-sm font-bold text-slate-500 truncate">
                                                    {formData.imageFile ? formData.imageFile.name : (formData.image_url ? "Change Photo" : "Choose Photo")}
                                                </span>
                                                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 border border-rose-100 bg-rose-50 rounded-xl cursor-pointer" onClick={(e) => { e.preventDefault(); setFormData({ ...formData, requires_prescription: !formData.requires_prescription }); }}>
                                        <input type="checkbox" checked={formData.requires_prescription} onChange={() => { }} className="w-4 h-4 text-rose-600 border-rose-300 rounded focus:ring-rose-500" />
                                        <span className="ml-2 text-[10px] font-black text-rose-700 uppercase tracking-widest">Requires Prescription</span>
                                    </div>
                                </div>

                                {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 text-center">{error}</div>}
                            </form>

                            {/* Fixed Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 z-10 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-[0.5] py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm">Cancel</button>
                                <button type="submit" form="medForm" className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                                    {editId ? "Save Changes" : "Save Medicine"}
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
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Archive Record?</h3>
                            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This medicine will be safely removed from active view but kept for historical audits.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-sm active:scale-95">Cancel</button>
                                <button onClick={executeDelete} className="flex-[1.5] py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/30 transition-all active:scale-95">Confirm Archive</button>
                            </div>
                        </div>
                    </div>
                )}

            {/* Notification Center */}
            {notifications.length > 0 && <ToastOverlay notifications={notifications} />}
        </>
    );
};

// Floating Notifications Component
const ToastOverlay = ({ notifications }) => (
    <div className="fixed bottom-10 right-10 z-[300] flex flex-col items-end pointer-events-none">
        {notifications.map(n => (
            <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 mb-4 backdrop-blur-xl pointer-events-auto min-w-[300px] ${n.type === "success" ? "bg-slate-900/90 border-slate-700 text-white" : "bg-rose-600 border-rose-500 text-white"
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/20 text-white"}`}>
                    {n.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-0.5">{n.type === "success" ? "System Success" : "Action Failed"}</p>
                    <p className="text-[13px] font-bold tracking-tight">{n.message}</p>
                </div>
            </div>
        ))}
    </div>
);

export default Medicines;
