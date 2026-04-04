import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Package, AlertCircle, Search, Tag, Pill, ArrowRight,
    ShieldAlert, ChevronRight, Clock, X, Sparkles, Loader2,
    Heart, Phone, MapPin, MessageCircle, BookOpen, Info,
    Stethoscope, Thermometer, Droplets, Wind, Shield,
    ChevronDown, ChevronUp, Star, Activity, Scissors,
    SearchCode, RefreshCw, LayoutGrid, BrainCircuit, Library, Headset,
    Lock, CheckCircle2, Database
} from "lucide-react";
import StoreLayout from "../../components/StoreLayout";
import { getStoreMedicines, getStoreCategories, sendMessageToAI, checkDrugInteraction, IMAGE_BASE_URL } from "../../services/api";

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
const MedicineHeroBackground = ({ medicines }) => {
    const [index, setIndex] = useState(0);
    const validMeds = useMemo(() =>
        medicines.filter(m =>
            m.image_url &&
            !m.image_url.toLowerCase().includes('default') &&
            !m.image_url.toLowerCase().includes('placeholder')
        ).slice(0, 15),
        [medicines]);

    useEffect(() => {
        if (validMeds.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % validMeds.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [validMeds]);

    if (validMeds.length === 0) return null;
    const med = validMeds[index];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 hidden lg:block opacity-[0.3]">
            <style>{`
                .fade-hero { animation: fade-hero 10s ease-in-out infinite; }
                @keyframes fade-hero {
                    0%, 100% { opacity: 0; transform: scale(1.05); }
                    15%, 85% { opacity: 1; transform: scale(1.15); }
                }
            `}</style>

            <div key={med.medicine_id} className="absolute inset-0 fade-hero">
                <img
                    src={`${IMAGE_BASE_URL}${med.image_url}`}
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
};

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

const SmartHealthConsultant = ({ medicines, setActiveSection }) => {
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [customSymptom, setCustomSymptom] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [aiAdvice, setAiAdvice] = useState("");

    const resetConsultation = () => {
        setSelectedSymptoms([]);
        setCustomSymptom("");
        setResults([]);
        setAiAdvice("");
    };

    const toggleSymptom = (id) => {
        if (selectedSymptoms.includes(id)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
        } else if (selectedSymptoms.length < 2) {
            setSelectedSymptoms([...selectedSymptoms, id]);
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        setAiAdvice("");

        try {
            const iconSymptoms = selectedSymptoms.map(id => SYMPTOMS_MAP.find(s => s.id === id)?.label).join(", ");
            const fullQuery = [iconSymptoms, customSymptom].filter(Boolean).join(". Also: ");

            const prompt = `User Symptoms: ${fullQuery}. 
            Task: Provide professional pharmacist advice for these symptoms. 
            Constraint 1: Refer ONLY to the inventory results shown below your response. 
            Constraint 2: Do NOT mention imaginary store areas. Use professional, concise medical language.`;

            const data = await sendMessageToAI(prompt, "customer");
            const categories = new Set();
            if (data.category) categories.add(data.category);

            const localKeywords = {
                "diarrhea": ["Gastrointestinal"],
                "cholera": ["Gastrointestinal", "Antibiotics"],
                "pain": ["Analgesics"],
                "fever": ["Antipyretics"]
            };

            Object.keys(localKeywords).forEach(key => {
                if (fullQuery.toLowerCase().includes(key)) {
                    localKeywords[key].forEach(cat => categories.add(cat));
                }
            });

            const found = medicines.filter(m =>
                Array.from(categories).length > 0 && Array.from(categories).some(cat =>
                    (m.category_name || "").toLowerCase().includes(cat.toLowerCase()) ||
                    cat.toLowerCase().includes((m.category_name || "").toLowerCase())
                )
            ).slice(0, 8);

            const combined = [...(data.suggestions || []), ...found];
            const uniqueResults = Array.from(new Map(combined.map(m => [m.medicine_id, m])).values());

            const reply = data.reply || data.text || "";
            if (reply.length < 50 && (reply.toLowerCase().includes("hello") || reply.toLowerCase().includes("hi"))) {
                setAiAdvice("Welcome to PharmaTrack. Please describe your symptoms (e.g., 'fever since morning') or select from the icons above.");
                setResults([]);
                return;
            }

            setAiAdvice(reply || "Based on your symptoms, I have analyzed our inventory for the most suitable options.");
            setResults(uniqueResults);
        } catch (error) {
            console.error("Health Check Error:", error);
            setAiAdvice("Technical node unreachable. Please consult our staff via WhatsApp for urgent advice.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

            <div className="max-w-3xl mx-auto mb-12 text-center relative z-10">
                <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full mb-4 border border-emerald-100">
                    <BrainCircuit size={12} /> Intelligent Diagnostic Node
                </span>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Smart Health Consultant</h2>
                    {(selectedSymptoms.length > 0 || results.length > 0) && (
                        <button onClick={resetConsultation} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">Combine standard symptoms or describe your unique condition for a professional recommendation.</p>
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

            <div className="max-w-2xl mx-auto mb-10 relative z-10">
                <div className="relative group">
                    <input
                        type="text"
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        placeholder="Or describe in your own words (e.g., 'Sharp pain in lower back since morning')"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-6 pr-16 py-5 text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none shadow-sm"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || (!customSymptom && selectedSymptoms.length === 0)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-20 shadow-lg shadow-slate-900/10"
                    >
                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    </button>
                </div>
            </div>

            {(aiAdvice || results.length > 0) && (
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 relative z-10">
                    {aiAdvice && (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="absolute top-4 right-6 flex items-center gap-2 opacity-30">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-950">Intelligent Node Parity</span>
                                <Database size={12} className="text-emerald-950" />
                            </div>
                            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Professional Guidance</h3>
                            <p className="text-base font-bold text-slate-800 leading-relaxed mb-6 italic tracking-tight leading-relaxed">"{aiAdvice}"</p>
                            <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Sparkles size={10} className="text-emerald-500" /> Gemini 1.5 Flash</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span className="flex items-center gap-1.5"><Activity size={10} className="text-emerald-500" /> Groq LPU Powered</span>
                            </div>
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-700">
                            {results.map(med => <MedicineCard key={med.medicine_id} med={med} />)}
                        </div>
                    )}
                    {results.length === 0 && (
                        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm text-slate-300"><Library size={32} /></div>
                            <p className="text-sm font-bold text-slate-500 max-w-md mb-4 leading-relaxed">No direct inventory matches were identified for these specific symptoms. Please consult our pharmacist for alternative sourcing or custom procurement.</p>
                            <button onClick={() => { setActiveSection("browse"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors">
                                <Package size={14} /> Explore Full Catalogue
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Drug Interaction Checker (Premium AI Feature) ───────────────────────────
const MedicineInteractionChecker = ({ medicines }) => {
    const [med1, setMed1] = useState(null);
    const [med2, setMed2] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [report, setReport] = useState(null);
    const [searchQuery1, setSearchQuery1] = useState("");
    const [searchQuery2, setSearchQuery2] = useState("");

    const filteredMeds1 = searchQuery1 ? medicines.filter(m => m.name.toLowerCase().includes(searchQuery1.toLowerCase())).slice(0, 5) : [];
    const filteredMeds2 = searchQuery2 ? medicines.filter(m => m.name.toLowerCase().includes(searchQuery2.toLowerCase())).slice(0, 5) : [];

    const handleCheck = async () => {
        const name1 = med1 ? med1.name : searchQuery1.trim();
        const name2 = med2 ? med2.name : searchQuery2.trim();

        if (!name1 || !name2) {
            toast.error("Please provide two medication names.");
            return;
        }

        setIsChecking(true);
        setReport(null);
        try {
            // Uses dedicated endpoint with strict clinical system prompt — not the chatbot
            const data = await checkDrugInteraction(name1, name2);

            if (!data.valid || data.status === "Invalid") {
                setReport({
                    name1, name2,
                    text: data.analysis || `"${name1}" and/or "${name2}" are not valid medication names. Please provide real drug names (e.g., Aspirin, Metformin).`,
                    score: 0,
                    status: "Invalid"
                });
                return;
            }

            setReport({
                name1, name2,
                text: data.analysis,
                score: data.score,
                status: data.status
            });
        } catch (err) {
            console.error("Interaction Check Error:", err);
            toast.error("Analysis service is temporarily unavailable.");
            setReport({ name1, name2, text: "Technical node unreachable. Safe consultation with a pharmacist is recommended.", score: 0, status: "Warning" });
        } finally {
            setIsChecking(false);
        }
    };

    const handleReset = () => {
        setMed1(null);
        setMed2(null);
        setSearchQuery1("");
        setSearchQuery2("");
        setReport(null);
    };

    return (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800 mt-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="max-w-3xl mx-auto mb-10 text-center relative z-10">
                <span className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full mb-4 border border-emerald-500/20">
                    <ShieldAlert size={12} /> Global Pro-Safety Module
                </span>
                <div className="flex items-center justify-center gap-4 mb-3">
                    <h2 className="text-3xl font-black tracking-tight">Universal Interaction Checker</h2>
                    {(med1 || med2 || searchQuery1 || searchQuery2 || report) && (
                        <button
                            disabled={isChecking}
                            onClick={handleReset}
                            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-30"
                            title="Reset All"
                        >
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
                <p className="text-slate-400 font-bold text-sm">Analyze interactions between ANY medications (local or global) using professional AI reasoning.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10 mb-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Medicine 01</label>
                    <div className="relative">
                        {med1 ? (
                            <div className={`flex items-center justify-between p-5 bg-slate-800 rounded-2xl border border-emerald-500/30 font-black text-sm ${isChecking ? 'opacity-50' : ''}`}>
                                {med1.name}
                                {!isChecking && <button onClick={() => setMed1(null)} className="text-slate-400 hover:text-rose-400"><X size={16} /></button>}
                            </div>
                        ) : (
                            <div className="relative">
                                <input type="text" placeholder="Type ANY drug name (e.g. Aspirin)..." value={searchQuery1}
                                    onChange={(e) => setSearchQuery1(e.target.value)}
                                    disabled={isChecking}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all disabled:opacity-50" />
                                {filteredMeds1.length > 0 && !isChecking && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-20">
                                        {filteredMeds1.map(m => <button key={m.medicine_id} onClick={() => { setMed1(m); setSearchQuery1(""); }} className="w-full text-left p-4 hover:bg-emerald-600 font-bold text-xs transition-colors border-b border-slate-700 last:border-0">{m.name}</button>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Medicine 02</label>
                    <div className="relative">
                        {med2 ? (
                            <div className={`flex items-center justify-between p-5 bg-slate-800 rounded-2xl border border-emerald-500/30 font-black text-sm ${isChecking ? 'opacity-50' : ''}`}>
                                {med2.name}
                                {!isChecking && <button onClick={() => setMed2(null)} className="text-slate-400 hover:text-rose-400"><X size={16} /></button>}
                            </div>
                        ) : (
                            <div className="relative">
                                <input type="text" placeholder="Type ANY drug name (e.g. Warfarin)..." value={searchQuery2}
                                    onChange={(e) => setSearchQuery2(e.target.value)}
                                    disabled={isChecking}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all disabled:opacity-50" />
                                {filteredMeds2.length > 0 && !isChecking && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-20">
                                        {filteredMeds2.map(m => <button key={m.medicine_id} onClick={() => { setMed2(m); setSearchQuery2(""); }} className="w-full text-left p-4 hover:bg-emerald-600 font-bold text-xs transition-colors border-b border-slate-700 last:border-0">{m.name}</button>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-center mb-12 relative z-10">
                <button onClick={handleCheck} disabled={(!med1 && !searchQuery1.trim()) || (!med2 && !searchQuery2.trim()) || isChecking}
                    className="px-12 py-5 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-900 font-black flex items-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-emerald-500/20">
                    {isChecking ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
                    {isChecking ? "Consulting Global Medical Intelligence..." : "Run Global Safety Check"}
                </button>
            </div>
            {report && (
                <div className="max-w-4xl mx-auto p-8 rounded-[2rem] bg-white text-slate-900 border border-slate-100 animate-in zoom-in-95 duration-500 shadow-2xl relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.status === 'Safe' ? 'bg-emerald-100 text-emerald-700' : report.status === 'Caution' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {report.status} Analysis
                            </span>
                            <h3 className="text-lg font-black">{report.name1} + {report.name2}</h3>
                        </div>
                        <button onClick={handleReset} className="text-slate-400 hover:text-emerald-600 font-black text-[10px] uppercase tracking-widest">New Check</button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center shrink-0"
                            style={{ borderColor: report.status === 'Safe' ? '#10b981' : report.status === 'Caution' ? '#f59e0b' : report.status === 'Warning' ? '#ef4444' : '#94a3b8' }}>
                            <span className="text-3xl font-black">{report.score}%</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Safety Score</span>
                        </div>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{report.text}"</p>
                    </div>
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
            <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white py-4 text-center px-6 relative overflow-hidden">
                <MedicineHeroBackground medicines={medicines} />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.2),transparent)] pointer-events-none z-10"></div>

                <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center">
                    <div className="max-w-xl text-center">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <Activity size={12} /> Live Inventory Ecosystem
                        </span>
                        <h1 className="text-6xl lg:text-7xl font-black mb-6 tracking-tighter leading-none drop-shadow-2xl italic uppercase">Inventory & <br /><span className="text-emerald-400">Catalogue</span></h1>
                        <p className="text-emerald-100/30 font-bold max-w-lg text-sm leading-relaxed mb-6 mx-auto">
                            Access our pharmaceutical-grade inventory with real-time stock verification and full regulatory compliance.
                        </p>
                    </div>
                </div>
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
                            onClick={() => {
                                setActiveSection(sec.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-3 shrink-0 ${activeSection === sec.id ? "border-emerald-600 text-emerald-800 bg-emerald-50/30" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                        >
                            <sec.icon size={16} strokeWidth={activeSection === sec.id ? 2.5 : 2} />
                            {sec.label}
                            {sec.id === 'browse' && medicines.length > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black">{medicines.length}</span>
                            )}
                        </button>
                    ))}
                </div></div>
            </div>
            {activeSection === "browse" && <BrowseSection medicines={medicines} categories={categories} loading={loading} />}
            {activeSection === "tools" && (
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                    <SmartHealthConsultant medicines={medicines} setActiveSection={setActiveSection} />
                    <MedicineInteractionChecker medicines={medicines} />
                </div>
            )}
            {activeSection === "info" && <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">{healthTips.map((tip, i) => (<div key={i} className="bg-white rounded-[2rem] p-7 border"><div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${tip.color}`}><tip.icon size={22} /></div><p className="font-black text-slate-900 mb-2 text-sm">{tip.title}</p><p className="text-[12px] font-bold text-slate-500">{tip.body}</p></div>))}</div>
                <div className="max-w-3xl mx-auto space-y-3">{faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}</div>
            </div>}
            {activeSection === "contact" && <div className="max-w-7xl mx-auto px-6 py-12"><ContactSection /></div>}

            {/* Premium Trust Banner */}
            <div className="max-w-7xl mx-auto px-6 pb-12 mt-12">
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 flex flex-wrap items-center justify-center gap-12 shadow-sm">
                    <div className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Shield className="text-emerald-600" size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">WHO-GMP Certified</span>
                    </div>
                    <div className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><CheckCircle2 className="text-emerald-600" size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Ministry of Health Regulated</span>
                    </div>
                    <div className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Lock className="text-emerald-600" size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Secure Consultation</span>
                    </div>
                    <div className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><RefreshCw className="text-emerald-600" size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Easy Returns</span>
                    </div>
                </div>
            </div>

            {/* Specialist Nudge - Floating Pill */}
            {activeSection !== 'tools' && (
                <button
                    onClick={() => {
                        setActiveSection('tools');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="fixed bottom-8 left-8 z-[50] group bg-slate-900 text-white pl-6 pr-3 py-3 rounded-full flex items-center gap-4 shadow-2xl hover:bg-emerald-600 transition-all duration-500 scale-90 hover:scale-100 animate-in fade-in slide-in-from-left-10 duration-1000"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 group-hover:text-white">Pro Health Guide</span>
                        <span className="text-xs font-black">Feeling Unwell? Consult Now</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center group-hover:bg-white transition-colors">
                        <BrainCircuit size={18} className="animate-pulse" />
                    </div>
                </button>
            )}

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
