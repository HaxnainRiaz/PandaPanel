"use client";
import { useAdmin } from '@/context/AdminContext';
import { Truck, Clock, AlertCircle, CheckCircle, Package, MapPin, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';

export default function TrackingMonitorPage() {
    const { orders, loading } = useAdmin();

    const kanbanData = useMemo(() => {
        const columns = [
            { id: 'booked', label: 'Processing', icon: Package, color: 'bg-amber-500', items: [] },
            { id: 'transit', label: 'In Transit', icon: Truck, color: 'bg-blue-500', items: [] },
            { id: 'delivery', label: 'Out for Delivery', icon: Clock, color: 'bg-purple-500', items: [] },
            { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-500', items: [] },
            { id: 'issues', label: 'Action Required', icon: AlertCircle, color: 'bg-red-500', items: [] }
        ];

        if (!orders) return columns;

        orders.filter(o => o.isPostExBooked).forEach(order => {
            const status = order.deliveryStatus;
            if (status === 'Booked') columns[0].items.push(order);
            else if (['Picked Up', 'At PostEx Warehouse', 'In Transit'].includes(status)) columns[1].items.push(order);
            else if (status === 'Out for Delivery') columns[2].items.push(order);
            else if (status === 'Delivered') columns[3].items.push(order);
            else if (['Returned', 'Returning', 'Delivery Attempted', 'Under Review'].includes(status)) columns[4].items.push(order);
        });

        return columns;
    }, [orders]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading Logistics Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fadeIn overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Tracking Monitor</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Visual flow of all active shipments</p>
                </div>
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-200" />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#0a4019] text-white flex items-center justify-center text-[10px] font-bold">
                        +{kanbanData.reduce((acc, c) => acc + c.items.length, 0)}
                    </div>
                </div>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar h-[calc(100vh-250px)] min-h-[600px] -mx-2 px-2">
                {kanbanData.map((col) => (
                    <div key={col.id} className="flex-shrink-0 w-[320px] flex flex-col gap-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                <h3 className="font-bold text-[11px] uppercase tracking-widest text-neutral-600">{col.label}</h3>
                            </div>
                            <span className="bg-[#F5F3F0] px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-500 border border-[#d3d3d3]/30">
                                {col.items.length}
                            </span>
                        </div>
                        
                        {/* Column Body */}
                        <div className="flex-1 bg-neutral-50/50 rounded-3xl border border-[#F5F3F0] p-3 space-y-3 overflow-y-auto custom-scrollbar shadow-inner">
                            {col.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                                    <col.icon size={24} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Empty</p>
                                </div>
                            ) : (
                                col.items.map(order => (
                                    <div key={order._id} className="bg-white p-4 rounded-2xl border border-[#F5F3F0] shadow-sm hover:shadow-md hover:border-[#0a4019]/20 transition-all group cursor-pointer active:scale-95">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                                                    {format(new Date(order.createdAt), 'MMM d')}
                                                </span>
                                                <span className="font-mono font-bold text-[#0a4019] text-xs uppercase">{order.orderNumber}</span>
                                            </div>
                                            <button className="text-neutral-300 hover:text-neutral-500"><MoreHorizontal size={14}/></button>
                                        </div>

                                        <p className="text-sm font-bold text-neutral-800 mb-4 line-clamp-1">
                                            {order.customerName || order.shippingAddress?.fullName}
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-neutral-300"/> {order.shippingAddress?.city}</div>
                                                <div className="text-[#0a4019]">Rs. {order.totalAmount}</div>
                                            </div>

                                            {/* Progress Indicator (Dummy) */}
                                            <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${col.color} transition-all duration-1000`} 
                                                    style={{ width: col.id === 'delivered' ? '100%' : col.id === 'booked' ? '20%' : '60%' }}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#F5F3F0]">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                                                <col.icon size={12} /> {order.deliveryStatus}
                                            </div>
                                            <ChevronRight size={14} className="text-neutral-300 group-hover:text-[#0a4019] transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
