"use client";

import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import {
    Search, Filter, Download, Plus, CheckCircle, Package,
    Truck, Tag, Archive, XCircle, Printer, MoreHorizontal, ChevronDown, FileText, AlertCircle, StickyNote
} from "lucide-react";
import AdminTable from "@/components/admin/AdminTable";
import { formatDistanceToNow, format } from "date-fns";
import useOrderStore from "@/store/useOrderStore";
import toast from "react-hot-toast";
import ShipWithPostExModal from "@/components/postex/ShipWithPostExModal";

const StatusBadge = ({ text, type }) => {
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    const status = (text || "").toLowerCase();

    if (type === 'payment') {
        if (status === 'paid') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (status === 'pending') colorClass = "bg-orange-50 text-orange-700 border-orange-200";
        else if (status === 'failed') colorClass = "bg-red-50 text-red-700 border-red-200";
    } else if (type === 'order' || type === 'fulfillment') {
        if (status === 'delivered') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (['shipped', 'confirmed', 'fulfilled'].includes(status)) colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        else if (['processing', 'in progress', 'pending', 'unfulfilled'].includes(status)) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        else if (status === 'on hold') colorClass = "bg-orange-50 text-orange-700 border-orange-200";
        else if (['cancelled', 'returned'].includes(status)) colorClass = "bg-red-50 text-red-700 border-red-200";
    } else if (type === 'delivery') {
        if (['delivered', 'shipped', 'picked up'].includes(status)) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (['booked', 'in transit', 'postex warehouse'].includes(status)) colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        else if (['cancelled', 'returned', 'returning'].includes(status)) colorClass = "bg-red-50 text-red-700 border-red-200";
    }

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${colorClass}`}>
            {text || 'Unknown'}
        </span>
    );
};

import { Suspense } from "react";

function OrdersContent() {
    const { orders, loading, adminRequest, refreshData } = useAdmin();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [rowSelection, setRowSelection] = useState({});
    const [activeTab, setActiveTab] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderForShip, setSelectedOrderForShip] = useState(null);

    // Support /orders?id=... as full page
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            router.replace(`/orders/${id}`);
        }
    }, [searchParams, router]);

    const tabs = ["All", "Unfulfilled", "Unpaid", "Ready to Book", "Booked", "Open", "Archived"];

    // Stats calculation
    const stats = useMemo(() => {
        if (!orders) return { total: 0, items: 0, returns: 0, fulfilled: 0, delivered: 0, pendingPayment: 0 };
        return orders.reduce((acc, order) => {
            acc.total++;
            acc.items += order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            if (order.orderStatus === 'returned') acc.returns++;
            if (['shipped', 'delivered'].includes(order.orderStatus)) acc.fulfilled++;
            if (order.orderStatus === 'delivered' || order.deliveryStatus?.toLowerCase() === 'delivered') acc.delivered++;
            if (order.paymentStatus === 'pending') acc.pendingPayment++;
            return acc;
        }, { total: 0, items: 0, returns: 0, fulfilled: 0, delivered: 0, pendingPayment: 0 });
    }, [orders]);

    // Filtering logic
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(order => {
            // Tab filtering
            if (activeTab === "Unfulfilled" && ['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) return false;
            if (activeTab === "Unpaid" && order.paymentStatus !== 'pending') return false;
            if (activeTab === "Ready to Book" && (order.isPostExBooked || ['cancelled', 'delivered'].includes(order.orderStatus) || !['confirmed', 'processing'].includes(order.orderStatus))) return false;
            if (activeTab === "Booked" && !order.isPostExBooked) return false;
            if (activeTab === "Archived") return false; // Implement archive logic if exists
            if (activeTab === "Open" && ['delivered', 'cancelled', 'returned'].includes(order.orderStatus)) return false;

            // Search filtering
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const idMatch = order._id.toLowerCase().includes(term);
                const nameMatch = (order.customerName || order.shippingAddress?.fullName || "").toLowerCase().includes(term);
                const phoneMatch = (order.shippingAddress?.phone || "").toLowerCase().includes(term);
                const trackingMatch = (order.postex?.trackingNumber || "").toLowerCase().includes(term);
                if (!idMatch && !nameMatch && !phoneMatch && !trackingMatch) return false;
            }

            return true;
        });
    }, [orders, activeTab, searchTerm]);

    const columns = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-[#0a4019] focus:ring-[#0a4019]"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-[#0a4019] focus:ring-[#0a4019]"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
            enableSorting: false,
        },
        {
            accessorKey: "_id",
            header: "Order",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 relative">
                    <span className="font-bold text-[#0a4019] hover:underline cursor-pointer">
                        {row.original.orderNumber || `#ID-${row.original._id.substring(18).toUpperCase()}`}
                    </span>
                    {row.original.transactionNotes && (
                        <div className="relative group/note cursor-pointer">
                            <StickyNote size={15} className="text-neutral-400  group-hover:text-[#0a4019] transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all z-50 text-[11px] text-neutral-800 font-bold text-center">
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                {row.original.transactionNotes}
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            id: "orderDate",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-neutral-900 font-medium">{format(new Date(row.original.createdAt), 'MMM d, h:mm a')}</span>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest">{formatDistanceToNow(new Date(row.original.createdAt))} ago</span>
                </div>
            )
        },
        {
            id: "customer",
            header: "Customer",
            accessorFn: row => row.customerName || row.shippingAddress?.fullName || row.user?.name || "Guest",
            cell: ({ row }) => {
                const name = row.original.customerName || row.original.shippingAddress?.fullName || row.original.user?.name || "Guest";
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[10px] font-bold text-[#0a4019] border border-[#d3d3d3]">
                            {initials}
                        </div>
                        <span className="font-bold text-neutral-700">{name}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "channel",
            header: "Channel",
            cell: ({ row }) => <span className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600 font-medium">{row.original.channel || 'Online Store'}</span>
        },
        {
            accessorKey: "totalAmount",
            header: "Total",
            cell: ({ row }) => <span className="font-bold">Rs. {row.original.totalAmount}</span>
        },
        {
            accessorKey: "paymentStatus",
            header: "Payment Status",
            cell: ({ row }) => <StatusBadge text={row.original.paymentStatus} type="payment" />
        },
        {
            accessorKey: "orderStatus",
            header: "Order Status",
            cell: ({ row }) => <StatusBadge text={row.original.orderStatus} type="order" />
        },
        {
            id: "items",
            header: "Items",
            accessorFn: row => row.items?.reduce((acc, item) => acc + item.quantity, 0) || 0,
            cell: ({ row }) => <span className="font-medium text-neutral-600">{row.original.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} items</span>
        },
        {
            id: "deliveryStatus",
            header: "Delivery Status",
            accessorFn: row => row.deliveryStatus || (row.isPostExBooked ? 'Booked' : 'Not Booked'),
            cell: ({ row }) => <StatusBadge text={row.original.deliveryStatus || (row.original.isPostExBooked ? 'Booked' : 'Not Booked')} type="delivery" />
        },
        {
            id: "tags",
            header: "Tags",
            cell: ({ row }) => row.original.paymentMethod === 'COD' ? <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-[10px] font-bold">COD</span> : null
        },
        {
            id: "book",
            header: "Shipping",
            cell: ({ row }) => {
                const order = row.original;
                if (order.isPostExBooked) {
                    return (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                            <CheckCircle size={14} /> Booked
                        </div>
                    );
                }
                return (
                    <Button 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderForShip(order); }}
                        className="h-7 px-3 bg-[#0a4019] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#051712]"
                    >
                        <Truck size={12} className="mr-1" /> Book
                    </Button>
                );
            }
        }
    ], []);

    const selectedOrderIds = Object.keys(rowSelection).map(idx => filteredOrders[parseInt(idx)]?._id).filter(Boolean);

    const handleBulkBook = () => {
        if (selectedOrderIds.length === 0) return;
        router.push(`/postex/bulk-prep?ids=${selectedOrderIds.join(',')}`);
    };

    const handleBulkCancel = async () => {
        if (!confirm(`Are you sure you want to cancel ${selectedOrderIds.length} orders?`)) return;
        try {
            const res = await adminRequest('/orders/bulk-cancel', 'POST', { orderIds: selectedOrderIds });
            if (res?.success) {
                toast.success('Orders cancelled');
                setRowSelection({});
                refreshData();
            }
        } catch (error) {
            toast.error('Bulk cancellation failed');
        }
    };

    const handleBulkPaid = async () => {
        try {
            const res = await adminRequest('/orders/bulk-update-payment', 'POST', {
                orderIds: selectedOrderIds,
                paymentStatus: 'paid'
            });
            if (res?.success) {
                toast.success('Payment status updated');
                setRowSelection({});
                refreshData();
            }
        } catch (error) {
            toast.error('Bulk update failed');
        }
    };

    const handleBulkPrint = async () => {
        try {
            const res = await adminRequest('/postex/bulk-invoice', 'POST', { orderIds: selectedOrderIds });
            if (res?.success && res.data?.dist) {
                window.open(res.data.dist, '_blank');
            } else {
                toast.error(res?.message || 'Print failed. Ensure orders are booked.');
            }
        } catch (error) {
            toast.error('Print request failed');
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] tracking-widest uppercase">Orders</h1>
                    <span className="px-3 py-1 bg-[#F5F3F0] rounded-full text-xs font-bold text-[#0a4019] border border-[#d3d3d3]">{stats.total}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="text-xs tracking-widest font-bold">Export</Button>
                    <Button variant="outline" className="text-xs tracking-widest font-bold hidden md:flex items-center gap-2">More Actions <ChevronDown size={14} /></Button>
                    <Button className="bg-[#0a4019] hover:bg-[#051712] text-white text-xs tracking-widest font-bold">Create Order</Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                    { label: "Orders", val: stats.total },
                    { label: "Items Ordered", val: stats.items },
                    { label: "Returns", val: stats.returns },
                    { label: "Fulfilled", val: stats.fulfilled },
                    { label: "Delivered", val: stats.delivered },
                    { label: "Pending Payment", val: stats.pendingPayment, highlight: true },
                ].map(stat => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl border border-[#F5F3F0] shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">{stat.label}</span>
                        <span className={`text-xl font-bold ${stat.highlight && stat.val > 0 ? 'text-orange-500' : 'text-[#0a4019]'}`}>{stat.val}</span>
                    </div>
                ))}
            </div>

            {/* Filters & Table Card */}
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden flex flex-col relative">
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-[#F5F3F0] px-2 custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-[#0a4019] text-[#0a4019]' : 'border-transparent text-neutral-400 hover:text-[#0a4019]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                    <button className="px-4 py-4 text-neutral-400 hover:text-[#0a4019] border-b-2 border-transparent"><Plus size={16} /></button>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex items-center justify-between gap-4 bg-[#FDFCFB] border-b border-[#F5F3F0]">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#F5F3F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20"
                        />
                    </div>
                    <Button variant="outline" className="text-xs tracking-widest font-bold flex items-center gap-2">
                        <Filter size={14} /> Filters
                    </Button>
                </div>

                {/* Table */}
                {loading && !orders.length ? (
                    <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <AdminTable
                        columns={columns}
                        data={filteredOrders}
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                        onRowClick={(order) => {
                            useOrderStore.getState().openSlider(order._id, filteredOrders);
                        }}
                        initialSorting={[{ id: "orderDate", desc: true }]}
                    />
                )}
            </div>

            {/* Bulk Action Toolbar */}
            {selectedOrderIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
                    <div className="bg-[#051712] text-white rounded-2xl shadow-2xl border border-white/10 px-6 py-4 flex items-center gap-6">
                        <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{selectedOrderIds.length} selected</span>
                        <div className="h-6 w-px bg-white/20"></div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleBulkPaid} className="p-2 hover:bg-white/10 rounded-lg transition-colors tooltip-trigger group relative">
                                <CheckCircle size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#051712] text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Mark as Paid</span>
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors tooltip-trigger group relative">
                                <Package size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#051712] text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Fulfill</span>
                            </button>
                            <button onClick={handleBulkBook} className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors tooltip-trigger group relative">
                                <Truck size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-400 text-[#051712] text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Book PostEx</span>
                            </button>
                            <button onClick={handleBulkPrint} className="p-2 hover:bg-white/10 rounded-lg transition-colors tooltip-trigger group relative">
                                <Printer size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#051712] text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Print</span>
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors tooltip-trigger group relative">
                                <Tag size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#051712] text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Tags</span>
                            </button>
                            <div className="h-6 w-px bg-white/20 mx-2"></div>
                            <button onClick={handleBulkCancel} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip-trigger group relative">
                                <XCircle size={18} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Cancel Orders</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Ship Modal */}
            {selectedOrderForShip && (
                <ShipWithPostExModal 
                    order={selectedOrderForShip} 
                    onClose={() => setSelectedOrderForShip(null)} 
                    onSuccess={() => refreshData()} 
                />
            )}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin" /></div>}>
            <OrdersContent />
        </Suspense>
    );
}
