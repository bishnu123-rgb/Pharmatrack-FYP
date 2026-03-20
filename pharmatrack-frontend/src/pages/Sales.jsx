import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Loader2, CheckCircle, AlertCircle, Search, User, Phone, X, Filter, Sparkles, Receipt, ShieldAlert, Info, Eye } from "lucide-react";
import { getBatches, createSale, getCategories, getSales, getSaleById, getSalesStats } from "../services/api";

const Sales = () => {
    const [batches, setBatches] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [categories, setCategories] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [lastSaleId, setLastSaleId] = useState(null);
    const [activeTab, setActiveTab] = useState("selection"); // 'selection' or 'bill' for mobile
    const [lastSaleData, setLastSaleData] = useState(null);
    const [sales, setSales] = useState([]);
    const [salesStats, setSalesStats] = useState({ daily_revenue: 0, transaction_count: 0, top_medicine: "None" });
    const [viewMode, setViewMode] = useState("pos"); // 'pos' or 'history'
    const [selectedSale, setSelectedSale] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [batchData, catData, salesData, statsData] = await Promise.all([
                getBatches(),
                getCategories(),
                getSales(),
                getSalesStats()
            ]);
            // Only show unexpired batches with stock in the selection panel
            const valid = (batchData || []).filter(b => new Date(b.expiry_date) > new Date() && b.current_quantity > 0);
            setBatches(valid);
            setCategories(catData || []);
            setSales(salesData || []);
            setSalesStats(statsData || { daily_revenue: 0, transaction_count: 0, top_medicine: "None" });
        } catch (err) {
            setError("Failed to fetch system data");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const filteredSales = (sales || []).filter(s =>
            s.sale_id.toString().includes(historySearchTerm) ||
            (s.customer_name || "").toLowerCase().includes(historySearchTerm.toLowerCase())
        );

        if (filteredSales.length === 0) return;

        const headers = ["Sale ID", "Date", "Customer", "Phone", "Sold By", "Total Amount"];
        const rows = filteredSales.map(s => [
            `SAL-${s.sale_id.toString().padStart(6, '0')}`,
            new Date(s.sale_date).toLocaleDateString(),
            s.customer_name || "Guest Customer",
            s.customer_phone || "N/A",
            s.sold_by_name || "N/A",
            s.total_amount
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pharmatrack_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const addToCart = (batch) => {
        const existing = cart.find(item => item.batch_id === batch.batch_id);
        if (existing) {
            if (existing.quantity >= batch.current_quantity) {
                return;
            }
            setCart(cart.map(item =>
                item.batch_id === batch.batch_id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                batch_id: batch.batch_id,
                medicine_name: batch.medicine_name,
                batch_number: batch.batch_number,
                unit_price: batch.selling_price,
                quantity: 1,
                max: batch.current_quantity
            }]);
        }
    };

    const removeFromCart = (batch_id) => {
        setCart(cart.filter(item => item.batch_id !== batch_id));
    };

    const updateQuantity = (batch_id, q) => {
        const item = cart.find(i => i.batch_id === batch_id);
        if (q > item.max) return;
        if (q < 1) return;
        setCart(cart.map(i => i.batch_id === batch_id ? { ...i, quantity: q } : i));
    };

    const total = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        setError("");
        try {
            const saleItems = cart.map(item => ({
                batch_id: item.batch_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            const payload = {
                items: saleItems,
                customer_name: customerName,
                customer_phone: customerPhone
            };
            const res = await createSale(payload);

            setLastSaleData({
                ...payload,
                cart: [...cart], // clone cart for listing items in invoice
                sale_id: res.sale_id,
                date: new Date().toLocaleString(),
                total: total
            });

            setLastSaleId(res.sale_id);
            setSuccess(true);
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            fetchData();
        } catch (err) {
            setError(err.message || "Failed to complete the sale.");
        } finally {
            setSubmitting(false);
        }
    };

    const isNearExpiry = (date) => {
        const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 90;
    };

    const filteredBatches = batches.filter(b => {
        const matchesSearch = (b.medicine_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.batch_number || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === "all" || b.category_id?.toString() === filterCategory;

        return matchesSearch && matchesCat;
    });

    const highlightText = (text, highlight, colorClasses = "bg-indigo-500/20 text-indigo-600") => {
        if (!text) return "";
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight})`, "gi");
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) => (
                    regex.test(part) ? (
                        <span key={i} className={`${colorClasses} rounded-sm px-0.5`}>{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                ))}
            </span>
        );
    };

    const handleViewSaleDetails = async (saleId) => {
        setIsDetailLoading(true);
        try {
            const data = await getSaleById(saleId);
            setSelectedSale(data);
        } catch (err) {
            setError("Failed to load transaction details");
        } finally {
            setIsDetailLoading(false);
        }
    };

    if (success) return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-100 border-2 border-emerald-100">
                <CheckCircle size={48} className="animate-bounce" />
            </div>
            <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sale Completed!</h2>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">
                    Transaction ID: <span className="text-indigo-600">SAL-{lastSaleId?.toString().padStart(6, '0')}</span> has been recorded successfully.
                </p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setSuccess(false)}
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                    New Transaction
                </button>
                <button
                    onClick={() => {
                        window.print();
                    }}
                    className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2"
                >
                    Print Receipt <Receipt size={16} />
                </button>
            </div>

            
            {lastSaleData && (
                <div className="hidden print:block fixed inset-0 bg-white p-8 text-slate-900 z-[9999] overflow-y-auto">
                    <div className="max-w-[400px] mx-auto space-y-6">
                        <div className="text-center space-y-2 border-b-2 border-slate-100 pb-6">
                            <h1 className="text-2xl font-black tracking-tight text-indigo-600">PHARMATRACK</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Customer Invoice</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                <p className="font-black text-slate-800">{lastSaleData.customer_name || 'Guest Customer'}</p>
                                <p className="font-bold text-slate-500">{lastSaleData.customer_phone || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Info</p>
                                <p className="font-black text-slate-800">#SAL-{lastSaleData.sale_id.toString().padStart(6, '0')}</p>
                                <p className="font-bold text-slate-500">{lastSaleData.date}</p>
                            </div>
                        </div>

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Medicine</th>
                                    <th className="py-3 text-center font-black text-slate-400 uppercase tracking-widest text-[9px]">Qty</th>
                                    <th className="py-3 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lastSaleData.cart.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50">
                                        <td className="py-3 font-black text-slate-800">{item.medicine_name}</td>
                                        <td className="py-3 text-center font-bold">{item.quantity}</td>
                                        <td className="py-3 text-right font-black">NPR {item.unit_price * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pt-4 space-y-2 border-t-2 border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Amount</span>
                                <span className="text-xl font-black text-indigo-600">NPR {lastSaleData.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-center pt-8 opacity-50">
                            <p className="text-[10px] font-black uppercase tracking-widest">Thank you for your visit!</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1">Pharmacy Terminal Powered by PharmaTrack ELITE</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
        </div>
    );

    if (error && batches.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sales Counter Offline</h2>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">
                    {error || "Could not load medicine list at this time."}
                </p>
            </div>
            <button
                onClick={() => fetchData()}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pharmacy Counter</h1>
                        <p className="text-slate-500 font-bold">Create bills or browse your sales history.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm relative z-20">
                        <button
                            onClick={() => setViewMode("pos")}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'pos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            POS Terminal
                        </button>
                        <button
                            onClick={() => setViewMode("history")}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            History Log
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="px-4 py-2 bg-indigo-50 rounded-xl">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Available Items</p>
                            <p className="text-sm font-black text-indigo-600 leading-none">{filteredBatches.length}</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Bill Queue</p>
                            <p className="text-sm font-black text-emerald-600 leading-none">{cart.length}</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Tab Switcher */}
                <div className="lg:hidden flex p-1 bg-slate-100 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveTab('selection')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'selection' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Medicine Selection
                    </button>
                    <button
                        onClick={() => setActiveTab('bill')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'bill' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Billing Terminal
                        {cart.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
                    </button>
                </div>

                {viewMode === "pos" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* Optimized Inventory Selection */}
                        <div className={`lg:col-span-7 space-y-6 ${activeTab !== 'selection' ? 'hidden lg:block' : ''}`}>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative group flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by medicine name or batch ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] uppercase tracking-widest font-black text-slate-600 outline-none cursor-pointer focus:border-indigo-400 shadow-sm appearance-none min-w-[180px]"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                                </select>
                            </div>





                            <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
                                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Item</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In Stock</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Sale Price</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredBatches.map((b) => (
                                                <tr key={b.batch_id} className="group hover:bg-slate-50 transition-all duration-300">
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1.5 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-black text-slate-800 leading-tight">{highlightText(b.medicine_name, searchTerm)}</p>
                                                                {b.requires_prescription && (
                                                                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100">RX</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">ID-{highlightText(b.batch_number, searchTerm)}</span>
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-500 border border-slate-100">{b.category_name || "General"}</span>
                                                                {(b.dosage_form || b.strength) && (
                                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50/50 px-1.5 py-0.5 rounded">
                                                                        <Info size={10} className="text-slate-300" />
                                                                        {b.dosage_form && <span>{b.dosage_form}</span>}
                                                                        {b.dosage_form && b.strength && <span className="text-slate-200">|</span>}
                                                                        {b.strength && <span>{b.strength}</span>}
                                                                    </span>
                                                                )}
                                                                {isNearExpiry(b.expiry_date) && (
                                                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">Near Expiry</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={`text-xs font-black ${b.current_quantity <= 15 ? 'text-rose-600' : 'text-slate-700'}`}>{b.current_quantity}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-sm font-black text-slate-900 whitespace-nowrap">NPR {b.selling_price}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => addToCart(b)}
                                                            disabled={cart.find(i => i.batch_id === b.batch_id)?.quantity >= b.current_quantity}
                                                            className="inline-flex items-center justify-center w-10 h-10 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-90 disabled:opacity-20"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredBatches.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Sparkles size={40} className="text-slate-200" />
                                                            <p className="text-sm font-bold uppercase tracking-widest">No matching medicines found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Premium Billing Terminal */}
                        <div className={`lg:col-span-5 space-y-6 lg:sticky lg:top-8 ${activeTab !== 'bill' ? 'hidden lg:block' : ''}`}>
                            <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 flex flex-col min-h-[650px] relative overflow-hidden text-white border border-slate-800 animate-in slide-in-from-right-8 duration-500">
                                {/* Dynamic Background */}
                                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
                                <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]"></div>

                                <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10">
                                            <Receipt size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight">Billing Terminal</h2>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Terminal ID: PT-BK-{new Date().getFullYear()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCart([])}
                                        className="text-[10px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                        <X size={12} /> Reset
                                    </button>
                                </div>

                                {/* Customer Metadata Entry */}
                                <div className="px-8 pt-6 space-y-4 relative z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Name</label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                                <input
                                                    type="text"
                                                    placeholder="Guest Customer"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Phone</label>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                                <input
                                                    type="text"
                                                    placeholder="+977-XXXXXXXXXX"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar-dark relative z-10">
                                    {cart.length === 0 ? (
                                        <div className="h-[250px] flex flex-col items-center justify-center text-slate-700">
                                            <ShoppingCart size={48} className="mb-4 opacity-5" />
                                            <p className="font-bold text-sm opacity-20">Transaction queue is empty</p>
                                            <p className="text-[9px] uppercase tracking-widest mt-1 font-black opacity-10">Select medicines to begin</p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div key={item.batch_id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4 hover:bg-white/10 transition-colors group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-black text-white leading-tight truncate">{item.medicine_name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Lot: {item.batch_number}</p>
                                                            {item.expiry_date && isNearExpiry(item.expiry_date) && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.batch_id)} className="text-slate-700 hover:text-rose-400 transition-colors shrink-0">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 bg-slate-950/50 border border-white/5 rounded-xl p-1 px-3">
                                                        <button
                                                            onClick={() => updateQuantity(item.batch_id, item.quantity - 1)}
                                                            className="text-slate-500 hover:text-indigo-400 transition-colors font-black text-sm"
                                                        >−</button>
                                                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.batch_id, item.quantity + 1)}
                                                            className="text-slate-500 hover:text-indigo-400 transition-colors font-black text-sm"
                                                        >+</button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Subtotal</p>
                                                        <p className="text-xs font-black text-indigo-400">NPR {item.unit_price * item.quantity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-8 border-t border-white/5 bg-slate-950/30 backdrop-blur-xl relative z-10">
                                    <div className="mb-6 flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Bill Amount</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-slate-400 text-sm font-black italic">NPR</span>
                                                <h3 className="text-4xl font-black tracking-tight text-white">{total.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <CheckCircle size={10} /> Validated
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 text-center mb-6 animate-shake">
                                            <AlertCircle size={14} className="inline mr-2 align-text-top" />
                                            {error}
                                        </div>
                                    ) || (
                                            <div className="text-[10px] text-slate-500 text-center mb-6 font-bold flex items-center justify-center gap-2 uppercase tracking-widest">
                                                By confirming, you agree to recorded stock deductions.
                                            </div>
                                        )}

                                    <button
                                        onClick={handleCheckout}
                                        disabled={cart.length === 0 || submitting}
                                        className={`w-full py-5 rounded-[1.5rem] font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 active:scale-[0.98]
                                    ${cart.length === 0 || submitting
                                                ? "bg-slate-800 text-slate-600 grayscale cursor-not-allowed opacity-50"
                                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40"
                                            }
                                `}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : <>Complete Bill <Receipt size={20} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Daily Sales Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] premium-shadow border border-slate-100 flex items-center gap-5 group hover:border-indigo-100 transition-all">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Sparkles size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Today</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">NPR {salesStats.daily_revenue || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] premium-shadow border border-slate-100 flex items-center gap-5 group hover:border-emerald-100 transition-all">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Receipt size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">{salesStats.transaction_count || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] premium-shadow border border-slate-100 flex items-center gap-5 group hover:border-amber-100 transition-all">
                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Product</p>
                                    <p className="text-sm font-black text-slate-900 leading-tight line-clamp-1">{salesStats.top_medicine || 'None'}</p>
                                </div>
                            </div>
                        </div>

                        {/* History Search & Export */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative group flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by Transaction ID or Customer Name..."
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95">
                                <CheckCircle size={14} /> Download CSV Report
                            </button>
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-slate-100 backdrop-blur-md">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sale ID</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(sales || []).filter(s =>
                                            s.sale_id.toString().includes(historySearchTerm) ||
                                            (s.customer_name || "").toLowerCase().includes(historySearchTerm.toLowerCase())
                                        ).map((s) => (
                                            <tr key={s.sale_id} className="group hover:bg-slate-50 transition-all duration-300">
                                                <td className="px-8 py-5">
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                                        #SAL-{s.sale_id.toString().padStart(6, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <span className="text-xs font-bold">{new Date(s.sale_date).toLocaleDateString()}</span>
                                                        <span className="text-[10px] font-black text-slate-300 uppercase">{new Date(s.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black text-slate-800">{highlightText(s.customer_name || "Guest Customer", historySearchTerm)}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{s.customer_phone || "No phone recorded"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-black text-slate-900 whitespace-nowrap">NPR {s.total_amount}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleViewSaleDetails(s.sale_id)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!sales || sales.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Receipt size={40} className="text-slate-200" />
                                                        <p className="text-sm font-bold uppercase tracking-widest">No transaction history found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {selectedSale && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight transition-colors">Sale Fact Sheet</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reference #SAL-{selectedSale.sale_id.toString().padStart(6, '0')}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Customer Info Card: Tighter */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedSale.customer_name || 'Walking Customer'}</p>
                                    <p className="text-[10px] font-bold text-slate-500 leading-tight">{selectedSale.customer_phone || 'Unlisted'}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedSale.sold_by_name || 'POS User'}</p>
                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-tight">{new Date(selectedSale.sale_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            
                            <div className="space-y-3">
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Itemization</h3>
                                <div className="space-y-2">
                                    {selectedSale.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-black text-slate-800 leading-tight truncate">{item.medicine_name}</p>
                                                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 uppercase tracking-widest shrink-0">{item.batch_number}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest italic">{item.dosage_form} | {item.strength}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-slate-300 uppercase">Qty</p>
                                                    <p className="text-xs font-black text-slate-600">{item.quantity}</p>
                                                </div>
                                                <div className="text-right min-w-[70px]">
                                                    <p className="text-[8px] font-black text-slate-300 uppercase">Total</p>
                                                    <p className="text-xs font-black text-slate-900 italic">NPR {item.subtotal}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        
                        <div className="px-6 py-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount Due</p>
                                <p className="text-xl font-black text-indigo-600 tracking-tight">NPR {selectedSale.total_amount}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setLastSaleData({
                                        sale_id: selectedSale.sale_id,
                                        customer_name: selectedSale.customer_name,
                                        customer_phone: selectedSale.customer_phone,
                                        date: new Date(selectedSale.sale_date).toLocaleString(),
                                        total: selectedSale.total_amount,
                                        cart: selectedSale.items.map(i => ({
                                            medicine_name: i.medicine_name,
                                            quantity: i.quantity,
                                            unit_price: i.unit_price
                                        }))
                                    });
                                    setTimeout(() => window.print(), 500);
                                }}
                                className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95">
                                <Receipt size={14} /> Re-print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sales;
