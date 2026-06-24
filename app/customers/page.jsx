"use client";

import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { SearchBar, Button } from "@/components/ui";
import AdminTable from "@/components/admin/AdminTable";
import { Mail, Phone, MapPin, Edit2, Save, X, User, Ban, ShieldCheck, History, ShoppingBag } from "lucide-react";

export default function CustomersPage() {
    const { customers, loading, updateCustomer, orders } = useAdmin();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingOrders, setViewingOrders] = useState(null);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const customerOrders = viewingOrders
        ? orders.filter(o =>
            (typeof o.user === 'string' ? o.user === viewingOrders._id : o.user?._id === viewingOrders._id)
        )
        : [];

    const toggleBanStatus = async (customer) => {
        const isBanned = customer.status === 'banned';
        await updateCustomer(customer._id, { status: isBanned ? 'active' : 'banned' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Scanning Customer Nodes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Client Directory</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Manage luxury estate access and history</p>
                </div>

                <SearchBar
                    placeholder="Locate client by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-96"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] border border-[#F5F3F0] p-4 md:p-8">
                <AdminTable
                    columns={[
                        {
                            id: 'name',
                            header: 'Customer Identity',
                            cell: ({ row }) => {
                                const customer = row.original;
                                return (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019] font-bold shadow-inner">
                                            {customer.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#0a4019] text-sm">{customer.name}</p>
                                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">#{customer._id?.substring(18).toUpperCase()}</p>
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            accessorKey: 'email',
                            header: 'Contact Protocol',
                            cell: ({ row }) => (
                                <div className="flex items-center gap-2 text-xs font-medium text-[#6B6B6B]">
                                    <Mail size={14} className="text-[#d3d3d3]" />
                                    <span>{row.original.email}</span>
                                </div>
                            )
                        },
                        {
                            accessorKey: 'createdAt',
                            header: 'Join Date',
                            cell: ({ row }) => (
                                <span className="text-xs font-bold text-[#6B6B6B] bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                                    {new Date(row.original.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' })}
                                </span>
                            )
                        },
                        {
                            accessorKey: 'status',
                            header: 'Estate Status',
                            cell: ({ row }) => {
                                const customer = row.original;
                                return (
                                    <span className={`
                                        inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                                        ${customer.status === 'banned'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-green-50 text-green-700 border-green-200'}
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'banned' ? 'bg-red-500' : 'bg-green-500'}`} />
                                        {customer.status || 'Active'}
                                    </span>
                                );
                            }
                        },
                        {
                            id: 'actions',
                            header: 'Operations',
                            cell: ({ row }) => {
                                const customer = row.original;
                                return (
                                    <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setViewingOrders(customer)}
                                            className="p-3 text-neutral-300 hover:text-[#0a4019] hover:bg-[#FDFCFB] rounded-xl transition-all"
                                            title="View Order History"
                                        >
                                            <History size={18} />
                                        </button>
                                        <button
                                            onClick={() => toggleBanStatus(customer)}
                                            className={`p-3 rounded-xl transition-all ${customer.status === 'banned' ? 'text-green-600 hover:bg-green-50' : 'text-neutral-300 hover:text-red-600 hover:bg-red-50'}`}
                                            title={customer.status === 'banned' ? 'Unban User' : 'Ban User'}
                                        >
                                            {customer.status === 'banned' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                                        </button>
                                    </div>
                                );
                            }
                        }
                    ]}
                    data={filteredCustomers}
                />
            </div>

            {/* History Modal Placeholder */}
            {viewingOrders && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/20 backdrop-blur-md">
                    <div className="bg-white p-10 rounded-[3rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-2xl w-full mx-4 animate-scaleIn border border-[#FDFCFB] relative">
                        <button
                            onClick={() => setViewingOrders(null)}
                            className="absolute top-8 right-8 p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-heading font-bold text-[#0a4019]">Transaction History</h3>
                            <p className="text-sm text-[#6B6B6B] mt-1">Full purchase manifest for <span className="text-[#d3d3d3] font-bold">{viewingOrders.name}</span></p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {customerOrders.length > 0 ? (
                                customerOrders.map((order) => (
                                    <div key={order._id} className="p-6 bg-[#FDFCFB]/50 border border-[#F5F3F0] rounded-2xl flex items-center justify-between group hover:border-[#d3d3d3] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#0a4019]/5 flex items-center justify-center text-[#0a4019]">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0a4019] text-sm font-heading italic">#{order._id.substring(18).toUpperCase()}</p>
                                                <p className="text-[10px] text-neutral-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#0a4019]">{formatPrice(order.totalAmount)}</p>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${order.orderStatus === 'delivered' ? 'text-green-600' :
                                                order.orderStatus === 'cancelled' ? 'text-red-600' :
                                                    'text-[#d3d3d3]'
                                                }`}>
                                                {order.orderStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-neutral-300 italic text-sm border-2 border-dashed border-[#F5F3F0] rounded-2xl">
                                    No transactions found for this node.<br />
                                    <span className="text-[10px] uppercase tracking-widest mt-2 block">Connection Secure</span>
                                </p>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button
                                onClick={() => setViewingOrders(null)}
                            >
                                Close Archive
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
