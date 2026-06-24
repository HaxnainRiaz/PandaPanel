"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useMemo, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Eye, ShoppingBag, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function FailedBookingsPage() {
    const { adminRequest } = useAdmin();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminRequest('/postex/failed-logs');
            if (res?.success) setLogs(res.data);
        } catch (error) {
            toast.error("Failed to load logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = useMemo(() => [
        {
            accessorKey: 'createdAt',
            header: 'Time',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-neutral-500 font-bold">
                    <Clock size={12} />
                    <span className="text-[10px] uppercase tracking-tighter">{format(new Date(row.original.createdAt), 'MMM d, HH:mm:ss')}</span>
                </div>
            )
        },
        {
            accessorKey: 'orderId.orderNumber',
            header: 'Order Reference',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[#0a4019] text-xs">{row.original.orderId?.orderNumber || 'Unknown'}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">ID: {row.original.orderId?._id?.substring(18)}</span>
                </div>
            )
        },
        {
            accessorKey: 'errorMessage',
            header: 'Failure Reason',
            cell: ({ row }) => (
                <div className="flex items-start gap-2 max-w-md">
                    <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="text-red-600 text-[11px] font-bold leading-tight break-words uppercase tracking-tight">
                        {row.original.errorMessage || 'Unknown API Error'}
                    </span>
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-[9px] font-bold uppercase tracking-[0.1em] border-neutral-200 hover:bg-[#0a4019] hover:text-white transition-all">
                        <RefreshCw size={12}/> Retry Booking
                    </Button>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Failed Bookings</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Diagnostic logs for shipment rejections</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="h-12 px-6 gap-2 border-neutral-200 text-xs font-bold uppercase tracking-widest">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Logs
                </Button>
            </div>

            {/* Error Tip */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4 items-center">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <p className="text-sm font-bold text-red-900">Most failures are due to invalid addresses or city names.</p>
                    <p className="text-xs text-red-700/70 mt-0.5">Please check the order details and ensure the city matches one from the PostEx operational list.</p>
                </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-[#F5F3F0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#F5F3F0] bg-[#FDFCFB]/50 flex items-center gap-2 px-6">
                    <ShoppingBag size={16} className="text-neutral-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Error Manifest</h2>
                </div>
                <AdminTable 
                    columns={columns} 
                    data={logs} 
                    loading={loading}
                    emptyMessage="No failed bookings found. Great job!"
                />
            </div>
        </div>
    );
}
