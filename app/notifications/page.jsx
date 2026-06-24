"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { Bell, ShoppingBag, Box, ShieldAlert, Truck, Star, LifeBuoy, X, Check, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            category: "orders",
            title: "New Checkout Order #8809 Booked",
            desc: "Customer Muhammad Ali purchased 2x Elixir Botanical Nectar & 1x Organic Honey Jar.",
            time: "10 mins ago",
            unread: true,
            icon: ShoppingBag,
            color: "emerald"
        },
        {
            id: 2,
            category: "stock",
            title: "Low Stock Alert: Elixir Botanical Nectar",
            desc: "SKU 'ELX-BOT-02' inventory has fallen to 3 units, below the threshold of 5.",
            time: "1 hour ago",
            unread: true,
            icon: Box,
            color: "amber"
        },
        {
            id: 3,
            category: "wallet",
            title: "Wallet Limit Threshold Warning",
            desc: "Pending platform service fee has crossed PKR 4,000. Please clear dues soon.",
            time: "2 hours ago",
            unread: true,
            icon: ShieldAlert,
            color: "red"
        },
        {
            id: 4,
            category: "shipments",
            title: "PostEx Shipment #PX99881 Delivered",
            desc: "Bulk package successfully delivered to customer coordinates in Lahore.",
            time: "4 hours ago",
            unread: false,
            icon: Truck,
            color: "emerald"
        },
        {
            id: 5,
            category: "reviews",
            title: "5-Star Review Received",
            desc: "Customer Muhammad Ali reviewed: 'Absolutely premium quality organic elixirs!'",
            time: "1 day ago",
            unread: false,
            icon: Star,
            color: "amber"
        },
        {
            id: 6,
            category: "support",
            title: "Support Ticket #ST1005 Resolved",
            desc: "Your logistical clearance support request has been settled by support core.",
            time: "2 days ago",
            unread: false,
            icon: LifeBuoy,
            color: "sky"
        }
    ]);

    const [activeTab, setActiveTab] = useState("all");

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
        toast.success("All notifications marked as read!");
    };

    const handleDelete = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success("Notification cleared");
    };

    const handleMarkOneRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
        toast.success("Marked as read");
    };

    const filteredNotifs = notifications.filter(n => activeTab === "all" || n.category === activeTab);

    // Color mapper helpers
    const colorsMap = {
        emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
        amber: "bg-amber-100 text-amber-800 border-amber-200",
        red: "bg-red-100 text-red-800 border-red-200",
        sky: "bg-sky-100 text-sky-800 border-sky-200"
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Notifications</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Review system alerts, inventory checks, wallet statuses, and tickets</p>
                </div>
                <div className="flex items-center gap-4">
                    {notifications.some(n => n.unread) && (
                        <Button onClick={handleMarkAllRead} icon={Check}>
                            Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs Filter Row */}
            <div className="flex flex-wrap gap-2.5 pb-2 border-b border-[#F5F3F0]">
                {["all", "orders", "stock", "wallet", "shipments", "reviews", "support"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                            activeTab === tab
                                ? "bg-[#0a4019] border-[#0a4019] text-white shadow-sm"
                                : "bg-white border-[#F5F3F0] text-[#0a4019] hover:bg-neutral-50"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredNotifs.length > 0 ? (
                    filteredNotifs.map((notif) => {
                        const Icon = notif.icon;
                        return (
                            <div
                                key={notif.id}
                                className={`p-6 rounded-2xl border transition-all duration-300 flex items-start justify-between gap-4 ${
                                    notif.unread
                                        ? "bg-white border-emerald-100 shadow-sm"
                                        : "bg-white/60 border-[#F5F3F0] opacity-80"
                                }`}
                            >
                                <div className="flex gap-4 items-start">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${colorsMap[notif.color]}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0a4019] flex items-center gap-2">
                                            {notif.title}
                                            {notif.unread && (
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            )}
                                        </h4>
                                        <p className="text-xs text-[#6B6B6B] leading-relaxed font-medium">{notif.desc}</p>
                                        <span className="text-[10px] text-neutral-400 font-semibold block">{notif.time}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {notif.unread && (
                                        <button
                                            onClick={() => handleMarkOneRead(notif.id)}
                                            className="p-2 text-neutral-400 hover:text-emerald-600 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                                        title="Clear Notification"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-24 text-center bg-[#FDFCFB] rounded-[2rem] border-2 border-dashed border-[#F5F3F0]">
                        <Bell className="mx-auto text-neutral-200 mb-4 animate-bounce" size={48} />
                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">Inbox Completely Empty</h3>
                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">All clear! No pending notifications found in this segment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
