"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CheckCircle, Package, AlertCircle, ShoppingBag, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function BulkBookPage() {
    const { orders, loading, adminRequest, refreshData } = useAdmin();
    const [rowSelection, setRowSelection] = useState({});
    const [booking, setBooking] = useState(false);

    const router = useRouter();

    const unbookedOrders = useMemo(() => {
        return orders?.filter(o => !o.isPostExBooked && !['cancelled', 'delivered', 'returned'].includes(o.orderStatus)) || [];
    }, [orders]);

    const selectedOrderIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

    const handleBulkBook = () => {
        if (selectedOrderIds.length === 0) return;
        router.push(`/postex/bulk-prep?ids=${selectedOrderIds.join(',')}`);
    };

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
        },
        {
            accessorKey: 'orderNumber',
            header: 'Order',
            cell: ({ row }) => <span className="font-bold text-[#0a4019]">{row.original.orderNumber}</span>
        },
        {
            accessorKey: 'customerName',
            header: 'Customer Info',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-800">{row.original.customerName || row.original.shippingAddress?.fullName}</span>
                    <span className="text-[10px] text-neutral-400 font-medium">{row.original.shippingAddress?.phone}</span>
                </div>
            )
        },
        {
            accessorKey: 'totalAmount',
            header: 'COD Amount',
            cell: ({ row }) => <span className="font-bold text-neutral-700">Rs. {row.original.totalAmount}</span>
        },
        {
            accessorKey: 'shippingAddress.city',
            header: 'Destination',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <MapPin size={12} className="text-neutral-300" />
                    {row.original.shippingAddress?.city}
                </div>
            )
        },
        {
            accessorKey: 'orderStatus',
            header: 'Order Status',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-widest border border-neutral-200">
                    {row.original.orderStatus}
                </span>
            )
        }
    ], []);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Bulk Logistics</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Automated mass-booking for pending shipments</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-[#F5F3F0] shadow-sm">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Ready to Book</span>
                        <span className="text-lg font-bold text-[#0a4019]">{unbookedOrders.length} Orders</span>
                    </div>
                    <Button 
                        onClick={handleBulkBook} 
                        disabled={selectedOrderIds.length === 0 || booking}
                        className="bg-[#0a4019] text-white gap-3 h-14 px-8 text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-[#0a4019]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {booking ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Truck size={18} />
                        )}
                        {booking ? 'Processing...' : `Book ${selectedOrderIds.length || ''} Selected Orders`}
                    </Button>
                </div>
            </div>

            {/* Warning if info is missing (logic check) */}
            {unbookedOrders.some(o => !o.shippingAddress?.city || !o.shippingAddress?.phone) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                    <AlertCircle className="text-amber-600 shrink-0" size={18} />
                    <div>
                        <p className="text-sm font-bold text-amber-900">Some orders have incomplete shipping info</p>
                        <p className="text-xs text-amber-700/80 mt-0.5">Bulk booking will skip orders missing phone numbers or cities. Please review before booking.</p>
                    </div>
                </div>
            )}
            
            {/* Table Card */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#F5F3F0] bg-[#FDFCFB]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2">
                        <ShoppingBag size={16} className="text-neutral-400" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Unbooked Shipment Queue</h2>
                    </div>
                    {selectedOrderIds.length > 0 && (
                        <div className="animate-fadeIn text-[10px] font-bold uppercase tracking-widest text-[#0a4019] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            {selectedOrderIds.length} Orders Selected
                        </div>
                    )}
                </div>
                
                <AdminTable 
                    columns={columns} 
                    data={unbookedOrders} 
                    loading={loading}
                    rowSelection={rowSelection}
                    setRowSelection={setRowSelection}
                    getRowId={(row) => String(row._id)}
                    emptyMessage="All caught up! No unbooked orders found."
                />
            </div>
        </div>
    );
}
