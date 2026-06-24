"use client";

import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, Package, Trash2, Plus, ArrowLeftRight, Save } from "lucide-react";
import { SearchBar, Button } from "@/components/ui";
import Link from "next/link";
import AdminTable from "@/components/admin/AdminTable";
import { resolveImageUrl } from "@/utils/upload";

export default function InventoryPage() {
    const { products, updateProduct, deleteProduct, loading, fetchProducts } = useAdmin();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [localStocks, setLocalStocks] = useState({}); // { productId: stockValue }
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    // Sync local stocks when products load
    useEffect(() => {
        if (products.length > 0) {
            const stocks = {};
            products.forEach(p => {
                stocks[p._id] = p.stock;
            });
            setLocalStocks(stocks);
        }
    }, [products]);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLocalStockChange = (id, newVal) => {
        const val = Math.max(0, parseInt(newVal) || 0);
        setLocalStocks(prev => ({ ...prev, [id]: val }));
    };

    const handleSaveStock = async (id) => {
        setIsUpdating(true);
        const res = await updateProduct(id, { stock: localStocks[id] });
        if (res?.success) addToast('Stock updated successfully', 'success');
        setIsUpdating(false);
    };

    const confirmDelete = (id) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (idToDelete) {
            const res = await deleteProduct(idToDelete);
            if (res?.success) addToast('Asset decommissioned', 'info');
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBatchUpdate = async () => {
        setIsUpdating(true);
        // In a real app we'd have a batch endpoint, for now we do them sequentially but quietly
        for (const [id, stock] of Object.entries(localStocks)) {
            const originalProduct = products.find(p => p._id === id);
            if (originalProduct && originalProduct.stock !== stock) {
                await updateProduct(id, { stock });
            }
        }
        setIsUpdating(false);
        addToast("Inventory synchronized successfully!", "success");
    };

    if (loading && Object.keys(localStocks).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Auditing Stock Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn text-primary">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Inventory Desk</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Global logistics and supply chain optimization</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-2 md:gap-4">
                    <Button
                        variant="secondary"
                        onClick={handleBatchUpdate}
                        disabled={isUpdating}
                        icon={Save}
                        className="px-8 w-full"
                    >
                        Sync All Changes
                    </Button>
                    <Link href="/products">
                        <Button
                            variant="primary"
                            icon={Plus}
                            className="px-8 w-full">
                            Launch New
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Inventory Alerts Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] flex items-center gap-6 relative overflow-hidden group text-[#0a4019]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 group-hover:bg-red-100 transition-colors" />
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-inner relative"><AlertTriangle size={28} /></div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Critical Void</p>
                        <p className="text-3xl font-heading font-bold text-[#0a4019] italic">{products.filter(p => p.stock === 0).length} Lines</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] flex items-center gap-6 relative overflow-hidden group text-[#0a4019]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:bg-orange-100 transition-colors" />
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl shadow-inner relative"><ArrowLeftRight size={28} /></div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Low Reserves</p>
                        <p className="text-3xl font-heading font-bold text-[#0a4019] italic">{products.filter(p => p.stock > 0 && p.stock < 10).length} Lines</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] flex items-center gap-6 relative overflow-hidden group text-[#0a4019]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:bg-green-100 transition-colors" />
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner relative"><CheckCircle size={28} /></div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Optimal Tier</p>
                        <p className="text-3xl font-heading font-bold text-[#0a4019] italic">{products.filter(p => p.stock >= 10).length} Lines</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] border border-[#F5F3F0] overflow-hidden">
                <div className="p-8 border-b border-[#F5F3F0] bg-[#F5F3F0]/5">
                    <SearchBar
                        placeholder="Interrogate SKU database..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md shadow-inner"
                    />
                </div>
                <div className="p-4 md:p-8">
                    <AdminTable
                        columns={[
                            {
                                id: 'title',
                                header: 'Assigned Asset',
                                cell: ({ row }) => (
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden relative border border-[#F5F3F0] shadow-inner">
                                            <img
                                                src={resolveImageUrl(row.original.images?.[0])}
                                                alt={row.original.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = "https://placehold.co/100x100/F5F3F0/0a4019?text=Error";
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-heading font-bold text-[#0a4019] text-base italic leading-tight mb-1">{row.original.title}</p>
                                            <p className="text-[10px] font-bold text-[#d3d3d3] uppercase tracking-widest">{row.original.category?.name || "Uncategorized"}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                accessorKey: '_id',
                                header: 'Registry ID',
                                cell: ({ row }) => (
                                    <span className="text-[10px] font-mono text-neutral-400 font-bold bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                        REF:{row.original._id.toString().substring(18).toUpperCase()}
                                    </span>
                                )
                            },
                            {
                                id: 'stock',
                                header: 'Available Units',
                                cell: ({ row }) => {
                                    const product = row.original;
                                    const currentStock = localStocks[product._id] ?? product.stock;
                                    const hasChanged = currentStock !== product.stock;

                                    return (
                                        <div className="flex items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="w-10 h-10 rounded-xl border border-neutral-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-[#0a4019] font-bold shadow-sm active:scale-90 bg-neutral-50"
                                                onClick={() => handleLocalStockChange(product._id, currentStock - 1)}
                                            >
                                                -
                                            </button>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={currentStock}
                                                    onChange={(e) => handleLocalStockChange(product._id, e.target.value)}
                                                    className={`w-20 text-center border rounded-xl py-2 font-heading font-bold text-[#0a4019] text-lg transition-all duration-300 shadow-sm ${hasChanged ? 'border-[#d3d3d3] bg-[#d3d3d3]/5 ring-2 ring-[#d3d3d3]/20' : 'border-[#F5F3F0] bg-[#FDFCFB]'}`}
                                                />
                                            </div>
                                            <button
                                                className="w-10 h-10 rounded-xl border border-neutral-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-[#0a4019] font-bold shadow-sm active:scale-90 bg-neutral-50"
                                                onClick={() => handleLocalStockChange(product._id, currentStock + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    );
                                }
                            },
                            {
                                id: 'status',
                                header: 'Logistics Status',
                                cell: ({ row }) => {
                                    const currentStock = localStocks[row.original._id] ?? row.original.stock;

                                    return (
                                        <span className={`
                                            inline-flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm
                                            ${currentStock === 0 ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${currentStock < 10 && currentStock > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                            ${currentStock >= 10 ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${currentStock === 0 ? 'bg-red-500' : (currentStock < 10 ? 'bg-orange-500' : 'bg-green-500')}`} />
                                            {currentStock === 0 ? 'Inert' : (currentStock < 10 ? 'Unstable' : 'Certified')}
                                        </span>
                                    );
                                }
                            },
                            {
                                id: 'actions',
                                header: 'Operations',
                                cell: ({ row }) => {
                                    const product = row.original;
                                    const currentStock = localStocks[product._id] ?? product.stock;
                                    const hasChanged = currentStock !== product.stock;

                                    return (
                                        <div className="flex items-center justify-end gap-3 transition-all" onClick={e => e.stopPropagation()}>
                                            {hasChanged && (
                                                <button
                                                    onClick={() => handleSaveStock(product._id)}
                                                    disabled={isUpdating}
                                                    className="p-3 bg-[#d3d3d3]/20 text-[#0a4019] rounded-xl hover:bg-[#d3d3d3] transition-all shadow-sm"
                                                    title="Save Individual Change"
                                                >
                                                    <Save size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => confirmDelete(product._id)}
                                                className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                                                title="Decommission Asset"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                }
                            }
                        ]}
                        data={filteredProducts}
                    />
                </div>

            </div>

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/20 backdrop-blur-md">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-md w-full mx-4 animate-scaleIn border border-[#FDFCFB] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                        <h3 className="text-2xl font-heading font-bold text-[#0a4019] mb-3 italic">Decommission Asset?</h3>
                        <p className="text-[#6B6B6B] mb-8 leading-relaxed font-medium">This action will permanently purge the item from the central inventory and storefront. This operation is irreversible.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 border border-neutral-200 text-neutral-400 font-bold rounded-2xl hover:bg-neutral-50 transition-colors uppercase tracking-widest text-[10px]"
                            >
                                Abort
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-shadow shadow-lg shadow-red-200 active:scale-95 uppercase tracking-widest text-[10px]"
                            >
                                Confirm Purge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
