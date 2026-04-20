import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Pill, Loader2, AlertCircle, ShieldAlert, CheckCircle2,
    ArrowLeft, MessageCircle, Package, Info, AlertTriangle,
    Building2, Thermometer, Tag, ArrowRight, X, FileText,
    Link2, Check, Upload, FileCheck, ExternalLink
} from "lucide-react";
import StoreLayout from "../../components/StoreLayout";
import { getStoreMedicineDetail, IMAGE_BASE_URL, notifyStock } from "../../services/api";
import { toast } from "react-hot-toast";

// ─── Availability Badge ─────────────────────────────────────────────────────────
const AvailabilityBadge = ({ availability }) => {
    const cfg = {
        in_stock: { label: "In Stock", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
        low_stock: { label: "Low Stock", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
        out_of_stock: { label: "Out of Stock", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", dot: "bg-rose-500" },
    };
    const { label, bg, text, border, dot } = cfg[availability] || cfg.in_stock;
    return (
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${bg} ${text} ${border}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${dot}`}></span>
            {label}
        </span>
    );
};

// ─── Prescription Gate Modal ───────────────────────────────────────────────────
const PrescriptionGate = ({ medicine, onContinue, onBack }) => (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>

            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <ShieldAlert size={40} className="text-rose-500" />
            </div>

            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">⚕️ Prescription Required</p>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{medicine.name}</h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-3 text-sm">
                This medicine is a <strong className="text-rose-600">prescription-only (Rx) medicine</strong> and requires a valid doctor's prescription.
            </p>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-8 text-left">
                <p className="text-xs font-bold text-rose-700 leading-relaxed">
                    ⚠️ By continuing you acknowledge that you have a valid prescription or are enquiring on behalf of a licensed physician.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onContinue}
                    className="w-full py-4 rounded-2xl font-black text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                    I Have a Prescription - Continue
                </button>
                <button
                    onClick={onBack}
                    className="w-full py-3.5 rounded-2xl font-black text-sm bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                >
                    ← Go Back to Store
                </button>
            </div>
        </div>
    </div>
);

// ─── Save to Recently Viewed ───────────────────────────────────────────────────
const saveToRecentlyViewed = (id) => {
    try {
        const existing = JSON.parse(localStorage.getItem("store_recently_viewed") || "[]");
        const updated = [id, ...existing.filter(i => i !== id)].slice(0, 8);
        localStorage.setItem("store_recently_viewed", JSON.stringify(updated));
    } catch (_) { }
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const MedicineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [error, setError] = useState(null);
    const [showRxGate, setShowRxGate] = useState(false);
    const [rxAcknowledged, setRxAcknowledged] = useState(false);
    const [copied, setCopied] = useState(false);
    const [notifyForm, setNotifyForm] = useState({ name: "", phone: "" });
    const [submittingNotify, setSubmittingNotify] = useState(false);




    const handleNotifySubmit = async (e) => {
        e.preventDefault();
        if (!notifyForm.name || !notifyForm.phone) {
            toast.error("Please provide both name and phone number.");
            return;
        }
        setSubmittingNotify(true);
        try {
            const res = await notifyStock({
                medicine_id: medicine.medicine_id,
                customer_name: notifyForm.name,
                customer_phone: notifyForm.phone
            });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.message);
                setNotifyForm({ name: "", phone: "" });
            }
        } catch (err) {
            toast.error("Failed to send request. Please try again.");
        } finally {
            setSubmittingNotify(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0); // Ensure page starts at the top
        setLoading(true);
        setRxAcknowledged(false);
        setShowRxGate(false);
        getStoreMedicineDetail(id)
            .then(data => {
                setMedicine(data);
                document.title = `PharmaTrack | ${data.name}`;
                // Show prescription gate if required and not yet acknowledged
                if (data.requires_prescription) {
                    setShowRxGate(true);
                }
                // Track in recently viewed
                saveToRecentlyViewed(data.medicine_id);
            })
            .catch(() => setError("Medicine not found."))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <StoreLayout>
            <div className="flex justify-center items-center py-40">
                <div className="text-center space-y-3">
                    <Loader2 className="animate-spin text-emerald-600 mx-auto" size={40} />
                    <p className="text-slate-400 font-bold text-sm">Loading medicine data...</p>
                </div>
            </div>
        </StoreLayout>
    );

    if (error || !medicine) return (
        <StoreLayout>
            <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center">
                    <AlertCircle size={40} className="text-rose-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Medicine Not Found</h2>
                    <p className="text-slate-500 font-bold mt-1">This item may be out of our catalogue.</p>
                </div>
                <button onClick={() => navigate("/store")} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition">
                    ← Back to Store
                </button>
            </div>
        </StoreLayout>
    );

    const imgSrc = medicine.image_url ? `${IMAGE_BASE_URL}${medicine.image_url}` : null;
    const whatsappMsg = encodeURIComponent(`Hello! I would like to enquire about:\n*${medicine.name}* (${[medicine.strength, medicine.dosage_form].filter(Boolean).join(", ")})\nIs it currently available? Thank you.`);



    const tabs = [
        { id: "overview", label: "Overview", icon: Info },
        { id: "safety", label: "Safety Info", icon: AlertTriangle },
    ];

    return (
        <StoreLayout>
            {/* Prescription Gate Modal */}
            {showRxGate && !rxAcknowledged && (
                <PrescriptionGate
                    medicine={medicine}
                    onContinue={() => { setRxAcknowledged(true); setShowRxGate(false); }}
                    onBack={() => navigate("/store")}
                />
            )}

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-6 pt-8">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Link to="/store" className="hover:text-emerald-600 transition-colors">Store</Link>
                    <span>›</span>
                    <span className="text-emerald-600">{medicine.category_name}</span>
                    <span>›</span>
                    <span className="text-slate-600 truncate max-w-[200px]">{medicine.name}</span>
                </div>
            </div>

            {/* Main Detail Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-10">

                {/* Left: Image + Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="bg-white rounded-[2.5rem] aspect-square overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center relative group">
                        {imgSrc ? (
                            <img src={imgSrc} alt={medicine.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50">
                                <Pill size={80} className="opacity-40" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Image Available</p>
                            </div>
                        )}
                        {medicine.requires_prescription && (
                            <div className="absolute top-5 left-5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wide px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                                <ShieldAlert size={12} /> Prescription Required
                            </div>
                        )}
                    </div>

                    {/* Availability Card */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Availability</p>
                            <AvailabilityBadge availability={medicine.availability} />
                        </div>
                        {medicine.availability !== "out_of_stock" && (
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${medicine.availability === "in_stock" ? "bg-emerald-500 w-4/5" : "bg-amber-500 w-1/4"}`}></div>
                            </div>
                        )}
                        {medicine.earliest_expiry && (
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <Thermometer size={12} />
                                Expires: {new Date(medicine.earliest_expiry).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                        )}
                    </div>


                    {/* WhatsApp CTA or Notify Form */}
                    {medicine.availability !== "out_of_stock" ? (
                        <a href={`https://wa.me/9779800000000?text=${whatsappMsg}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95">
                            <MessageCircle size={22} />
                            Enquire via WhatsApp
                        </a>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
                            <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                                <AlertCircle size={18} /> Currently Out of Stock
                            </div>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                Want us to notify you when this is back? Leave your details below and we'll reach out!
                            </p>
                            <form onSubmit={handleNotifySubmit} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={notifyForm.name}
                                    onChange={e => setNotifyForm({ ...notifyForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:border-emerald-500 outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={notifyForm.phone}
                                    onChange={e => setNotifyForm({ ...notifyForm, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:border-emerald-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingNotify}
                                    className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {submittingNotify ? "Sending..." : "Notify Me when Restocked"}
                                </button>
                            </form>
                        </div>
                    )}


                    <button onClick={() => navigate("/store")}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors">
                        <ArrowLeft size={16} /> Back to Store
                    </button>
                </div>

                {/* Right: Details */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-4">
                            <Tag size={10} /> {medicine.category_name}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">{medicine.name}</h1>

                        <div className="flex flex-wrap gap-3">
                            {medicine.strength && <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">💊 {medicine.strength}</span>}
                            {medicine.dosage_form && <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">🧪 {medicine.dosage_form}</span>}
                            {medicine.manufacturer && (
                                <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
                                    <Building2 size={12} /> {medicine.manufacturer}
                                </span>
                            )}
                        </div>
                    </div>


                    {/* Tabs */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-100">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-slate-400 hover:text-slate-600"}`}>
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-8">

                            {activeTab === "overview" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {medicine.description && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</h3>
                                            <p className="text-slate-700 font-bold text-sm leading-relaxed">{medicine.description}</p>
                                        </div>
                                    )}
                                    {medicine.indications && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Used For (Indications)</h3>
                                            <p className="text-slate-700 font-bold text-sm leading-relaxed">{medicine.indications}</p>
                                        </div>
                                    )}
                                    {!medicine.description && !medicine.indications && (
                                        <p className="text-slate-400 font-bold text-sm text-center py-8">No detailed information available.</p>
                                    )}
                                </div>
                            )}
                            {activeTab === "safety" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {medicine.requires_prescription && (
                                        <div className="flex gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-100">
                                            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <p className="text-sm font-black text-rose-700 mb-1">Prescription Required</p>
                                                <p className="text-xs font-bold text-rose-500/80">This medicine requires a valid doctor's prescription. Please consult your physician before purchasing.</p>
                                            </div>
                                        </div>
                                    )}
                                    {medicine.side_effects ? (
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Known Side Effects</h3>
                                            <p className="text-slate-700 font-bold text-sm leading-relaxed">{medicine.side_effects}</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                                            <p className="text-sm font-bold text-emerald-700">No specific side effects documented. Always consult your pharmacist.</p>
                                        </div>
                                    )}
                                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700 leading-relaxed">
                                        ⚠️ <strong>Medical Disclaimer:</strong> Information provided is for reference only. Always consult a qualified pharmacist or physician before use.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Medicines */}
                    {medicine.related && medicine.related.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-5">Related in {medicine.category_name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {medicine.related.map(rel => (
                                    <Link key={rel.medicine_id} to={`/store/medicine/${rel.medicine_id}`}
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                            <Package size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{rel.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{rel.dosage_form}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 ml-auto shrink-0 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </StoreLayout>
    );
};

export default MedicineDetail;
