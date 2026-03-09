import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Loader2, CheckCircle, AlertCircle, Search, User, Phone, X, Filter, Sparkles, Receipt, ShieldAlert, Info } from "lucide-react";
import { getBatches, createSale, getCategories } from "../services/api";

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [batchData, catData] = await Promise.all([getBatches(), getCategories()]);
            const valid = batchData.filter(b => new Date(b.expiry_date) > new Date() && b.current_quantity > 0);
            setBatches(valid);
            setCategories(catData || []);
        } catch (err) {
            setError("Failed to fetch system data");
        } finally {
            setLoading(false);
        }
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

    const highlightText = (text, highlight) => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight})`, "gi");
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) => (
                    regex.test(part) ? (
                        <span key={i} className="bg-indigo-500/20 text-indigo-600 rounded-sm px-0.5">{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                ))}
            </span>
        );
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

            {/* Hidden Printable Invoice Component */}
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Elite Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pharmacy Counter</h1>
                    <p className="text-slate-500 font-bold">Create new customer bills and manage stock transactions.</p>
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
        </div>
    );
};

export default Sales;
