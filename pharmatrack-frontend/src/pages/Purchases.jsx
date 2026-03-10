import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, FileText, Loader2, CheckCircle, AlertCircle,
    History, Package, Search, ChevronDown, ShoppingBag,
    ArrowLeft, Calendar, Barcode, Tag, TrendingDown, ClipboardList
} from "lucide-react";
import { getBatches, getMedicines, createPurchase, getPurchases, getSuppliers } from "../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
const todayISO = () => new Date().toISOString().split("T")[0];
const stockColor = (qty) => {
    if (qty <= 0) return "text-rose-600 bg-rose-50";
    if (qty <= 15) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
};
const autoInvoice = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(100 + Math.random() * 900)}`;
};

const Purchases = () => {
    const [activeView, setActiveView] = useState("new");
    const [purchaseMode, setPurchaseMode] = useState("restock");
    const [mobileTab, setMobileTab] = useState("selector");

    const [batches, setBatches] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [history, setHistory] = useState([]);

    const [items, setItems] = useState([]);
    const [supplierId, setSupplierId] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("INV-XXX-000");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                const [batchData, medData, supplierData] = await Promise.all([
                    getBatches(), getMedicines(), getSuppliers()
                ]);
                setBatches(batchData);
                setMedicines(medData);
                setSuppliers(supplierData.filter(s => s.is_active));
            } catch {
                setError("Failed to load page data");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await getPurchases();
            setHistory(data);
        } catch {
            setError("Failed to load purchase history");
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        if (activeView === "history") loadHistory();
    }, [activeView, loadHistory]);

    const addRestockItem = (batch) => {
        if (items.find(i => i._key === `b-${batch.batch_id}`)) return;
        setItems(prev => [...prev, {
            _key: `b-${batch.batch_id}`,
            mode: "restock",
            batch_id: batch.batch_id,
            medicine_name: batch.medicine_name,
            batch_number: batch.batch_number,
            current_qty: batch.current_quantity,
            unit_cost: batch.cost_price || "",
            quantity: 1
        }]);
    };

    const addNewBatchItem = (med) => {
        const key = `m-${med.medicine_id}-${Date.now()}`;
        setItems(prev => [...prev, {
            _key: key,
            mode: "newbatch",
            medicine_id: med.medicine_id,
            medicine_name: med.name,
            batch_number: "",
            expiry_date: "",
            unit_cost: "",
            selling_price: "",
            quantity: 1
        }]);
    };

    const removeItem = (key) => setItems(prev => prev.filter(i => i._key !== key));
    const updateItem = (key, field, value) =>
        setItems(prev => prev.map(i => i._key === key ? { ...i, [field]: value } : i));

    const total = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost || 0)), 0);

    const handlePurchase = async () => {
        setError("");
        if (!supplierId) return setError("Please select a supplier.");
        if (invoiceNo === "INV-XXX-000") return setError("Enter a valid invoice number.");
        if (items.length === 0) return setError("Add items to your manifest.");

        for (const item of items) {
            if (!item.quantity || item.quantity < 1) return setError(`Invalid quantity for ${item.medicine_name}`);
            if (!item.unit_cost || item.unit_cost <= 0) return setError(`Invalid cost for ${item.medicine_name}`);
        }

        setSubmitting(true);
        try {
            const payload = {
                supplier_id: supplierId,
                invoice_no: invoiceNo,
                items: items.map(i => ({
                    ...i,
                    batch_id: i.mode === "restock" ? i.batch_id : null,
                    quantity: parseInt(i.quantity),
                    unit_cost: parseFloat(i.unit_cost)
                }))
            };
            await createPurchase(payload);
            setSuccessMsg(`✅ Purchase recorded — NPR ${total.toLocaleString()}`);
            setSuccess(true);
            setItems([]);
            setInvoiceNo("INV-XXX-000");
            loadHistory();
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err.message || "Failed to record purchase");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Procurement</h1>
                    <p className="text-slate-500 font-bold">Record incoming stock deliveries.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setActiveView("new")} className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${activeView === "new" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>NEW PURCHASE</button>
                    <button onClick={() => setActiveView("history")} className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${activeView === "history" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>HISTORY</button>
                </div>
            </div>

            {activeView === "new" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
                    {/* Mobile Floating Tab */}
                    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] p-1.5 rounded-2xl shadow-2xl flex border border-white/10 backdrop-blur-xl">
                        <button onClick={() => setMobileTab("selector")} className={`px-6 py-2 rounded-xl text-[10px] font-black ${mobileTab === "selector" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>ADD ITEMS</button>
                        <button onClick={() => setMobileTab("manifest")} className={`px-6 py-2 rounded-xl text-[10px] font-black ${mobileTab === "manifest" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>MANIFEST ({items.length})</button>
                    </div>

                    {/* MANIFEST SECTION */}
                    <div className={`lg:col-span-8 space-y-6 ${mobileTab !== "manifest" ? "hidden lg:block" : ""}`}>
                        {/* Summary Header */}
                        <div className="bg-white rounded-[2.5rem] premium-shadow p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Invoice Number</label>
                                <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Supplier</label>
                                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-black text-slate-900 outline-none appearance-none cursor-pointer">
                                    <option value="">Select Supplier...</option>
                                    {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <button onClick={() => { setPurchaseMode("restock"); setItems([]); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black ${purchaseMode === "restock" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}>RESTOCK EXISTING</button>
                                <button onClick={() => { setPurchaseMode("newbatch"); setItems([]); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black ${purchaseMode === "newbatch" ? "bg-white shadow text-emerald-600" : "text-slate-500"}`}>NEW DELIVERY</button>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-white rounded-[2.5rem] premium-shadow p-8 border border-slate-100 min-h-[300px]">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-slate-300 gap-4">
                                    <Package size={48} className="opacity-20" />
                                    <p className="font-bold">No items in manifest.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map(item => (
                                        <div key={item._key} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative group">
                                            <button onClick={() => removeItem(item._key)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                            <div className="pr-10">
                                                <p className="font-black text-slate-900">{item.medicine_name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {item.mode === "newbatch" ? <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded uppercase">New Delivery</span> : <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">Batch #{item.batch_number}</span>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                                {item.mode === "newbatch" && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase">Batch #</label>
                                                            <input value={item.batch_number} onChange={(e) => updateItem(item._key, "batch_number", e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase">Expiry</label>
                                                            <input type="date" value={item.expiry_date} onChange={(e) => updateItem(item._key, "expiry_date", e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold" />
                                                        </div>
                                                    </>
                                                )}
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase">Quantity</label>
                                                    <input type="number" value={item.quantity} onChange={(e) => updateItem(item._key, "quantity", e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase">Cost (NPR)</label>
                                                    <input type="number" value={item.unit_cost} onChange={(e) => updateItem(item._key, "unit_cost", e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SELECTOR SECTION */}
                    <div className={`lg:col-span-4 space-y-6 ${mobileTab !== "selector" ? "hidden lg:block" : ""}`}>
                        <div className="bg-white rounded-[2.5rem] premium-shadow p-6 border border-slate-100 h-[450px] flex flex-col">
                            <div className="relative mb-4">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input placeholder="Search Medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none" />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                {purchaseMode === "restock" ? (
                                    batches.filter(b => b.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                                        <button key={b.batch_id} onClick={() => addRestockItem(b)} className="w-full p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 flex items-center justify-between group transition-all">
                                            <div className="text-left overflow-hidden">
                                                <p className="text-xs font-black text-slate-900 truncate">{b.medicine_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400">Batch #{b.batch_number} • {b.current_quantity} in stock</p>
                                            </div>
                                            <Plus size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                                        <button key={m.medicine_id} onClick={() => addNewBatchItem(m)} className="w-full p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 flex items-center justify-between group transition-all">
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-900">{m.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400">{m.strength} • {m.dosage_form}</p>
                                            </div>
                                            <Plus size={18} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Summary & Buttons */}
                        <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Grand Total</p>
                                    <h2 className="text-4xl font-black">NPR {total.toLocaleString()}</h2>
                                </div>
                                {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">{error}</div>}
                                {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-2"><CheckCircle size={14} /> {successMsg}</div>}
                                <button
                                    onClick={handlePurchase}
                                    disabled={submitting}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <><ShoppingBag size={20} /> Record Purchase</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase text-slate-400">Invoice</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase text-slate-400">Supplier</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map(p => (
                                    <tr key={p.purchase_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 font-black text-slate-800">{p.invoice_no}</td>
                                        <td className="px-8 py-5 text-slate-600 font-bold">{p.supplier_name}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900">NPR {Number(p.total_amount).toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right text-slate-500 font-bold">{formatDate(p.purchase_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
