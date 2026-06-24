"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useMemo } from 'react';
import { RotateCcw, Truck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ReturnsQueuePage() {
    const { orders, loading } = useAdmin();

    const returnOrders = useMemo(() => {
        return orders?.filter(o => 
            ['Returned', 'Returning', 'Delivery Attempted', 'Refused'].includes(o.deliveryStatus) ||
            o.orderStatus === 'returned'
        ) || [];
    }, [orders]);

    const columns = useMemo(() => [
        {
            accessorKey: 'orderNumber',
            header: 'Order',
            cell: ({ row }) => <span className="font-bold text-[#0a4019]">{row.original.orderNumber}</span>
        },
        {
            accessorKey: 'deliveryStatus',
            header: 'Logistics Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                    row.original.deliveryStatus === 'Returned' 
                    ? "bg-red-50 text-red-700 border-red-100" 
                    : "bg-orange-50 text-orange-700 border-orange-100"
                }`}>
                    {row.original.deliveryStatus}
                </span>
            )
        },
        {
            accessorKey: 'customerName',
            header: 'Customer',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.customerName || row.original.shippingAddress?.fullName}</span>
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <MessageSquare size={12}/> Contact
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest border-emerald-200 text-emerald-700">
                        <RotateCcw size={12}/> Restock
                    </Button>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Returns Queue</h1>
                <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Manage returned shipments and delivery failures</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden">
                <AdminTable 
                    columns={columns} 
                    data={returnOrders} 
                    loading={loading}
                />
            </div>
        </div>
    );
}

