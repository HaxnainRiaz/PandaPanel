"use client";

import { useAdmin } from "@/context/AdminContext";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function PostExBookingPage() {
    const { id } = useParams();
    const { orders, adminRequest, refreshData } = useAdmin();
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const foundOrder = orders.find(o => o._id === id);
        if (foundOrder) setOrder(foundOrder);
    }, [id, orders]);

    useEffect(() => {
        const fetchAddresses = async () => {
            const res = await adminRequest('/postex/pickup-addresses');
            if (res?.success) {
                setPickupAddresses(res.data?.dist || []);
                if (res.data?.dist?.length > 0) {
                    setSelectedPickup(res.data.dist[0].pickupAddressCode);
                }
            }
        };
        fetchAddresses();
    }, [adminRequest]);

    if (!order) {
        return <div className="p-8">Loading order data...</div>;
    }

    const customerName = order.customerName || order.user?.name || order.shippingAddress?.fullName;
    const customerPhone = order.shippingAddress?.phone;
    const deliveryAddress = order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}` : '';
    const cityName = order.shippingAddress?.city;
    const invoicePayment = order.totalAmount;
    const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    const isReady = customerName && customerPhone && deliveryAddress && cityName && invoicePayment > 0 && itemsCount > 0;

    const handleBook = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminRequest(`/postex/orders/${id}/book`, 'POST', {
                pickupAddressCode: selectedPickup,
            });
            if (res?.success) {
                await refreshData();
                router.push('/orders');
            } else {
                setError(res?.message || 'Failed to book order');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn p-6">
            <button onClick={() => router.push('/orders')} className="flex items-center text-sm text-[#6B6B6B] hover:text-[#0a4019] mb-4 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Orders
            </button>
            <h1 className="text-3xl font-heading font-bold text-[#0a4019] italic">Book Order on PostEx</h1>
            
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-[#F5F3F0] shadow-sm space-y-6">
                    <h3 className="font-bold text-[#0a4019] text-lg border-b border-[#F5F3F0] pb-4">Order Details</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Order Ref</span> <span className="font-mono font-bold text-[#0a4019]">#{order._id.substring(18).toUpperCase()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Customer</span> <span className="font-medium text-[#0a4019]">{customerName || <span className="text-red-500 italic">Missing</span>}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Phone</span> <span className="font-medium text-[#0a4019]">{customerPhone || <span className="text-red-500 italic">Missing</span>}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Address</span> <span className="font-medium text-[#0a4019]">{deliveryAddress || <span className="text-red-500 italic">Missing</span>}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">City</span> <span className="font-medium text-[#0a4019]">{cityName || <span className="text-red-500 italic">Missing</span>}</span></div>
                        <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-[#FDFCFB] rounded-2xl border border-[#F5F3F0]">
                            <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">COD Amount</span> <span className="font-bold text-[#0a4019]">Rs. {invoicePayment}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Items</span> <span className="font-bold text-[#0a4019]">{itemsCount} units</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-[#F5F3F0] shadow-sm space-y-8 flex flex-col">
                    <h3 className="font-bold text-[#0a4019] text-lg border-b border-[#F5F3F0] pb-4">PostEx Configuration</h3>
                    
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-widest">Pickup Address</label>
                        <select 
                            value={selectedPickup}
                            onChange={(e) => setSelectedPickup(e.target.value)}
                            className="w-full p-4 bg-[#FDFCFB] border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20 transition-shadow"
                        >
                            <option value="">Select Pickup Address</option>
                            {pickupAddresses.map(addr => (
                                <option key={addr.pickupAddressCode} value={addr.pickupAddressCode}>
                                    {addr.pickupAddressName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-6 border-t border-[#F5F3F0] flex-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#0a4019] mb-4">Validation Checklist</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-3 font-medium"><CheckCircle size={18} className={customerName ? "text-green-500" : "text-neutral-300"}/> <span className={customerName ? "text-[#0a4019]" : "text-neutral-400"}>Customer Name</span></li>
                            <li className="flex items-center gap-3 font-medium"><CheckCircle size={18} className={customerPhone ? "text-green-500" : "text-neutral-300"}/> <span className={customerPhone ? "text-[#0a4019]" : "text-neutral-400"}>Phone Number</span></li>
                            <li className="flex items-center gap-3 font-medium"><CheckCircle size={18} className={deliveryAddress ? "text-green-500" : "text-neutral-300"}/> <span className={deliveryAddress ? "text-[#0a4019]" : "text-neutral-400"}>Delivery Address</span></li>
                            <li className="flex items-center gap-3 font-medium"><CheckCircle size={18} className={cityName ? "text-green-500" : "text-neutral-300"}/> <span className={cityName ? "text-[#0a4019]" : "text-neutral-400"}>City Name</span></li>
                            <li className="flex items-center gap-3 font-medium"><CheckCircle size={18} className={invoicePayment > 0 ? "text-green-500" : "text-neutral-300"}/> <span className={invoicePayment > 0 ? "text-[#0a4019]" : "text-neutral-400"}>Valid Amount</span></li>
                        </ul>
                    </div>

                    <Button 
                        onClick={handleBook} 
                        disabled={!isReady || loading || order.isPostExBooked}
                        className="w-full bg-[#0a4019] text-white hover:bg-[#051712] py-6 text-sm font-bold tracking-wide rounded-2xl shadow-lg shadow-[#0a4019]/20"
                    >
                        {loading ? 'Booking Order...' : order.isPostExBooked ? 'Already Booked' : 'Confirm Book on PostEx'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
