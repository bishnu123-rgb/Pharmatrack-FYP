import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, HeartPulse, Pill, Bot, ArrowUpRight, Activity } from "lucide-react";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden font-sans bg-slate-900">
            <div className="absolute inset-0 z-0">
                <img
                    src="/hero-bg.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900"></div>
            </div>

            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center min-h-screen">
                <div className="w-full flex justify-between items-center mb-16 animate-in fade-in duration-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Pill className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter">PHARMATRACK</h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Intelligence System</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-white/40">
                        <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Edition v2.0</span>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="flex items-center gap-2 text-emerald-500">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Validated Protocol</span>
                        </div>
                    </div>
                </div>

                <div className="text-center max-w-4xl mb-20 space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.95]">
                        The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-400 animate-gradient-x">Pharmacy</span> Management.
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
                        An intelligent ecosystem bridging real-time inventory precision with professional health consultation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mb-12">
                    <div
                        onClick={() => navigate('/store')}
                        className="group relative bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2 hover:border-emerald-500/30"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:bg-emerald-500/40 transition-all">
                                <HeartPulse size={32} />
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4 leading-tight tracking-tight">Customer Health<br />Portal</h3>
                            <p className="text-white/50 font-medium mb-12 flex-1 leading-relaxed">
                                Access the live pharmacy catalogue, check drug interactions, and consult with our AI Specialist for safe medical guidance.
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                    Public Access
                                </span>
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/dashboard')}
                        className="group relative bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2 hover:border-indigo-500/30"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-all"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/20 group-hover:bg-indigo-500/40 transition-all">
                                <Activity size={32} />
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4 leading-tight tracking-tight">Enterprise Control<br />Center</h3>
                            <p className="text-white/50 font-medium mb-12 flex-1 leading-relaxed">
                                Advanced inventory telemetry, sales analytics, procurement management, and AI-driven strategic operational insights.
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                    Authorized Only
                                </span>
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-500">
                    {[
                        { label: "AI Availability", value: "99.9%", icon: Bot },
                        { label: "Inventory Nodes", value: "Real-time", icon: Activity },
                        { label: "Data Integrity", value: "E2E Encrypted", icon: ShieldCheck },
                        { label: "System Latency", value: "< 50ms", icon: Activity },
                    ].map((stat, i) => (
                        <div key={StatLabel(stat.label)} className="flex items-center gap-4 py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                            <stat.icon size={18} className="text-white/30 group-hover:text-indigo-400 transition-colors" />
                            <div>
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <p className="text-sm font-black text-white/70">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            </div>

            <style>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: left center; }
                    50% { background-position: right center; }
                }
                .animate-gradient-x {
                    background-size: 200% auto;
                    animation: gradient-x 5s linear infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

const StatLabel = (label) => label.replace(/\s+/g, '-').toLowerCase();

export default Home;
