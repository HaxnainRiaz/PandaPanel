"use client";

import { useAdmin } from "@/context/AdminContext";
import { useState, useEffect } from "react";
import { SearchBar, Button, Input } from "@/components/ui";
import { Plus, Edit2, Trash2, Tag, Layers, X } from "lucide-react";

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory, loading, fetchCategories } = useAdmin();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: "", description: "", slug: "" });

    const filteredCategories = categories.filter(c =>
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateModal = () => {
        setModalMode("create");
        setFormData({ title: "", description: "", slug: "" });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setModalMode("edit");
        setFormData({
            title: category.title,
            description: category.description || "",
            slug: category.slug || ""
        });
        setEditingId(category._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
            await deleteCategory(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const dataPayload = { ...formData, slug };

        if (modalMode === 'create') {
            await addCategory(dataPayload);
        } else {
            await updateCategory(editingId, dataPayload);
        }
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Organizing Collections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Collections</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Curate your product taxonomy and hierarchy</p>
                </div>

                <div className="flex items-center gap-4">
                    <SearchBar
                        placeholder="Find collection..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 md:w-64"
                    />
                    <Button
                        onClick={openCreateModal}
                        icon={Plus}
                    >
                        New Tier
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category._id} className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] hover:shadow-[0_16px_60px_rgba(11,47,38,0.15)] transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FDFCFB]/50 rounded-full -mr-12 -mt-12 group-hover:bg-[#d3d3d3]/10 transition-colors" />

                            <div className="flex items-start justify-between mb-6 relative">
                                <div className="w-14 h-14 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019] shadow-inner">
                                    <Layers size={24} />
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="p-2 text-neutral-300 hover:text-[#0a4019] transition-colors"
                                        title="Edit Collection"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category._id)}
                                        className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                                        title="Delete Collection"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-heading font-bold text-[#0a4019] mb-2 italic">{category.title}</h3>
                            <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2 mb-6 font-medium">
                                {category.description || "No description assigned to this collection tier."}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-[#F5F3F0]/50">
                                <div className="flex items-center gap-2">
                                    <Tag size={12} className="text-[#d3d3d3]" />
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">slug: {category.slug}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#0a4019] bg-[#d3d3d3]/20 px-3 py-1 rounded-full border border-[#d3d3d3]/10">
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-[#F5F3F0]/5 rounded-[3rem] border-2 border-dashed border-[#F5F3F0]">
                        <Layers className="mx-auto text-neutral-200 mb-4" size={48} />
                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">No Collections Found</h3>
                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">Begin by creating your first product category.</p>
                    </div>
                )}
            </div>

            {/* Shared Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 animate-scaleIn border border-white">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">
                                    {modalMode === 'create' ? 'New Collection' : 'Edit Collection'}
                                </h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Expanding the Taxonomy</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-300">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Input
                                    label="Collection Title *"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Rare Elixirs"
                                />

                                <Input
                                    label="Slug (URL Route)"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="rare-elixirs"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">Curator Notes</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl shadow-sm hover:shadow-md font-medium text-[#0a4019] text-sm min-h-[100px]"
                                    placeholder="Describe the essence of this collection..."
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    variant="ghost"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                >
                                    {modalMode === 'create' ? 'Save Collection' : 'Update Collection'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
