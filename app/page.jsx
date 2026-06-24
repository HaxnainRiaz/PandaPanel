"use client";

import { useAdmin } from "@/context/AdminContext";
import StatsCard from "@/components/admin/StatsCard";
import AdminTable from "@/components/admin/AdminTable";
import RevenueProgressChart from "@/components/admin/RevenueProgressChart";

import {
    Package,
    ShoppingBag,
    AlertTriangle,
    Activity,
    MousePointer2,
    TrendingUp,
    Calendar,
    StickyNote
} from "lucide-react";

import Link from "next/link";
import { formatPrice, formatCompactPrice } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

function getShortOrderRef(order) {
    const id = order?.orderId || order?._id || "";

    if (!id || typeof id !== "string") {
        return "N/A";
    }

    if (id.startsWith("#")) {
        return id;
    }

    return id.length > 6 ? id.slice(-6).toUpperCase() : id.toUpperCase();
}

function getSafeDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleDateString();
}

function getProductImage(product) {
    if (!product) return "/placeholder.png";

    if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];

        if (typeof firstImage === "string") {
            return firstImage;
        }

        if (firstImage?.thumbnail) return firstImage.thumbnail;
        if (firstImage?.medium) return firstImage.medium;
        if (firstImage?.url) return firstImage.url;
        if (firstImage?.secure_url) return firstImage.secure_url;
    }

    if (typeof product.image === "string") {
        return product.image;
    }

    return "/placeholder.png";
}

export default function AdminDashboard() {
    const {
        stats = {},
        orders = [],
        products = [],
        loading,
        filterStats
    } = useAdmin();

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (typeof filterStats === "function") {
            filterStats(Number(selectedMonth), Number(selectedYear));
        }
    }, [selectedMonth, selectedYear, filterStats]);

    const safeOrders = useMemo(() => {
        return Array.isArray(orders) ? orders.filter(Boolean) : [];
    }, [orders]);

    const safeProducts = useMemo(() => {
        return Array.isArray(products) ? products.filter(Boolean) : [];
    }, [products]);

    const lowStockProducts = useMemo(() => {
        return safeProducts
            .filter((product) => Number(product?.stock || 0) < 10)
            .slice(0, 4);
    }, [safeProducts]);

    const filteredOrders = useMemo(() => {
        return safeOrders.filter((order) => {
            if (!order?.createdAt) return false;

            const date = new Date(order.createdAt);

            if (Number.isNaN(date.getTime())) {
                return false;
            }

            return (
                date.getMonth() + 1 === Number(selectedMonth) &&
                date.getFullYear() === Number(selectedYear)
            );
        });
    }, [safeOrders, selectedMonth, selectedYear]);

    const recentOrders = useMemo(() => {
        return filteredOrders.slice(0, 5);
    }, [filteredOrders]);

    const months = useMemo(
        () => [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ],
        []
    );

    const currentYear = new Date().getFullYear();

    const years = useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => currentYear - index);
    }, [currentYear]);

    const orderColumns = useMemo(
        () => [
            {
                id: "orderRef",
                accessorKey: "_id",
                header: "Order Ref",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#0a4019]">
                            {getShortOrderRef(row.original)}
                        </span>
                        {row.original?.transactionNotes && (
                            <div className="relative group/note cursor-help">
                                <StickyNote size={12} className="text-neutral-400 group-hover:text-[#0a4019] transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all z-50 text-[10px] text-neutral-800 font-bold text-center">
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                    {row.original.transactionNotes}
                                </div>
                            </div>
                        )}
                    </div>
                )
            },
            {
                id: "orderDate",
                accessorFn: (row) => row?.createdAt || "",
                header: "Client",
                cell: ({ row }) => {
                    const order = row.original || {};

                    return (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#0a4019]">
                                {order.customerName ||
                                    order.shippingAddress?.fullName ||
                                    order.user?.name ||
                                    "Guest Customer"}
                            </span>

                            <span className="text-[10px] text-neutral-400">
                                {getSafeDate(order.createdAt)}
                            </span>
                        </div>
                    );
                }
            },
            {
                id: "amount",
                accessorKey: "totalAmount",
                header: "Amount",
                cell: ({ row }) => (
                    <span className="font-bold text-[#0a4019]">
                        {formatPrice(Number(row.original?.totalAmount || 0))}
                    </span>
                )
            },
            {
                id: "progress",
                accessorKey: "orderStatus",
                header: "Progress",
                cell: ({ row }) => {
                    const orderStatus = row.original?.orderStatus || "pending";

                    return (
                        <span
                            className={`
                inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border
                ${orderStatus === "pending"
                                    ? "bg-neutral-100 text-neutral-600 border-neutral-300"
                                    : ""
                                }
                ${orderStatus === "processing"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : ""
                                }
                ${orderStatus === "confirmed"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : ""
                                }
                ${orderStatus === "shipped"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : ""
                                }
                ${orderStatus === "delivered"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : ""
                                }
                ${orderStatus === "cancelled"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : ""
                                }
              `}
                        >
                            {orderStatus}
                        </span>
                    );
                }
            }
        ],
        []
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#0a4019] font-heading font-medium animate-pulse">
                    Synchronizing Store Data...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] mb-2 flex items-center gap-3">
                        Estate Overview
                        <TrendingUp className="text-[#d3d3d3]" size={28} />
                    </h1>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                Live Database Sync
                            </span>
                        </div>

                        <p className="text-[#6B6B6B] text-xs font-medium">
                            StorVia Management Suite •{" "}
                            <span className="text-[#0a4019] font-bold">2.4.0-PRO</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#F5F3F0] shadow-sm">
                        <Calendar size={16} className="text-[#0a4019]" />

                        <select
                            value={selectedMonth}
                            onChange={(event) => setSelectedMonth(Number(event.target.value))}
                            className="bg-transparent text-sm font-bold text-[#0a4019] outline-none cursor-pointer"
                        >
                            {months.map((month, index) => (
                                <option key={month} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(event) => setSelectedYear(Number(event.target.value))}
                            className="bg-transparent text-sm font-bold text-neutral-400 outline-none cursor-pointer ml-1"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <a
                        href="http://localhost:3000"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-[#0a4019] text-[#d3d3d3] px-5 py-3 rounded-2xl hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/20 font-bold text-xs uppercase tracking-widest active:scale-95"
                    >
                        <MousePointer2 size={14} />
                        View Live Store
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Gross Revenue"
                    value={formatCompactPrice(Number(stats.totalRevenue || 0))}
                    trend={Number(stats.trends?.revenue || 0)}
                    icon={<Activity size={20} className="text-[#d3d3d3]" />}
                />

                <StatsCard
                    title="Total Orders"
                    value={Number(stats.totalOrders || 0)}
                    trend={Number(stats.trends?.orders || 0)}
                    icon={<ShoppingBag size={20} className="text-[#d3d3d3]" />}
                />

                <StatsCard
                    title="Avg. Order Value"
                    value={formatCompactPrice(Number(stats.avgOrderValue || 0))}
                    trend={Number(stats.trends?.aov || 0)}
                    icon={<TrendingUp size={20} className="text-[#d3d3d3]" />}
                />

                <StatsCard
                    title="Customer Base"
                    value={Number(stats.totalCustomers || 0)}
                    trend={Number(stats.trends?.customers || 0)}
                    icon={<Package size={20} className="text-[#d3d3d3]" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] p-3 md:p-6 lg:p-8 relative overflow-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-heading font-bold text-[#0a4019] italic">
                                    Transactions: {months[Number(selectedMonth) - 1]}{" "}
                                    {selectedYear}
                                </h2>

                                <p className="text-xs text-neutral-400 mt-1 font-medium">
                                    Real-time order processing stream
                                </p>
                            </div>

                            <Link
                                href="/orders"
                                className="text-xs font-bold text-[#B8A68A] hover:text-[#0a4019] transition-all uppercase tracking-widest bg-[#d3d3d3]/10 px-4 py-2 rounded-full"
                            >
                                View Full Log
                            </Link>
                        </div>

                        <AdminTable
                            columns={orderColumns}
                            data={recentOrders}
                            initialSorting={[{ id: "orderDate", desc: true }]}
                            emptyMessage={`No transactions found for ${months[Number(selectedMonth) - 1]
                                } ${selectedYear}.`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0a4019] p-8 rounded-[2rem] text-[#d3d3d3] relative overflow-hidden group">
                            <Package className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-[#d3d3d3]/10 group-hover:scale-110 transition-transform duration-700" />

                            <h3 className="text-xl font-heading font-bold mb-2">
                                Inventory Control
                            </h3>

                            <p className="text-[#d3d3d3]/60 text-xs mb-6 max-w-[200px]">
                                Stock levels are currently healthy across 92% of lines.
                            </p>

                            <Link
                                href="/inventory"
                                className="inline-block bg-[#d3d3d3] text-[#0a4019] px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
                            >
                                Open Vault
                            </Link>
                        </div>

                        <div className="bg-[#d3d3d3] p-8 rounded-[2rem] text-[#0a4019] relative overflow-hidden group">
                            <Activity className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-[#0a4019]/10 group-hover:scale-110 transition-transform duration-700" />

                            <h3 className="text-xl font-heading font-bold mb-2">
                                Active Campaigns
                            </h3>

                            <p className="text-[#0a4019]/60 text-xs mb-6 max-w-[200px]">
                                3 active discount codes currently in circulation.
                            </p>

                            <Link
                                href="/discounts"
                                className="inline-block bg-[#0a4019] text-[#d3d3d3] px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#051712] transition-colors"
                            >
                                Manage Offers
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] p-8 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-orange-500" />
                            </div>

                            <div>
                                <h2 className="text-lg font-heading font-bold text-[#0a4019]">
                                    Priority Stock
                                </h2>

                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                                    Restock Required
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map((product) => (
                                    <div
                                        key={product?._id || product?.id || product?.title}
                                        className="flex items-center justify-between p-4 border border-[#F5F3F0] rounded-2xl hover:bg-[#FDFCFB]/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden relative border border-[#F5F3F0]/50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={getProductImage(product)}
                                                    alt={product?.title || "Product"}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    loading="lazy"
                                                    onError={(event) => {
                                                        event.currentTarget.src = "/placeholder.png";
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold text-[#0a4019] line-clamp-1">
                                                    {product?.title || "Untitled Product"}
                                                </p>

                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                                        {Number(product?.stock || 0)} Units
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href="/inventory"
                                            className="p-2 text-neutral-300 hover:text-[#0a4019] transition-colors"
                                        >
                                            <Package size={16} />
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Package className="text-green-500" size={20} />
                                    </div>

                                    <p className="text-[#6B6B6B] text-xs font-medium">
                                        Full inventory healthy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#F5F3F0]/10 p-8 rounded-[2rem] border border-[#F5F3F0]/30 shadow-inner">
                        <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-6 text-center">
                            Efficiency Score
                        </h3>

                        <div className="flex justify-center mb-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-neutral-200"
                                    />

                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={364}
                                        strokeDashoffset={364 * (1 - 0.94)}
                                        className="text-[#d3d3d3]"
                                    />
                                </svg>

                                <span className="absolute text-2xl font-heading font-bold text-[#0a4019]">
                                    94%
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] text-neutral-400 text-center leading-relaxed font-medium">
                            Your order processing time is{" "}
                            <span className="text-[#0a4019] font-bold">12% faster</span>{" "}
                            than the industry benchmark for boutique skincare.
                        </p>
                    </div>
                </div>
            </div>

            <RevenueProgressChart month={Number(selectedMonth)} year={Number(selectedYear)} />
        </div>
    );
}