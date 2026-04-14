import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
    Plus, Trash2, FileText, Loader2, CheckCircle, AlertCircle,
    History, Package, Search, ChevronDown, ShoppingBag,
    ArrowLeft, Calendar, Barcode, Tag, TrendingDown, ClipboardList, Eye, X, Receipt
} from "lucide-react";
import { getBatches, getMedicines, createPurchase, getPurchases, getSuppliers, getPurchaseById } from "../services/api";

// Professional Print Styles - Robust Isolation
const printStyle = `
@media print {
    .no-print { display: none !important; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    #printable-grn {
        display: block !important;
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: auto;
        margin: 0;
        padding: 40px;
        background: white;
        z-index: 99999;
    }
}
`;

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
    const ts = d.getTime().toString().slice(-4);
    return `PUR-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${ts}`;
};

const Purchases = () => {
    useEffect(() => {
        const styleTag = document.createElement("style");
        styleTag.innerHTML = printStyle;
        document.head.appendChild(styleTag);
        return () => document.head.removeChild(styleTag);
    }, []);

    const [activeView, setActiveView] = useState("new");
    const [purchaseMode, setPurchaseMode] = useState("restock");
    const [mobileTab, setMobileTab] = useState("selector");

    const [batches, setBatches] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [history, setHistory] = useState([]);

    const location = useLocation();

    const [items, setItems] = useState([]);
    const [supplierId, setSupplierId] = useState(location.state?.prefilledSupplierId || "");
    const [invoiceNo, setInvoiceNo] = useState(autoInvoice());
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [lastPurchaseData, setLastPurchaseData] = useState(null);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Auto-Print GRN (Goods Receipt Note) Logic
    useEffect(() => {
        if (success && lastPurchaseData) {
            const timer = setTimeout(() => {
                window.print();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [success, lastPurchaseData]);

    useEffect(() => {
        const init = async () => {
            try {
                const [batchData, medData, supplierData] = await Promise.all([
                    getBatches(), getMedicines(), getSuppliers()
                ]);
                setBatches(batchData || []);
                setMedicines((medData || []).filter(m => m.is_active));
                setSuppliers(supplierData.filter(s => s.is_active));
            } catch {
                setError("Failed to load page data");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleViewPurchaseDetails = async (purchaseId) => {
        setIsDetailLoading(true);
        try {
            const data = await getPurchaseById(purchaseId);
            setSelectedPurchase(data);
        } catch (err) {
            setError("Failed to load transaction details");
        } finally {
            setIsDetailLoading(false);
        }
    };

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
        if (!loading && location.state?.prefilledMedicineId && medicines.length > 0) {
            const med = medicines.find(m => String(m.medicine_id) === String(location.state.prefilledMedicineId));
            if (med) {
                const exists = items.some(i => i.medicine_id === med.medicine_id);
                if (!exists) {
                    addNewBatchItem(med);
                    setSearchTerm(med.name);
                }
            }
        }
    }, [loading, location.state, medicines]);

    useEffect(() => {
        if (activeView === "history") loadHistory();
    }, [activeView, loadHistory]);

    // Global Scroll Lock for Modals
    useEffect(() => {
        if (selectedPurchase || submitting) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [selectedPurchase, submitting]);

    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Invoice No", "Supplier", "Total Amount", "Purchase Date"];
        const rows = history.map(p => [
            p.invoice_no,
            `"${p.supplier_name}"`,
            p.total_amount,
            formatDate(p.purchase_date)
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `pharmatrack_purchases_${todayISO()}.csv`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        if (!invoiceNo.trim()) return setError("Enter a valid invoice number.");
        if (items.length === 0) return setError("Add items to your manifest.");

        for (const item of items) {
            if (!item.quantity || item.quantity < 1) return setError(`Invalid quantity for ${item.medicine_name}`);
            if (!item.unit_cost || item.unit_cost <= 0) return setError(`Invalid cost for ${item.medicine_name}`);
            if (item.mode === "newbatch") {
                if (!item.batch_number?.trim()) return setError(`Batch number required for ${item.medicine_name}`);
                if (!item.expiry_date) return setError(`Expiry date required for new batch of ${item.medicine_name}`);
                if (new Date(item.expiry_date) < new Date()) return setError(`Expiry date for ${item.medicine_name} must be in the future`);
            }
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
            setLastPurchaseData({
                ...payload,
                supplierName: suppliers.find(s => String(s.supplier_id) === String(supplierId))?.supplier_name || "Unknown Supplier",
                date: new Date().toLocaleString(),
                total: total
            });
            setSuccessMsg(`Purchase recorded — NPR ${total.toLocaleString()}`);
            setSuccess(true);
            setItems([]);
            setInvoiceNo(autoInvoice());
            setSupplierId("");
            loadHistory();
        } catch (err) {
            setError(err.message || "Failed to record purchase");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Main Interactive UI */}
            <div className="no-print">
                {loading ? (
                    <div className="flex h-[60vh] items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-100 border-2 border-emerald-100">
                            <CheckCircle size={48} className="animate-bounce" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Delivery Recorded!</h2>
                            <p className="text-slate-500 font-bold max-w-sm mx-auto">
                                Invoice <span className="text-indigo-600">#{lastPurchaseData?.invoice_no}</span> has been processed successfully.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setSuccess(false); setLastPurchaseData(null); }}
                                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-indigo-100 active:scale-95"
                            >
                                New Delivery
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-10 py-4 bg-slate-100 hover:bg-slate-300 text-slate-700 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2"
                            >
                                Print GRN <FileText size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
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
                                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] p-1.5 rounded-2xl shadow-2xl flex border border-white/10 backdrop-blur-xl">
                                    <button onClick={() => setMobileTab("selector")} className={`px-6 py-2 rounded-xl text-[10px] font-black ${mobileTab === "selector" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>ADD ITEMS</button>
                                    <button onClick={() => setMobileTab("manifest")} className={`px-6 py-2 rounded-xl text-[10px] font-black ${mobileTab === "manifest" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>MANIFEST ({items.length})</button>
                                </div>

                                <div className={`lg:col-span-8 space-y-6 ${mobileTab !== "manifest" ? "hidden lg:block" : ""}`}>
                                    <div className="bg-white rounded-[2.5rem] premium-shadow p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Invoice Number</label>
                                            <input placeholder="INV-XXX-000" value={invoiceNo} readOnly className="w-full px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 font-black text-slate-500 outline-none cursor-not-allowed uppercase" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Supplier</label>
                                            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-black text-slate-900 outline-none appearance-none cursor-pointer">
                                                <option value="">Select Supplier...</option>
                                                {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

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

                                <div className={`lg:col-span-4 space-y-6 ${mobileTab !== "selector" ? "hidden lg:block" : ""}`}>
                                    <div className="bg-white rounded-[2.5rem] premium-shadow p-6 border border-slate-100 h-[450px] flex flex-col">
                                        <div className="relative mb-4">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input placeholder="Search Medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none" />
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                                            {medicines
                                                .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(m => {
                                                    const medBatches = batches.filter(b => b.medicine_id === m.medicine_id);
                                                    return (
                                                        <div key={m.medicine_id} className="space-y-2">
                                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-slate-900">{m.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400">{m.strength} • {m.dosage_form}</p>
                                                                </div>
                                                                <button onClick={() => addNewBatchItem(m)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                                    <Plus size={12} /> New Batch
                                                                </button>
                                                            </div>
                                                            {medBatches.length > 0 && (
                                                                <div className="pl-4 space-y-1.5 border-l-2 border-slate-100 ml-4">
                                                                    {medBatches.map(b => (
                                                                        <div key={b.batch_id} className="p-3 rounded-xl bg-white border border-slate-50 flex items-center justify-between group hover:border-indigo-100 transition-all">
                                                                            <div className="text-left">
                                                                                <p className="text-[10px] font-black text-slate-700">Batch #{b.batch_number}</p>
                                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Stock: {b.current_quantity}</p>
                                                                            </div>
                                                                            <button onClick={() => addRestockItem(b)} className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                                                                <Plus size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>
                                        <div className="relative z-10 space-y-6">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Grand Total</p>
                                                <h2 className="text-4xl font-black">NPR {total.toLocaleString()}</h2>
                                            </div>
                                            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">{error}</div>}
                                            <button onClick={handlePurchase} disabled={submitting} className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><ShoppingBag size={20} /> Record Purchase</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="relative group flex-1 w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input type="text" placeholder="Search by Invoice # or Supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300" />
                                    </div>
                                    <button onClick={handleExportCSV} className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95">
                                        <FileText size={14} /> Download CSV Report
                                    </button>
                                </div>
                                <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] font-black tracking-widest uppercase text-slate-400">Invoice No</th>
                                                    <th className="px-8 py-5 text-[10px] font-black tracking-widest uppercase text-slate-400">Date</th>
                                                    <th className="px-8 py-5 text-[10px] font-black tracking-widest uppercase text-slate-400">Supplier</th>
                                                    <th className="px-8 py-5 text-[10px] font-black tracking-widest uppercase text-slate-400 text-right">Total</th>
                                                    <th className="px-8 py-5 text-[10px] font-black tracking-widest uppercase text-slate-400 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(() => {
                                                    const filteredHistory = (history || []).filter(p =>
                                                        (p.invoice_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        (p.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                                                    );
                                                    if (filteredHistory.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <FileText size={40} className="text-slate-200" />
                                                                        <p className="text-sm font-bold uppercase tracking-widest">No transaction history found</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                    return filteredHistory.map(p => (
                                                        <tr key={p.purchase_id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{p.invoice_no}</span>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2 text-slate-600">
                                                                    <span className="text-xs font-bold">{new Date(p.purchase_date).toLocaleDateString()}</span>
                                                                    {new Date(p.purchase_date).getHours() !== 0 && (
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(p.purchase_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-black text-slate-800">{p.supplier_name}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <span className="text-sm font-black text-slate-900 whitespace-nowrap">NPR {Number(p.total_amount).toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <button onClick={() => handleViewPurchaseDetails(p.purchase_id)} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest">
                                                                    <Eye size={14} /> View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {selectedPurchase && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Purchase Detail</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">REF: {selectedPurchase.invoice_no}</p>
                            </div>
                            <button onClick={() => setSelectedPurchase(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supplier</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedPurchase.supplier_name}</p>
                                    {selectedPurchase.supplier_phone && selectedPurchase.supplier_phone !== 'N/A' && selectedPurchase.supplier_phone !== 'n/a' && (
                                        <p className="text-[10px] font-bold text-slate-500 leading-tight">{selectedPurchase.supplier_phone}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processed By</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedPurchase.created_by || 'Admin'}</p>
                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-tight">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Items</h3>
                                <div className="space-y-2">
                                    {(selectedPurchase.items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-black text-slate-800 leading-tight truncate">{item.medicine_name}</p>
                                                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 uppercase tracking-widest shrink-0">{item.batch_number}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-300 uppercase leading-none">Qty</p>
                                                <p className="text-xs font-black text-slate-600 mb-1">{item.quantity}</p>
                                                <p className="text-[8px] font-black text-slate-300 uppercase leading-none">Cost</p>
                                                <p className="text-xs font-black text-slate-900 italic">NPR {item.unit_cost}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Grand Total</p>
                                <p className="text-xl font-black text-indigo-600 tracking-tight">NPR {selectedPurchase.total_amount}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setLastPurchaseData({
                                        invoice_no: selectedPurchase.invoice_no,
                                        supplierName: selectedPurchase.supplier_name,
                                        date: new Date(selectedPurchase.purchase_date).toLocaleString(),
                                        total: selectedPurchase.total_amount,
                                        items: selectedPurchase.items
                                    });
                                    setTimeout(() => window.print(), 500);
                                }}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95 no-print">
                                <Receipt size={14} /> Reprint GRN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Always Available Printable GRN (Correct Isolation) */}
            {lastPurchaseData && (
                <div id="printable-grn" className="hidden print:block bg-white p-8 text-slate-900 border-0 shadow-none">
                    <div className="max-w-[400px] mx-auto space-y-6">
                        <div className="text-center space-y-2 border-b-2 border-slate-100 pb-6">
                            <h1 className="text-2xl font-black tracking-tight text-indigo-600">PHARMATRACK</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Goods Receipt Note (GRN)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                                <p className="font-black text-slate-800">{lastPurchaseData.supplierName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Info</p>
                                <p className="font-black text-slate-800">REF: {lastPurchaseData.invoice_no}</p>
                                <p className="font-bold text-slate-500">{lastPurchaseData.date}</p>
                            </div>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Item Name</th>
                                    <th className="py-3 text-center font-black text-slate-400 uppercase tracking-widest text-[9px]">Qty</th>
                                    <th className="py-3 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Unit Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lastPurchaseData.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50">
                                        <td className="py-3 font-black text-slate-800">{item.medicine_name}</td>
                                        <td className="py-3 text-center font-bold">{item.quantity}</td>
                                        <td className="py-3 text-right font-black">NPR {item.unit_cost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pt-4 space-y-2 border-t-2 border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Investment</span>
                                <span className="text-xl font-black text-indigo-600">NPR {lastPurchaseData.total.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="text-center pt-8 opacity-50">
                            <p className="text-[10px] font-black uppercase tracking-widest">Thank you for your visit!</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1">Pharmacy Procurement Logic powered by PharmaTrack</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Purchases;
