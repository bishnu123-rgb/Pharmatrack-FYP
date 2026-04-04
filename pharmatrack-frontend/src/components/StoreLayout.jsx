import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Shield, Search, LogIn, Heart, Phone, X } from "lucide-react";
import { useState, useEffect } from "react";
import AIChatbot from "./AIChatbot";

const StoreLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

    // Stay in sync if URL params change (e.g., navigating back)
    useEffect(() => {
        setSearchQuery(searchParams.get("search") || "");
    }, [searchParams]);

    // Real-time search — update URL param on every keystroke
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (location.pathname === "/store" || location.pathname === "/store/") {
            navigate(`/store?search=${encodeURIComponent(val)}`, { replace: true });
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        navigate("/store", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#f0fdf8]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Top Banner */}
            <div className="bg-emerald-800 text-emerald-100 text-center py-2 text-xs font-bold tracking-wide">
                <span className="flex items-center justify-center gap-2">
                    <Phone size={12} />
                    Call us: +977-9800000000 &nbsp;|&nbsp; Open 8 AM – 10 PM Daily &nbsp;|&nbsp; Free delivery on orders above NPR 500
                </span>
            </div>

            {/* Main Navbar */}
            <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
                    {/* Logo */}
                    <Link to="/store" className="flex items-center gap-2 shrink-0 group">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Heart size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                            Pharma<span className="text-emerald-600">Store</span>
                        </span>
                    </Link>

                    {/* Real-time Search Bar — only shows on /store */}
                    {location.pathname === "/store" && (
                        <div className="flex-1 max-w-xl relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search medicines instantly..."
                                className="w-full pl-12 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-sm text-slate-700 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Nav Actions */}
                    <div className="flex items-center gap-3 ml-auto shrink-0">
                        <a
                            href="https://wa.me/9779800000000"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all border border-emerald-100"
                        >
                            💬 WhatsApp Order
                        </a>
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <LogIn size={16} />
                            Staff Login
                        </Link>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main>{children}</main>
            <AIChatbot role="customer" />

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 mt-20">
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <Heart size={14} className="text-white" />
                            </div>
                            <span className="font-black text-white text-lg">Pharma<span className="text-emerald-400">Store</span></span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-500">Your trusted neighbourhood pharmacy. Quality medicines, professional care.</p>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            Open & Ready to Serve
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-black mb-4 text-sm uppercase tracking-widest">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/store" className="hover:text-emerald-400 transition-colors">Browse Medicines</Link></li>
                            <li><a href="https://wa.me/9779800000000" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Order via WhatsApp</a></li>
                            <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Staff Portal</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-black mb-4 text-sm uppercase tracking-widest">Contact Us</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li>📍 Kathmandu, Nepal</li>
                            <li>📞 +977-9800000000</li>
                            <li>⏰ 8 AM – 10 PM, Every Day</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 text-center py-5 text-xs text-slate-600">
                    © 2025 PharmaStore. Powered by PharmaTrack. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default StoreLayout;
