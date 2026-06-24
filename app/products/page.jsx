"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import ProductTable from "@/components/admin/ProductTable";
import { SearchBar, Button, Dropdown, Input, MultiSelect } from "@/components/ui";
import { Plus, X, Save, ArrowLeft, Trash2, Upload, Loader2, Star, Globe, Package } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { uploadImage, validateImageFile, resolveImageUrl, pickImageUrl } from '@/utils/upload';
import { loadQuillContent } from "@/utils/quill";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="p-10 flex items-center justify-center text-neutral-500">Loading editor...</div> });

const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'];

const quillFormats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'indent',
    'align',
    'link', 'image',
    'styled-quote'
];

export default function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct, categories, refreshData, fetchCategories } = useAdmin();
    const { addToast } = useToast();

    useEffect(() => {
        if (refreshData) refreshData();
        if (fetchCategories) fetchCategories();
    }, [refreshData, fetchCategories]);

    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-quill-new'),
                import('@/utils/quill-custom-blots')
            ]).then(([QuillNamespace, CustomBlots]) => {
                const Quill = QuillNamespace.default.Quill || QuillNamespace.Quill;
                CustomBlots.registerCustomBlots(Quill);
                const Size = Quill.import('attributors/style/size');
                Size.whitelist = fontSizes;
                Quill.register(Size, true);
            });
        }
    }, []);

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'size': fontSizes }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    }), []);

    const emptyProduct = {
        title: "",
        slug: "",
        description: "",
        price: "",
        salePrice: "",
        stock: "",
        category: [],
        images: [],
        visibilityStatus: "published",
        isBestseller: false,
        isFeatured: false,
        seo: {
            metaTitle: "",
            metaDescription: ""
        }
    };

    const handleEdit = (product) => {
        const productForEditing = {
            ...product,
            isBestseller: product.isBestSeller || false,
            category: Array.isArray(product.category)
                ? product.category.map(c => typeof c === 'object' ? c._id : c)
                : (product.category ? [typeof product.category === 'object' ? product.category._id : product.category] : []),
            seo: {
                metaTitle: product.metaTitle || "",
                metaDescription: product.metaDescription || ""
            },
            visibilityStatus: product.status === 'inactive' ? 'draft' : 'published',
            images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : [])
        };
        setCurrentProduct(productForEditing);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentProduct({ ...emptyProduct });
        setIsEditing(true);
    };

    const confirmDelete = (id) => {
        setProductToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmBulkDelete = (ids) => {
        setBulkDeleteIds(ids);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (productToDelete) {
            const id = productToDelete;
            setProductToDelete(null);
            setIsDeleteModalOpen(false);
            const res = await deleteProduct(id);
            if (res?.success) addToast('Product deleted successfully', 'info');
        } else if (bulkDeleteIds.length > 0) {
            const ids = [...bulkDeleteIds];
            setBulkDeleteIds([]);
            setIsDeleteModalOpen(false);

            let successCount = 0;
            for (const id of ids) {
                const res = await deleteProduct(id);
                if (res?.success) successCount++;
            }
            addToast(`Successfully deleted ${successCount} products`, 'info');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError("");

        let finalSlug = currentProduct.slug;
        if (!finalSlug && currentProduct.title) {
            finalSlug = currentProduct.title.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        const productData = {
            ...currentProduct,
            slug: finalSlug,
            price: Number(currentProduct.price),
            salePrice: currentProduct.salePrice ? Number(currentProduct.salePrice) : null,
            stock: Number(currentProduct.stock),
            description: currentProduct.description || "No description provided.",
            status: currentProduct.visibilityStatus === 'draft' ? 'inactive' : 'active',
            isBestSeller: currentProduct.isBestseller,
            metaTitle: currentProduct.seo?.metaTitle || "",
            metaDescription: currentProduct.seo?.metaDescription || ""
        };

        delete productData.visibilityStatus;
        delete productData.isBestseller;
        delete productData.seo;

        let success = false;
        if (currentProduct._id) {
            success = await updateProduct(currentProduct._id, productData);
        } else {
            success = await addProduct(productData);
        }

        if (success?.success) {
            setIsEditing(false);
            setCurrentProduct(null);
            addToast(`Product ${currentProduct._id ? 'updated' : 'created'} successfully`, 'success');
        } else {
            setSaveError("Failed to save product. Check required fields.");
            addToast('Failed to save product', 'error');
        }
        setIsSaving(false);
    };

    const handleImageRemove = (index) => {
        const newImages = currentProduct.images.filter((_, i) => i !== index);
        setCurrentProduct({ ...currentProduct, images: newImages });
    };

    const setPrimaryImage = (index) => {
        const newImages = [...currentProduct.images];
        const [primary] = newImages.splice(index, 1);
        newImages.unshift(primary);
        setCurrentProduct({ ...currentProduct, images: newImages });
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImage(true);
        setUploadProgress(0);

        try {
            // Process sequentially to match Blog behavior and prevent race conditions
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const validation = validateImageFile(file);

                if (!validation.valid) {
                    addToast(`${file.name}: ${validation.error}`, 'error');
                    continue;
                }

                // 1. Show Instant Local Preview (like Blog)
                const localPreviewUrl = URL.createObjectURL(file);

                // Add to state immediately
                setCurrentProduct(prev => ({
                    ...prev,
                    images: [...(prev.images || []), localPreviewUrl]
                }));

                try {
                    // 2. Perform Backend Upload
                    const serverUrl = await uploadImage(file);

                    // 3. Finalize with Server URL (Swap)
                    // We swap by matching the exact localPreviewUrl in the array
                    setCurrentProduct(prev => {
                        const newImages = [...(prev.images || [])];
                        const index = newImages.indexOf(localPreviewUrl);
                        if (index !== -1) {
                            newImages[index] = serverUrl;
                        } else {
                            // Fallback if index lost (rare), just push
                            // newImages.push(serverUrl); 
                            // Only swap if found to avoid dupes or reordering issues
                        }
                        return { ...prev, images: newImages };
                    });

                    // Clean up blob URL AFTER swap
                    URL.revokeObjectURL(localPreviewUrl);
                } catch (err) {
                    console.error("Upload failed for file", file.name, err);
                    addToast(`${file.name}: ${err.message}`, 'error');
                    setCurrentProduct(prev => ({
                        ...prev,
                        images: (prev.images || []).filter(img => img !== localPreviewUrl)
                    }));
                    URL.revokeObjectURL(localPreviewUrl);
                }

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
        } catch (error) {
            addToast(`Failed to upload: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                setUploadingImage(false);
                setUploadProgress(0);
            }, 500);
            e.target.value = '';
        }
    };

    const addImageUrl = (url) => {
        if (url && url.trim()) {
            setCurrentProduct({
                ...currentProduct,
                images: [...currentProduct.images, url.trim()]
            });
        }
    };

    const filteredProducts = products.filter(p => {
        const titleMatch = (p.title || "").toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = Array.isArray(p.category) 
            ? p.category.some(c => (typeof c === 'object' ? c.title : "").toLowerCase().includes(searchTerm.toLowerCase()))
            : (p.category && typeof p.category === 'object' && p.category.title ? p.category.title.toLowerCase().includes(searchTerm.toLowerCase()) : false);
        return titleMatch || categoryMatch;
    });

    return (
        <div className="space-y-6">
            {!isEditing && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-[#0a4019]">Products</h1>
                        <p className="text-[#6B6B6B]">Manage your catalog dynamically</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SearchBar
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <Button onClick={handleAddNew} icon={Plus}>Add Product</Button>
                    </div>
                </div>
            )}

            {isEditing ? (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] p-8 animate-fadeIn max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#F5F3F0]">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-[#0a4019]" />
                            </button>
                            <h2 className="text-2xl font-heading font-bold text-[#0a4019]">
                                {currentProduct._id ? "Edit Product" : "New Product"}
                            </h2>
                        </div>
                    </div>

                    {saveError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                            {saveError}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="Product Title *"
                                    value={currentProduct.title}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, title: e.target.value })}
                                    required
                                    className="md:col-span-2"
                                />

                                <div className="md:col-span-2 space-y-3">
                                    <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider">Product Description *</label>
                                    <div className="quill-premium-wrapper">
                                        <ReactQuill
                                            theme="snow"
                                            value={loadQuillContent(currentProduct.description)}
                                            onChange={(content, delta, source, editor) => {
                                                const deltaJson = JSON.stringify(editor.getContents().ops);
                                                setCurrentProduct({ ...currentProduct, description: deltaJson });
                                            }}
                                            modules={quillModules}
                                            formats={quillFormats}
                                        />
                                    </div>
                                </div>

                                <Input label="Slug (URL)" value={currentProduct.slug} onChange={(e) => setCurrentProduct({ ...currentProduct, slug: e.target.value })} />
                                <MultiSelect
                                    label="Categories *"
                                    value={currentProduct.category}
                                    onChange={(val) => setCurrentProduct({ ...currentProduct, category: val })}
                                    options={categories.map(cat => ({ value: cat._id, label: cat.title }))}
                                />
                                <Input label="Price (PKR) *" type="number" value={currentProduct.price} onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })} required />
                                <Input label="Sale Price (PKR)" type="number" value={currentProduct.salePrice || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, salePrice: e.target.value })} />
                                <Input label="Stock *" type="number" value={currentProduct.stock} onChange={(e) => setCurrentProduct({ ...currentProduct, stock: e.target.value })} required />
                            </div>

                            {/* SEO Section */}
                            <div className="pt-8 border-t border-[#F5F3F0] space-y-6">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-[#B8A68A]" size={20} />
                                    <h3 className="text-xl font-heading font-bold text-[#0a4019]">Search Engine Presence</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <Input
                                        label="Meta Title (SEO)"
                                        placeholder="Optimized title for Google"
                                        value={currentProduct.seo?.metaTitle}
                                        onChange={(e) => setCurrentProduct({
                                            ...currentProduct,
                                            seo: { ...currentProduct.seo, metaTitle: e.target.value }
                                        })}
                                    />

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider">Meta Description</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Write a compelling summary for search results..."
                                            value={currentProduct.seo?.metaDescription}
                                            onChange={(e) => setCurrentProduct({
                                                ...currentProduct,
                                                seo: { ...currentProduct.seo, metaDescription: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-white border border-[#F5F3F0] rounded-xl text-sm text-[#0a4019]"
                                        />
                                        <p className="text-[10px] text-neutral-400 italic">Recommended: 150-160 characters</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#F5F3F0]/10 p-6 rounded-2xl border border-[#F5F3F0]/30 shadow-inner">
                                <label className="block text-[10px] font-bold text-[#0a4019] mb-3 uppercase tracking-wider">
                                    Product Media ({currentProduct.images?.length || 0})
                                </label>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {currentProduct.images?.map((img, idx) => (
                                        <div key={`${img}-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-[#F5F3F0] group shadow-sm">
                                            <img
                                                src={typeof img === 'string' && img.startsWith('blob:') ? img : pickImageUrl(img, 'medium')}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                {idx !== 0 && (
                                                    <button type="button" onClick={() => setPrimaryImage(idx)} className="p-1.5 bg-white text-[#0a4019] rounded-lg shadow-lg hover:scale-110 transition-transform" title="Set as Primary">
                                                        <Star size={14} fill={idx === 0 ? "currentColor" : "none"} />
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => handleImageRemove(idx)} className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-[#0a4019]/90 text-white text-[7px] font-bold py-1 text-center uppercase tracking-widest">
                                                    Primary Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {uploadingImage ? (
                                        <div className="aspect-square rounded-xl border-2 border-[#d3d3d3] border-dashed flex flex-col items-center justify-center bg-[#FDFCFB]">
                                            <Loader2 className="text-[#0a4019] animate-spin mb-2" size={24} />
                                            <span className="text-[10px] font-bold text-[#0a4019]">{uploadProgress}%</span>
                                        </div>
                                    ) : (
                                        <label htmlFor="file-upload" className="aspect-square rounded-xl border-2 border-dashed border-[#F5F3F0] flex flex-col items-center justify-center text-neutral-300 gap-1 hover:bg-neutral-100 transition-all cursor-pointer">
                                            <Plus size={24} />
                                            <span className="text-[8px] font-bold uppercase">Add Media</span>
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} id="file-upload" className="hidden" disabled={uploadingImage} />
                                        <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full py-3 border border-neutral-300 border-dashed rounded-xl bg-white hover:bg-neutral-50 transition-all cursor-pointer">
                                            <Upload size={14} className="text-neutral-400" />
                                            <span className="text-[10px] font-bold text-neutral-500 uppercase">Upload Images</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#FDFCFB] p-6 rounded-2xl border border-[#F5F3F0] space-y-5">
                                <label className="block text-[10px] font-bold text-[#0a4019] mb-1 uppercase tracking-widest">Merchandising Badges</label>

                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#F5F3F0]/50">
                                    <div className="flex items-center gap-3">
                                        <Star size={16} className={currentProduct.isFeatured ? "text-yellow-500 fill-yellow-500" : "text-neutral-300"} />
                                        <span className="text-xs font-bold text-[#0a4019]">Featured Asset</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentProduct({ ...currentProduct, isFeatured: !currentProduct.isFeatured })}
                                        className={`w-10 h-5 rounded-full transition-all relative ${currentProduct.isFeatured ? 'bg-[#0a4019]' : 'bg-neutral-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${currentProduct.isFeatured ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#F5F3F0]/50">
                                    <div className="flex items-center gap-3">
                                        <Package size={16} className={currentProduct.isBestseller ? "text-orange-500" : "text-neutral-300"} />
                                        <span className="text-xs font-bold text-[#0a4019]">Bestseller Node</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentProduct({ ...currentProduct, isBestseller: !currentProduct.isBestseller })}
                                        className={`w-10 h-5 rounded-full transition-all relative ${currentProduct.isBestseller ? 'bg-[#0a4019]' : 'bg-neutral-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${currentProduct.isBestseller ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>

                                <Dropdown
                                    label="Visibility Status"
                                    value={currentProduct.visibilityStatus}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, visibilityStatus: e.target.value })}
                                    options={[
                                        { value: "published", label: "Published" },
                                        { value: "draft", label: "Draft" }
                                    ]}
                                />
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button type="submit" disabled={isSaving || uploadingImage} variant="primary" className="w-full h-14" icon={isSaving ? null : Save}>
                                    {isSaving ? "Saving..." : "Save Product"}
                                </Button>
                                <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="w-full">Discard</Button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="animate-fadeIn">
                    <ProductTable products={filteredProducts} onEdit={handleEdit} onDelete={confirmDelete} onBulkDelete={confirmBulkDelete} />
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[#F5F3F0]">
                        <h3 className="text-lg font-bold text-[#0a4019] mb-2">Delete {bulkDeleteIds.length > 0 ? `${bulkDeleteIds.length} Products` : 'Product'}</h3>
                        <p className="text-sm text-neutral-600 mb-6">Are you sure you want to permanently delete {bulkDeleteIds.length > 0 ? 'these products' : 'this product'}?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); setBulkDeleteIds([]); }} className="px-4 py-2 bg-gray-200 rounded-xl">Cancel</button>
                            <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .quill-premium-wrapper .ql-toolbar.ql-snow { 
                    border: 1px solid #F5F3F0; 
                    border-bottom: none; 
                    background: white; 
                    border-radius: 1rem 1rem 0 0; 
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .quill-premium-wrapper .ql-container.ql-snow { 
                    border: 1px solid #F5F3F0; 
                    min-height: 200px; 
                    border-radius: 0 0 1rem 1rem; 
                    background: white; 
                    font-family: inherit; 
                }
                .quill-premium-wrapper .ql-editor {
                    padding: 24px;
                    min-height: 200px;
                    color: #0a4019;
                    line-height: 1.8;
                }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size { width: 100px; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                    content: 'Normal' !important;
                }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before { content: 'Tiny (10px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before { content: 'Small (12px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before { content: 'Regular (14px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before { content: 'Normal (16px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before { content: 'Medium (18px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before { content: 'Large (20px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before { content: 'X-Large (24px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="30px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="30px"]::before { content: 'Heading (30px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="36px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="36px"]::before { content: 'Title (36px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="48px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="48px"]::before { content: 'Display (48px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="60px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="60px"]::before { content: 'Mega (60px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="72px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="72px"]::before { content: 'Ultra (72px)' !important; }

                .quill-premium-wrapper .ql-snow .ql-stroke { stroke: #0a4019; }
                .quill-premium-wrapper .ql-snow .ql-fill { fill: #0a4019; }
                .quill-premium-wrapper .ql-snow .ql-picker { color: #0a4019; font-weight: 600; }

                .styled-quote-block {
                    margin: 1.5rem 0;
                    padding: 1rem;
                    font-family: serif;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
