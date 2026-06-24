"use client";
import { useAdmin } from '@/context/AdminContext';
import { BarChart2, TrendingUp, ShoppingCart, Users, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

export default function AnalyticsPage() {
    const { orders, stats, customers } = useAdmin();

    const metrics = useMemo(() => {
        const totalSales = orders?.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.totalAmount, 0) || 0;
        const totalOrders = orders?.length || 0;
        const totalCustomers = customers?.length || 0;
        const returnRate = totalOrders > 0 ? ((orders?.filter(o => o.orderStatus === 'returned').length / totalOrders) * 100).toFixed(1) : 0;

        return [
            { label: 'Total Revenue', value: `Rs. ${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Return Rate', value: `${returnRate}%`, icon: RotateCcw, color: 'text-red-600', bg: 'bg-red-50' },
        ];
    }, [orders, customers]);

    const statusBreakdown = useMemo(() => {
        const counts = {};
        orders?.forEach(o => {
            counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    return (
        <div className="space-y-8 pb-20 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Business Analytics</h1>
                <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Comprehensive overview of your store performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm">
                        <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-xl flex items-center justify-center mb-4`}>
                            <m.icon size={24} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{m.label}</p>
                        <h3 className="text-2xl font-bold text-[#0a4019]">{m.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-[#0a4019] mb-6 flex items-center gap-2">
                        <BarChart2 size={16}/> Order Status Breakdown
                    </h3>
                    <div className="space-y-4">
                        {statusBreakdown.map(([status, count]) => (
                            <div key={status} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-600">
                                    <span>{status}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="h-2 bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                                    <div 
                                        className="h-full bg-[#0a4019]" 
                                        style={{ width: `${(count / orders.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a4019] mb-2">Growth Insights</h3>
                    <p className="text-sm text-neutral-500 max-w-xs">Your store has seen a 12% increase in orders compared to last month. Keep optimizing your PostEx workflows!</p>
                </div>
            </div>
        </div>
    );
}

