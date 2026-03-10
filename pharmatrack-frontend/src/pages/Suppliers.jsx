import { useState, useEffect, useMemo } from "react";
import {
    Plus, Edit, Trash2, X, Truck, Loader2, AlertCircle,
    Phone, Mail, MapPin, TrendingUp, ShoppingCart,
    Activity, Power, Search, Filter, History, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    getSuppliers, createSupplier, updateSupplier,
    deleteSupplier, toggleSupplierStatus
} from "../services/api";

const Suppliers = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ supplier_name: "", phone: "", email: "", address: "" });

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [error, setError] = useState("");
    const [toggling, setToggling] = useState(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canEdit = ["admin", "pharmacist"].includes(user.role);

    const fetchData = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err) {
            setError("Failed to load suppliers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => {
            const matchesSearch = s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.email || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" ? s.is_active : !s.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const active = suppliers.filter(s => s.is_active).length;
        const totalSpent = suppliers.reduce((sum, s) => sum + Number(s.total_spent || 0), 0);
        return { active, totalSpent, count: suppliers.length };
    }, [suppliers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (editId) {
                await updateSupplier(editId, formData);
            } else {
                await createSupplier(formData);
            }
            setModalOpen(false);
            setFormData({ supplier_name: "", phone: "", email: "", address: "" });
            setEditId(null);
            fetchData();
        } catch (err) {
            setError(err.message || "Operation failed.");
        }
    };

    const handleToggleStatus = async (id) => {
        setToggling(id);
        try {
            await toggleSupplierStatus(id);
            fetchData();
        } catch (err) {
            alert("Failed to toggle status.");
        } finally {
            setToggling(null);
        }
    };

    const handleEdit = (sup) => {
        setFormData({
            supplier_name: sup.supplier_name,
            phone: sup.phone,
            email: sup.email,
            address: sup.address
        });
        setEditId(sup.supplier_id);
        setModalOpen(true);
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Supply Network</h1>
                    <p className="text-sm sm:text-base text-slate-500 font-bold">Manage your suppliers and spend metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group hidden sm:block">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 rounded-3xl bg-white border border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all w-64 font-bold text-sm"
                        />
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => { setModalOpen(true); setEditId(null); setFormData({ supplier_name: "", phone: "", email: "", address: "" }); }}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-bold shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all flex items-center gap-3"
                        >
                            <Plus size={20} />
                            Add Supplier
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                        <Truck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Suppliers</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.count}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                        <Activity size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.active}</h3>
                    </div>
                </div>

                <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mb-1">Total Spent</p>
                        <h3 className="text-3xl font-black text-white">NPR {(stats.totalSpent / 1000).toFixed(1)}K</h3>
                    </div>
                </div>
            </div>

            {/* Search (Mobile) */}
            <div className="sm:hidden relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-100 font-bold text-sm"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${statusFilter === "all" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-100"}`}
                >
                    All Suppliers
                </button>
                <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${statusFilter === "active" ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-100"}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setStatusFilter("inactive")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${statusFilter === "inactive" ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-100"}`}
                >
                    Inactive
                </button>
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSuppliers.map((sup) => (
                    <div key={sup.supplier_id} className="group relative bg-white rounded-[3rem] p-8 border border-slate-50 hover:border-indigo-100 transition-all duration-300">
                        <div className="absolute top-8 right-8">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${sup.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {sup.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex items-center gap-5 mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${sup.is_active ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-400 shadow-slate-400/20'}`}>
                                <Truck size={24} />
                            </div>
                            <div className="min-w-0 pr-16">
                                <h3 className="text-xl font-black text-slate-900 leading-tight">{sup.supplier_name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    NPR {Number(sup.total_spent || 0).toLocaleString()} Spent
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-50/50 rounded-[2rem] p-5 border border-slate-100 text-center">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Orders</p>
                                <p className="text-sm font-black text-slate-900">{sup.total_orders}</p>
                            </div>
                            <div className="space-y-1 border-x border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Last Order</p>
                                <p className="text-[10px] font-black text-slate-900">{sup.last_order_date ? new Date(sup.last_order_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase">ID No.</p>
                                <p className="text-sm font-black text-slate-900">#{sup.supplier_id}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 text-slate-500">
                            <div className="flex items-center gap-3">
                                <Phone size={14} className="text-slate-400" />
                                <span className="text-xs font-bold">{sup.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={14} className="text-slate-400" />
                                <span className="text-xs font-bold truncate">{sup.email || "N/A"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                            {canEdit && (
                                <>
                                    <button
                                        onClick={() => handleToggleStatus(sup.supplier_id)}
                                        disabled={toggling === sup.supplier_id}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${sup.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                        {toggling === sup.supplier_id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                                        {sup.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => handleEdit(sup)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                                        <Edit size={16} />
                                    </button>
                                </>
                            )}
                            {sup.is_active && (
                                <button
                                    onClick={() => navigate('/purchases')}
                                    className="w-12 h-12 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 rounded-2xl flex items-center justify-center transition-all"
                                >
                                    <ShoppingCart size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredSuppliers.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                    <Truck size={64} className="opacity-20 mb-4" />
                    <p className="font-bold text-lg">No suppliers found.</p>
                </div>
            )}

            {/* MODAL - CENTERED IN VIEWPORT */}
            {modalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setModalOpen(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute top-8 right-8 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                {editId ? "Edit Supplier" : "Add Supplier"}
                            </h2>
                            <p className="text-slate-500 text-sm font-bold">Simple details below.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supplier Name</label>
                                <input
                                    required
                                    value={formData.supplier_name}
                                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm"
                                    placeholder="Company name"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 text-sm"
                                        placeholder="+977..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 text-sm"
                                        placeholder="email@..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 text-sm resize-none"
                                    placeholder="Location..."
                                />
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-[10px] font-black uppercase text-center border border-rose-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-4.5 rounded-[1.8rem] font-black text-base shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                style={{ padding: '1.125rem' }}
                            >
                                {editId ? "Update Supplier" : "Add Supplier"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
