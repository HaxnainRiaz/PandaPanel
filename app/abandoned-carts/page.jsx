"use client";

import React, { useState } from "react";
import { Button, SearchBar } from "@/components/ui";
import { ShoppingCart, Send, Eye, X, Mail, Phone, Calendar, DollarSign, Package } from "lucide-react";
import toast from "react-hot-toast";

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState([
        {
            id: 1,
            customerName: "Muhammad Ali",
            contact: "muhammad.ali@gmail.com",
            value: "PKR 18,500",
            itemsCount: 3,
            lastActivity: "2 hours ago",
            status: "Pending",
            products: [
                { name: "Elixir Botanical Nectar", price: "PKR 4,500", qty: 2 },
                { name: "Organic Honey Jar (500g)", price: "PKR 9,500", qty: 1 }
            ]
        },
        {
            id: 2,
            customerName: "Ayesha Khan",
            contact: "+92 321 4567890",
            value: "PKR 4,200",
            itemsCount: 1,
            lastActivity: "5 hours ago",
            status: "Reminder Sent",
            products: [
                { name: "Premium Saffron Threads (1g)", price: "PKR 4,200", qty: 1 }
            ]
        },
        {
            id: 3,
            customerName: "Bilal Ahmed",
            contact: "bilal.ahmed@yahoo.com",
            value: "PKR 29,000",
            itemsCount: 5,
            lastActivity: "1 day ago",
            status: "Pending",
            products: [
                { name: "Wild Ginseng Roots", price: "PKR 15,000", qty: 1 },
                { name: "Pure Almond Oil (250ml)", price: "PKR 3,500", qty: 4 }
            ]
        },
        {
            id: 4,
            customerName: "Zainab Fatima",
            contact: "zainab.f@gmail.com",
            value: "PKR 11,200",
            itemsCount: 2,
            lastActivity: "2 days ago",
            status: "Recovered",
            products: [
                { name: "Organic Aloe Vera Extract", price: "PKR 5,600", qty: 2 }
            ]
        }
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCart, setSelectedCart] = useState(null);

    const handleSendReminder = (id) => {
        setCarts(carts.map(c => {
            if (c.id === id) {
                toast.success(`Recovery reminder SMS/Email dispatched to ${c.customerName}!`);
                return { ...c, status: "Reminder Sent" };
            }
            return c;
        }));
    };

    const handleViewCart = (cart) => {
        setSelectedCart(cart);
    };

    const filteredCarts = carts.filter(c =>
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Abandoned Carts</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Track pending customer carts and dispatch recovery reminders</p>
                </div>
                <SearchBar
                    placeholder="Search customer carts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 md:w-64"
                />
            </div>

            {/* Recovery Rate statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Unconverted Carts</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">3 Active Carts</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Sum Abandoned Value</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">PKR 51,700</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <Package size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Recovery Conversion Rate</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">25.0% Recycled</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Customer Coordinates</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Cart Value</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Items Count</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Last Activity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Recovery Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {filteredCarts.length > 0 ? (
                                filteredCarts.map((c) => (
                                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-[#0a4019]">{c.customerName}</div>
                                                <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                                                    {c.contact.includes("@") ? <Mail size={10} /> : <Phone size={10} />}
                                                    {c.contact}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-[#0a4019]">
                                            {c.value}
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-bold tracking-wider">
                                            {c.itemsCount} products
                                        </td>
                                        <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium flex items-center gap-1.5 pt-7">
                                            <Calendar size={12} className="text-[#B8A68A]" />
                                            <span>{c.lastActivity}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                                c.status === "Recovered"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : c.status === "Reminder Sent"
                                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            }`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {c.status !== "Recovered" && (
                                                    <button
                                                        onClick={() => handleSendReminder(c.id)}
                                                        className="p-2.5 bg-[#0a4019]/5 border border-[#0a4019]/10 rounded-xl hover:bg-[#0a4019] hover:text-white text-[#0a4019] transition-all"
                                                        title="Send recovery reminder notification"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleViewCart(c)}
                                                    className="p-2.5 bg-[#d3d3d3]/20 border border-[#d3d3d3]/10 rounded-xl hover:bg-[#d3d3d3] hover:text-[#0a4019] text-[#0a4019] transition-all"
                                                    title="View items inside cart"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <ShoppingCart className="mx-auto text-neutral-200 mb-4" size={48} />
                                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">No Abandoned Carts</h3>
                                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">All active customer carts converted cleanly!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cart details modal */}
            {selectedCart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">{selectedCart.customerName}'s Cart</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Pending products in checkout drawer</p>
                            </div>
                            <button onClick={() => setSelectedCart(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Products List inside cart */}
                            <div className="divide-y divide-[#F5F3F0] max-h-[300px] overflow-y-auto pr-2">
                                {selectedCart.products.map((p, idx) => (
                                    <div key={idx} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0a4019]">{p.name}</h4>
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">QTY: {p.qty}</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#0a4019]">{p.price}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Value */}
                            <div className="p-6 bg-[#F5F3F0]/40 rounded-2xl border border-[#F5F3F0] flex justify-between items-center">
                                <span className="text-xs text-[#6B6B6B] font-bold uppercase tracking-wider">Cumulative Cart Value:</span>
                                <span className="text-lg font-heading font-bold text-[#0a4019] italic">{selectedCart.value}</span>
                            </div>

                            {/* Dismiss */}
                            <div className="pt-4 flex gap-4">
                                <Button onClick={() => setSelectedCart(null)} variant="ghost" className="flex-1">
                                    Dismiss Review
                                </Button>
                                {selectedCart.status !== "Recovered" && (
                                    <Button
                                        onClick={() => {
                                            handleSendReminder(selectedCart.id);
                                            setSelectedCart(null);
                                        }}
                                        className="flex-1"
                                        icon={Send}
                                    >
                                        Send Reminder
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
