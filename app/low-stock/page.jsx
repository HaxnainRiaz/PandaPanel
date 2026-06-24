"use client";

import React, { useState } from "react";
import { Button, Input, SearchBar } from "@/components/ui";
import { AlertCircle, Box, Plus, RefreshCw, X, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

export default function LowStockAlertsPage() {
    const [alerts, setAlerts] = useState([
        { id: 1, name: "Elixir Botanical Nectar", sku: "ELX-BOT-02", stock: 3, threshold: 5, status: "Critical Alert" },
        { id: 2, name: "Organic Rosemary Pack (250g)", sku: "GRM-HER-12", stock: 4, threshold: 10, status: "Warning" },
        { id: 3, name: "Sidr Honey Premium Jar (500g)", sku: "HON-SDR-08", stock: 2, threshold: 8, status: "Critical Alert" },
        { id: 4, name: "Ginseng Tonic Extract", sku: "TON-GIN-05", stock: 8, threshold: 12, status: "Warning" }
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [restockQty, setRestockQty] = useState("50");

    const handleRestockSubmit = (e) => {
        e.preventDefault();
        const qty = parseInt(restockQty || 0);
        if (qty <= 0) return toast.error("Please enter a valid restock quantity");

        setAlerts(alerts.map(item => {
            if (item.id === selectedAlert.id) {
                const newStock = item.stock + qty;
                toast.success(`Restocked ${qty} units for ${item.name}! Total stock is now ${newStock}.`);
                return { ...item, stock: newStock, status: newStock >= item.threshold ? "Restocked" : item.status };
            }
            return item;
        }));
        setSelectedAlert(null);
        setRestockQty("50");
    };

    const filteredAlerts = alerts.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Low Stock Alerts</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Audit depleted products and instantly authorize restocks</p>
                </div>
                <SearchBar
                    placeholder="Search low inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 md:w-64"
                />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[2rem] border border-red-200 shadow-md shadow-red-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-700">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Critical Threshold Items</span>
                        <span className="text-lg font-heading font-bold text-red-700 italic">2 Products Critically Low</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <Box size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Catalog Items Audited</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">148 SKUs Inspected</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Product Name</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">SKU</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Current Stock</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Low Stock Alert Point</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Restock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {filteredAlerts.length > 0 ? (
                                filteredAlerts.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                                    <ShoppingBag size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-[#0a4019]">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                            {item.sku}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-[#0a4019]">
                                            {item.stock} units
                                        </td>
                                        <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium">
                                            {item.threshold} units
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                                item.status === "Restocked"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : item.status === "Critical Alert"
                                                    ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
                                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                            }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => setSelectedAlert(item)}
                                                className="px-3.5 py-1.5 bg-[#0a4019]/10 border border-[#0a4019]/15 text-[#0a4019] text-[10px] font-bold rounded-full uppercase tracking-wider hover:bg-[#0a4019] hover:text-white transition-all"
                                            >
                                                Restock
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <Box className="mx-auto text-neutral-200 mb-4" size={48} />
                                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">All Shelves Stocked</h3>
                                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">No active SKUs have depleted below warning thresholds.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restock Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">Refill Catalog Stock</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Authorizing inventory replenishment</p>
                            </div>
                            <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleRestockSubmit} className="space-y-6">
                            <div className="p-6 bg-[#F5F3F0]/40 rounded-2xl border border-[#F5F3F0] text-sm space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#6B6B6B] font-bold">Product SKU:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedAlert.sku}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#6B6B6B] font-bold">Current Stock Level:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedAlert.stock} units</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#6B6B6B] font-bold">Alert Threshold:</span>
                                    <span className="font-bold text-red-600">{selectedAlert.threshold} units</span>
                                </div>
                            </div>

                            <Input
                                label="Restock Quantity *"
                                type="number"
                                required
                                value={restockQty}
                                onChange={(e) => setRestockQty(e.target.value)}
                                placeholder="e.g. 50"
                            />

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setSelectedAlert(null)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" icon={RefreshCw}>
                                    Replenish SKU
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
