"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useMemo, useState } from 'react';
import { 
    Truck, Printer, RefreshCw, Search, Filter, 
    ExternalLink, MapPin, Package, Clock, CheckCircle2,
    AlertCircle, ChevronDown, MoreVertical, Ban
} from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PostExBookingsPage() {
    const { orders, loading, adminRequest, refreshData } = useAdmin();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const bookedOrders = useMemo(() => {
        let filtered = orders?.filter(o => o.isPostExBooked) || [];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o => 
                o.orderNumber?.toLowerCase().includes(term) ||
                o.postex?.trackingNumber?.toLowerCase().includes(term) ||
                (o.customerName || o.shippingAddress?.fullName || "").toLowerCase().includes(term)
            );
        }

        if (statusFilter !== "All") {
            filtered = filtered.filter(o => o.deliveryStatus === statusFilter);
        }

        return filtered;
    }, [orders, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const s = { booked: 0, transit: 0, delivered: 0, returned: 0 };
        bookedOrders.forEach(o => {
            const ds = o.deliveryStatus;
            if (ds === 'Booked') s.booked++;
            else if (['In Transit', 'Out for Delivery', 'Picked Up'].includes(ds)) s.transit++;
            else if (ds === 'Delivered') s.delivered++;
            else if (['Returned', 'Returning'].includes(ds)) s.returned++;
        });
        return s;
    }, [bookedOrders]);

    const handleSyncTracking = async (trackingNumber) => {
        const res = await adminRequest(`/postex/track/${trackingNumber}`);
        if (res?.success) {
            toast.success("Tracking updated");
            refreshData();
        }
    };

    const handleSyncAll = async () => {
        try {
            const res = await adminRequest('/postex/sync-tracking', 'POST');
            if (res?.success) {
                toast.success(`Synced ${res.updatesCount} updates`);
                refreshData();
            }
        } catch (error) {
            toast.error('Sync failed');
        }
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'orderNumber',
            header: 'Order Details',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[#0a4019] text-sm uppercase tracking-wider">{row.original.orderNumber}</span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                        {format(new Date(row.original.createdAt), 'MMM d, p')}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'customerName',
            header: 'Customer & Destination',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-800">{row.original.customerName || row.original.shippingAddress?.fullName}</span>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                        <MapPin size={10} /> {row.original.shippingAddress?.city}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'postex.trackingNumber',
            header: 'PostEx Tracking',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                            {row.original.postex?.trackingNumber}
                        </span>
                        <a 
                            href={`https://track.postex.pk/?trackingNumber=${row.original.postex?.trackingNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0a4019] hover:text-[#051712]"
                        >
                            <ExternalLink size={12} />
                        </a>
                    </div>
                    {row.original.postex?.lastTrackingSyncAt && (
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">
                            Last Sync: {format(new Date(row.original.postex.lastTrackingSyncAt), 'HH:mm')}
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'deliveryStatus',
            header: 'Live Status',
            cell: ({ row }) => {
                const status = row.original.deliveryStatus || 'Booked';
                let cls = "bg-neutral-50 text-neutral-600 border-neutral-100";
                if (status === 'Delivered') cls = "bg-emerald-50 text-emerald-700 border-emerald-100";
                if (['In Transit', 'Out for Delivery'].includes(status)) cls = "bg-blue-50 text-blue-700 border-blue-100";
                if (['Returned', 'Returning', 'Cancelled'].includes(status)) cls = "bg-red-50 text-red-700 border-red-100";
                if (status === 'Booked') cls = "bg-amber-50 text-amber-700 border-amber-100";

                return (
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-widest ${cls}`}>
                            {status}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleSyncTracking(row.original.postex?.trackingNumber); }}
                        className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-[#0a4019] transition-colors"
                        title="Force Sync"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-[#0a4019] transition-colors"
                        title="Print Airway Bill"
                    >
                        <Printer size={14} />
                    </button>
                    <button className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-colors">
                        <MoreVertical size={14} />
                    </button>
                </div>
            )
        }
    ], [refreshData]);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Shipments Dashboard</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Live operational tracking for PostEx orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-neutral-200 text-xs font-bold uppercase tracking-widest">
                        <Printer size={14} /> Batch Print
                    </Button>
                    <Button onClick={handleSyncAll} className="bg-[#0a4019] text-white gap-2 h-11 px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#0a4019]/20">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync All Tracking
                    </Button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Booked", val: stats.booked, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "In Transit", val: stats.transit, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Delivered", val: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Issues/Returns", val: stats.returned, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white p-5 rounded-2xl border border-[#F5F3F0] shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] mb-0.5">{s.label}</p>
                            <p className="text-xl font-bold text-[#0a4019]">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Main Table Card */}
            <div className="bg-white rounded-3xl border border-[#F5F3F0] shadow-sm overflow-hidden flex flex-col">
                {/* Filters Bar */}
                <div className="p-4 border-b border-[#F5F3F0] bg-[#FDFCFB]/50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by Order #, Tracking, or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F5F3F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4019]/10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-[#F5F3F0] rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-600 focus:outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Booked">Booked</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Returned">Returned</option>
                        </select>
                        <Button variant="outline" className="p-2.5 rounded-xl border-neutral-200">
                            <Filter size={16} />
                        </Button>
                    </div>
                </div>

                <AdminTable 
                    columns={columns} 
                    data={bookedOrders} 
                    loading={loading}
                    initialSorting={[{ id: 'orderNumber', desc: true }]}
                    emptyMessage="No shipments found. Book some orders to see them here!"
                />
            </div>
        </div>
    );
}
