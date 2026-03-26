import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Package, AlertCircle, Search, Tag, Pill, ArrowRight,
    ShieldAlert, ChevronRight, Clock, X, Sparkles, Loader2,
    Heart, Phone, MapPin, MessageCircle, BookOpen, Info,
    Stethoscope, Thermometer, Droplets, Wind, Shield,
    ChevronDown, ChevronUp, Star, Activity, Scissors,
    SearchCode, RefreshCw, LayoutGrid, BrainCircuit, Library, Headset
} from "lucide-react";
import StoreLayout from "../../components/StoreLayout";
import { getStoreMedicines, getStoreCategories, IMAGE_BASE_URL } from "../../services/api";

// ─── Constants & Mock Data ───────────────────────────────────────────────────

const SYMPTOMS_MAP = [
    { id: "pain", label: "Pain / Headache", icon: Activity, categories: ["Analgesics", "NSAIDs"] },
    { id: "fever", label: "Fever / Flu", icon: Thermometer, categories: ["Antipyretics", "Analgesics"] },
    { id: "cough", label: "Cough / Cold", icon: Wind, categories: ["Antitussive", "Antihistamine"] },
    { id: "stomach", label: "Stomach / Acidity", icon: Droplets, categories: ["Antacids", "Gastrointestinal"] },
    { id: "infection", label: "Visible Infection", icon: Shield, categories: ["Antibiotics", "Antifungal"] },
    { id: "allergy", label: "Allergy / Rash", icon: Sparkles, categories: ["Antihistamine"] },
];

const healthTips = [
    { icon: Droplets, color: "bg-blue-50 text-blue-600 border-blue-100", title: "Stay Hydrated", body: "Most oral medicines are absorbed better with water." },
    { icon: Thermometer, color: "bg-amber-50 text-amber-600 border-amber-100", title: "Store Correctly", body: "Keep away from heat, light, and humidity." },
    { icon: Wind, color: "bg-violet-50 text-violet-600 border-violet-100", title: "Never Share Rx", body: "Prescriptions are specific to your health history." },
    { icon: Shield, color: "bg-rose-50 text-rose-600 border-rose-100", title: "Check Expiry", body: "Expired medicines can lose potency or be harmful." },
    { icon: Stethoscope, color: "bg-emerald-50 text-emerald-600 border-emerald-100", title: "Complete Course", body: "Always finish antibiotics even if you feel better." },
    { icon: BookOpen, color: "bg-teal-50 text-teal-600 border-teal-100", title: "Read Leaflet", body: "Check dosage and interactions before starting." }
];

const faqs = [
    { q: "Do I need a prescription for all medicines?", a: "No. OTC medicines like vitamins don't need one. Antibiotics always require an Rx." },
    { q: "How do I order via WhatsApp?", a: "Click 'Enquire via WhatsApp' on any medicine page to start a chat." },
    { q: "What does 'Low Stock' mean?", a: "Limited quantity remaining. Enquire quickly to ensure availability." },
    { q: "Are your medicines genuine?", a: "Yes. All stock is sourced from licensed distributors with full traceability." }
];

// ─── UI Components ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 animate-pulse">
        <div className="w-full h-36 bg-slate-100 rounded-2xl mb-5"></div>
        <div className="h-2.5 bg-slate-100 rounded-full w-1/3 mb-3"></div>
        <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-5"></div>
        <div className="flex justify-between"><div className="h-5 bg-slate-100 rounded-full w-20"></div><div className="w-8 h-8 bg-slate-100 rounded-xl"></div></div>
    </div>
);

const AvailabilityBadge = ({ availability }) => {
    const config = {
        in_stock: { label: "In Stock", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        low_stock: { label: "Low Stock", class: "bg-amber-50 text-amber-700 border-amber-200" },
        out_of_stock: { label: "Out of Stock", class: "bg-slate-100 text-slate-500 border-slate-200" },
    };
    const { label, class: cls } = config[availability] || config.in_stock;
    return <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cls}`}>{label}</span>;
};

const MedicineCard = ({ med }) => {
    const navigate = useNavigate();
    const imgSrc = med.image_url ? `${IMAGE_BASE_URL}${med.image_url}` : null;
    return (
        <div onClick={() => navigate(`/store/medicine/${med.medicine_id}`)}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group cursor-pointer flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-full h-36 mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shrink-0">
                {imgSrc ? <img src={imgSrc} alt={med.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; }} /> : <Pill size={40} className="text-emerald-300" />}
                {med.requires_prescription && (
                    <div className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-black uppercase tracking-wide px-2 py-1 rounded-lg flex items-center gap-1"><ShieldAlert size={10} /> Rx</div>
                )}
            </div>
            <div className="flex-1 flex flex-col">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{med.category_name}</p>
                <h3 className="text-base font-black text-slate-900 leading-tight mb-1 tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{med.name}</h3>
                <p className="text-xs font-bold text-slate-400 mb-3">{[med.strength, med.dosage_form].filter(Boolean).join(" · ")}</p>
                <div className="mt-auto flex items-center justify-between">
                    <AvailabilityBadge availability={med.availability} />
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm"><ArrowRight size={14} /></div>
                </div>
            </div>
        </div>
    );
};

const RecentlyViewed = ({ allMedicines }) => {
    const [viewed, setViewed] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("store_recently_viewed") || "[]");
        const list = allMedicines.filter(m => stored.includes(m.medicine_id)).reverse();
        setViewed(list);
    }, [allMedicines]);

    if (viewed.length === 0) return null;
    return (
        <div className="mt-16 pt-12 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-700 text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-slate-100"></div> Recently Consulted <div className="h-px w-8 bg-slate-100"></div>
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
                {viewed.slice(0, 6).map(med => (
                    <button
                        key={med.medicine_id}
                        onClick={() => navigate(`/store/medicine/${med.medicine_id}`)}
                        className="px-5 py-2.5 bg-white border border-slate-100 rounded-full text-xs font-black text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/5 transition-all flex items-center gap-2 group"
                    >
                        <Pill size={12} className="text-emerald-400 group-hover:rotate-45 transition-transform" /> {med.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all hover:border-emerald-200">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left group">
                <p className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition-colors pr-4">{q}</p>
                {open ? <ChevronUp size={18} className="text-emerald-500 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
            </button>
            {open && <div className="px-6 pb-6 animate-in fade-in duration-200"><div className="h-px bg-slate-100 mb-4"></div><p className="text-sm font-bold text-slate-600 leading-relaxed">{a}</p></div>}
        </div>
    );
};

const ContactSection = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 lg:col-span-1">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Clock size={18} className="text-emerald-600" /> Opening Hours</h3>
                {[["Monday – Friday", "8 AM – 10 PM"], ["Saturday", "8 AM – 9 PM"], ["Sunday", "10 AM – 7 PM"], ["Holidays", "10 AM – 6 PM"]].map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                        <span className="text-sm font-bold text-slate-700">{h[0]}</span>
                        <p className="text-xs font-black text-slate-900">{h[1]}</p>
                    </div>
                ))}
            </div>
            <div className="lg:col-span-2 space-y-5">
                <a href="https://wa.me/9779800000000" target="_blank" rel="noreferrer" className="flex items-center gap-6 p-7 bg-emerald-600 rounded-[2rem] text-white hover:bg-emerald-700 transition group shadow-xl shadow-emerald-500/20">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💬</div>
                    <div><p className="font-black text-lg">Chat on WhatsApp</p><p className="text-emerald-100 font-bold text-sm">+977-9800000000 · Instant response</p></div>
                    <ChevronRight size={24} className="ml-auto opacity-60" />
                </a>
                <div className="flex items-center gap-6 p-7 bg-white rounded-[2rem] border border-slate-100">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl">📍</div>
                    <div><p className="font-black text-slate-900 text-lg">Visit Our Store</p><p className="text-slate-500 font-bold text-sm">Kathmandu, Nepal · Near Central Hospital</p></div>
                </div>
            </div>
        </div>
    </div>
);

// ─── TOOLS ───────────────────────────────────────────────────────────────────

const SmartHealthConsultant = ({ medicines }) => {
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [customSymptom, setCustomSymptom] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);

    const resetConsultation = () => {
        setSelectedSymptoms([]);
        setCustomSymptom("");
        setResults([]);
    };

    const toggleSymptom = (id) => {
        if (selectedSymptoms.includes(id)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
        } else if (selectedSymptoms.length < 2) {
            setSelectedSymptoms([...selectedSymptoms, id]);
        }
    };

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            const categories = new Set();
            selectedSymptoms.forEach(id => {
                const map = SYMPTOMS_MAP.find(s => s.id === id);
                if (map) map.categories.forEach(cat => categories.add(cat));
            });

            // Simulate AI Keyword extraction for custom symptom
            const aiKeywords = {
                "pain": ["Analgesics", "NSAIDs"],
                "headache": ["Analgesics"],
                "fever": ["Antipyretics"],
                "stomach": ["Antacids", "Gastrointestinal"],
                "cough": ["Antitussive"],
                "allergy": ["Antihistamine"]
            };

            Object.keys(aiKeywords).forEach(key => {
                if (customSymptom.toLowerCase().includes(key)) {
                    aiKeywords[key].forEach(cat => categories.add(cat));
                }
            });

            const found = medicines.filter(m =>
                Array.from(categories).some(cat => m.category_name.includes(cat))
            ).slice(0, 8);

            setResults(found);
            setIsSearching(false);
        }, 1200);
    };

    return (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

            <div className="max-w-3xl mx-auto mb-12 text-center relative z-10">
                <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full mb-4 border border-emerald-100">
                    <Stethoscope size={12} /> Pro-Health Consultation
                </span>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Intelligent Medication Advice</h2>
                    {(selectedSymptoms.length > 0 || results.length > 0) && (
                        <button onClick={resetConsultation} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors" title="Start New Round">
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">Select up to 2 symptoms or describe your unique condition for a professional inventory recommendation.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 mb-8 relative z-10">
                {SYMPTOMS_MAP.map(s => (
                    <button
                        key={s.id}
                        onClick={() => toggleSymptom(s.id)}
                        className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-300 ${selectedSymptoms.includes(s.id) ? "border-emerald-500 bg-emerald-50 scale-105 shadow-xl shadow-emerald-500/10" : "border-slate-50 bg-slate-50 hover:border-emerald-200"}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedSymptoms.includes(s.id) ? "bg-emerald-600 text-white" : "bg-white text-slate-400 group-hover:text-emerald-500 shadow-sm"}`}>
                            <s.icon size={26} strokeWidth={2.5} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-tight ${selectedSymptoms.includes(s.id) ? "text-emerald-800" : "text-slate-500"}`}>{s.label}</span>
                    </button>
                ))}
            </div>

            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <SearchCode size={20} />
                    </div>
                    <input
                        type="text"
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        placeholder="Describe other specific symptoms (e.g. Back pain, acid reflux)..."
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-16 pr-6 py-5 text-sm font-bold focus:bg-white focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-500/5 transition-all outline-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || (selectedSymptoms.length === 0 && !customSymptom)}
                        className="flex-1 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 group"
                    >
                        {isSearching ? <><Loader2 size={20} className="animate-spin" /> Fetching Expert Advice...</> : <><Sparkles size={20} className="group-hover:animate-pulse" /> Begin Health Check</>}
                    </button>
                    {(selectedSymptoms.length > 0 || customSymptom) && (
                        <button onClick={resetConsultation} className="px-6 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] hover:bg-rose-50 hover:text-rose-600 transition-all">
                            <RefreshCw size={20} />
                        </button>
                    )}
                </div>
            </div>

            {results.length > 0 && !isSearching && (
                <div className="mt-16 pt-12 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-700 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Expert Recommendations</h3>
                            <p className="text-xs font-bold text-slate-400">Products perfectly suited for your symptoms.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={resetConsultation} className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-colors">Reset Round</button>
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">{results.length} results</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {results.map(med => <MedicineCard key={med.medicine_id} med={med} />)}
                    </div>
                </div>
            )}

            {!results.length && !isSearching && selectedSymptoms.length > 0 && (
                <div className="mt-12 py-16 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No exact matches found in stock</p>
                </div>
            )}
        </div>
    );
};

// ─── Sections ───────────────────────────────────────────────────────────────

const BrowseSection = ({ medicines, categories, loading }) => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchParams] = useSearchParams();
    const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
    const navigate = useNavigate();

    useEffect(() => {
        setLocalSearch(searchParams.get("search") || "");
    }, [searchParams]);

    const filtered = useMemo(() => medicines.filter(m => {
        const matchCat = activeCategory === "all" || String(m.category_id) === String(activeCategory);
        const q = localSearch.toLowerCase();
        return matchCat && (!q || m.name.toLowerCase().includes(q) || (m.manufacturer || "").toLowerCase().includes(q));
    }), [medicines, activeCategory, localSearch]);

    return (
        <div>
            <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-20 text-center px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
                <h1 className="text-5xl font-black mb-4 tracking-tighter">Inventory & <span className="text-emerald-400">Catalogue</span></h1>
                <p className="text-emerald-100/60 font-medium max-w-xl mx-auto text-sm">Browse our pharmaceutical-grade inventory with real-time stock verification.</p>
            </section>
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-3xl mb-12 relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search medicines..."
                        className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-6 text-base font-bold focus:border-emerald-500 focus:shadow-2xl focus:shadow-emerald-500/10 transition-all outline-none"
                    />
                    {localSearch && (
                        <button onClick={() => setLocalSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                    <button onClick={() => setActiveCategory("all")} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${activeCategory === "all" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white text-slate-500 border border-slate-100 hover:border-emerald-200"}`}>All</button>
                    {categories.map(cat => (<button key={cat.category_id} onClick={() => setActiveCategory(String(cat.category_id))} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${String(activeCategory) === String(cat.category_id) ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white text-slate-500 border border-slate-100 hover:border-emerald-200"}`}>{cat.category_name}</button>))}
                </div>
                {loading ? <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div> : <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{filtered.map(med => <MedicineCard key={med.medicine_id} med={med} />)}</div>}
                {!loading && <RecentlyViewed allMedicines={medicines} />}
            </div>
        </div>
    );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

const SECTIONS = [
    { id: "browse", label: "Medicines", icon: LayoutGrid },
    { id: "tools", label: "Health Guide", icon: BrainCircuit },
    { id: "info", label: "Health Hub", icon: Library },
    { id: "contact", label: "Contact", icon: Headset },
];

const StoreLanding = () => {
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("browse");

    useEffect(() => {
        Promise.all([getStoreMedicines(), getStoreCategories()])
            .then(([meds, cats]) => { setMedicines(meds); setCategories(cats); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <StoreLayout>
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-[72px] z-[40]">
                <div className="max-w-7xl mx-auto px-6"><div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {SECTIONS.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-3 shrink-0 ${activeSection === sec.id ? "border-emerald-600 text-emerald-800 bg-emerald-50/30" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                        >
                            <sec.icon size={16} strokeWidth={activeSection === sec.id ? 2.5 : 2} />
                            {sec.label}
                        </button>
                    ))}
                </div></div>
            </div>
            {activeSection === "browse" && <BrowseSection medicines={medicines} categories={categories} loading={loading} />}
            {activeSection === "tools" && <div className="max-w-7xl mx-auto px-6 py-12"><SmartHealthConsultant medicines={medicines} /></div>}
            {activeSection === "info" && <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">{healthTips.map((tip, i) => (<div key={i} className="bg-white rounded-[2rem] p-7 border"><div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${tip.color}`}><tip.icon size={22} /></div><p className="font-black text-slate-900 mb-2 text-sm">{tip.title}</p><p className="text-[12px] font-bold text-slate-500">{tip.body}</p></div>))}</div>
                <div className="max-w-3xl mx-auto space-y-3">{faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}</div>
            </div>}
            {activeSection === "contact" && <div className="max-w-7xl mx-auto px-6 py-12"><ContactSection /></div>}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <a href="https://wa.me/9779800000000" className="block bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-slate-900/10 group hover:bg-emerald-600 transition-all duration-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all"></div>
                    <h3 className="text-3xl font-black mb-3 group-hover:scale-105 transition duration-500">Professional Pharmacist Consult</h3>
                    <p className="text-slate-400 group-hover:text-emerald-50 font-medium mb-8 text-sm">Get expert advice and dosage verification via WhatsApp.</p>
                    <span className="bg-emerald-500 text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 group-hover:bg-white group-hover:scale-110 transition-all inline-flex items-center gap-2">
                        <MessageCircle size={16} /> Open Chat
                    </span>
                </a>
            </div>
        </StoreLayout>
    );
};

export default StoreLanding;
