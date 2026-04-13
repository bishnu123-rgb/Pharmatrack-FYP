import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, Layers } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/api";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canEdit = ["admin", "pharmacist"].includes(user.role);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            setError("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (editId) {
                await updateCategory(editId, name);
            } else {
                await createCategory(name);
            }
            setModalOpen(false);
            setName("");
            setEditId(null);
            fetchCategories();
        } catch (err) {
            setError("Operation failed");
        }
    };

    const handleEdit = (cat) => {
        setName(cat.name);
        setEditId(cat.category_id);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this category?")) {
            try {
                await deleteCategory(id);
                fetchCategories();
            } catch (err) {
                alert("Failed to remove category. Make sure no medicines are using this category.");
            }
        }
    };


    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Offline</h2>
                <p className="text-slate-500 font-bold max-w-sm">
                    {error || "Could not load categories at this time."}
                </p>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medicine Categories</h1>
                    <p className="text-slate-500 font-bold">Manage categories for your medicine stock.</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => { setModalOpen(true); setEditId(null); setName(""); }}
                        className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} />
                        Add Category
                    </button>
                )}
            </div>


            <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0"></div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">ID</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Category Name</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                        </tr>

                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.map((cat) => (
                            <tr key={cat.category_id} className="group hover:bg-indigo-50/30 transition-colors duration-300">
                                <td className="px-10 py-6">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg border border-slate-200">
                                        #IDX-{cat.category_id.toString().padStart(3, '0')}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        {canEdit && (
                                            <>
                                                <button onClick={() => handleEdit(cat)} className="p-3 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all active:scale-95">
                                                    <Edit size={18} />
                                                </button>
                                                {user.role === "admin" && (
                                                    <button onClick={() => handleDelete(cat.category_id)} className="p-3 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all active:scale-95">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <Layers size={64} className="mb-6 opacity-20" />
                        <p className="font-bold text-lg">No Categories Found</p>
                        <p className="text-sm font-medium">Add a category to start organizing your medicines.</p>
                    </div>
                )}

            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors">
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{editId ? "Edit Category" : "Add New Category"}</h2>
                            <p className="text-slate-500 text-sm font-bold">Update category details below.</p>
                        </div>


                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>

                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder-slate-400"
                                    placeholder="e.g. Analgesics"
                                />
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg tracking-tight hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {editId ? "Save Changes" : "Save Category"}
                            </button>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
