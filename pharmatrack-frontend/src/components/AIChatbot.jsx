import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User, Pill, ArrowRight, Loader2, Info, Settings, Database, Clock } from "lucide-react";
import { sendMessageToAI, IMAGE_BASE_URL } from "../services/api";
import { useNavigate } from "react-router-dom";

const AIChatbot = ({ role = "customer" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const storageKey = `pharmatrack_chat_${role}`;
    const historyKey = `pharmatrack_history_${role}`;

    const isOperational = ["admin", "pharmacist", "staff"].includes(role);

    const defaultGreeting = [{
        id: "start",
        text: isOperational
            ? "System is online. I am your PharmaTrack Operational Assistant. How can I help you manage the pharmacy today?"
            : "Hello! I'm your PharmaTrack Specialist. I'm here to provide professional guidance on your health and medications. How are you feeling today?",
        sender: "ai"
    }];

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : defaultGreeting;
    });

    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem(historyKey);
        return saved ? JSON.parse(saved) : [];
    });

    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    // Persist messages and history
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(messages));
    }, [messages, storageKey]);

    useEffect(() => {
        // Force immediate persistence especially on empty arrays
        localStorage.setItem(historyKey, JSON.stringify(history));
    }, [history, historyKey]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { id: Date.now(), text: inputValue, sender: "user" };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const data = await sendMessageToAI(inputValue, role);
            setTimeout(() => {
                const aiMsg = {
                    id: Date.now() + 1,
                    text: data.reply || "I'm analyzing your request. Could you clarify your needs?",
                    sender: "ai",
                    suggestions: data.suggestions || []
                };
                setMessages(prev => [...prev, aiMsg]);
                setIsTyping(false);
            }, 600);
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "Communication error. Ensure the server is online.",
                sender: "ai"
            }]);
        }
    };

    const toggleChat = () => {
        if (isOpen) {
            // Arhive on close if there's more than the greeting AND it's not a loaded history session
            // (Actually just check if it's the default greeting)
            const isFresh = messages.length === 1 && messages[0].id === "start";
            if (!isFresh) {
                const title = messages.find(m => m.sender === "user")?.text.substring(0, 30) + "..." || "Past Session";
                const newHistoryItem = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleString(),
                    title,
                    messages: [...messages]
                };
                setHistory(prev => {
                    const filtered = prev.filter(h => h.title !== title); // Avoid duplicates
                    return [newHistoryItem, ...filtered].slice(0, 10);
                });
            }
            setMessages(defaultGreeting);
            setIsSidebarOpen(false);
            setIsConfirmingClear(false);
        }
        setIsOpen(!isOpen);
    };

    const loadHistory = (item) => {
        setMessages(item.messages);
        setIsSidebarOpen(false);
    };

    const deleteHistory = (id, e) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const clearAllHistory = () => {
        setHistory([]);
        setMessages(defaultGreeting); // Reset current chat too
        setIsConfirmingClear(false);
        localStorage.removeItem(historyKey); // Wipe history storage
        localStorage.removeItem(storageKey); // Wipe active chat storage
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-sans">
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all group relative border-4 border-white/20 
                        ${isOperational ? 'bg-slate-900 text-indigo-400' : 'bg-emerald-600 text-white'}`}
                >
                    <MessageCircle size={28} />
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white animate-bounce-slow ${isOperational ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                </button>
            )}

            {isOpen && (
                <div className="w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 relative animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* History Sidebar */}
                    {isSidebarOpen && (
                        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm p-6 text-white animate-in slide-in-from-left duration-300 flex flex-col">
                            {!isConfirmingClear ? (
                                <>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-white/50">Chat History</h3>
                                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                                        {history.length === 0 ? (
                                            <div className="text-center py-20">
                                                <Bot size={40} className="mx-auto mb-3 opacity-20" />
                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">No previous sessions</p>
                                            </div>
                                        ) : (
                                            history.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => loadHistory(item)}
                                                    className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative"
                                                >
                                                    <p className="text-[11px] font-bold mb-1 truncate pr-6">{item.title}</p>
                                                    <p className="text-[9px] font-medium text-white/40">{item.timestamp}</p>
                                                    <button
                                                        onClick={(e) => deleteHistory(item.id, e)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-100 p-1.5 hover:text-rose-400 transition-all"
                                                        title="Delete this chat"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {history.length > 0 && (
                                        <button
                                            onClick={() => setIsConfirmingClear(true)}
                                            className="mt-4 w-full py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                        >
                                            Clear All History
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                                    <Bot size={48} className="mb-4 text-rose-500 animate-pulse" />
                                    <h3 className="font-black text-lg mb-2">Delete All History?</h3>
                                    <p className="text-white/50 text-[11px] font-medium mb-8 max-w-[200px]">This action is irreversible and will wipe all past consulting nodes.</p>

                                    <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                        <button
                                            onClick={clearAllHistory}
                                            className="w-full py-4 bg-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/40 hover:bg-rose-500 transition-all"
                                        >
                                            Yes, Wipe Everything
                                        </button>
                                        <button
                                            onClick={() => setIsConfirmingClear(false)}
                                            className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                        >
                                            Nevermind
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Header */}
                    <div className={`p-6 flex items-center justify-between text-white shrink-0 shadow-lg ${isOperational ? 'bg-slate-900' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all"
                                title="View Chat History"
                            >
                                <Clock size={18} />
                            </button>
                            <div>
                                <h3 className="font-black text-sm tracking-tight leading-tight">
                                    {isOperational ? "Operator Assistant" : "Pro Pharmacist AI"}
                                </h3>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Intelligent Node
                                </p>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}>
                                <div className={`max-w-[85%] space-y-2`}>
                                    <div className={`p-4 rounded-2xl text-[13px] font-bold leading-relaxed shadow-sm ${msg.sender === "user"
                                        ? (isOperational ? "bg-slate-800 text-white" : "bg-emerald-600 text-white") + " rounded-tr-none"
                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                        }`}>
                                        {msg.text}
                                    </div>

                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Inventory Matches:</p>
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                                                {msg.suggestions.map(med => (
                                                    <div
                                                        key={med.medicine_id}
                                                        onClick={() => navigate(`/store/medicine/${med.medicine_id}`)}
                                                        className="w-40 flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-3 hover:border-emerald-500 transition-all cursor-pointer shadow-sm group"
                                                    >
                                                        <div className="w-full h-20 bg-slate-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                                                            {med.image_url ? (
                                                                <img src={`${IMAGE_BASE_URL}${med.image_url}`} className="w-full h-full object-cover" />
                                                            ) : <Pill className="text-slate-200" size={24} />}
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-800 truncate">{med.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className={`${isOperational ? 'text-indigo-500' : 'text-emerald-500'} animate-spin`} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Node...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-5 bg-white border-t border-slate-100 shrink-0">
                        <div className="relative flex items-center gap-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Consult our AI..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95
                                    ${isOperational ? 'bg-slate-900' : 'bg-emerald-600'}`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
