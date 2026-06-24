"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { 
    Truck, ChevronLeft, MapPin, Phone, 
    AlertCircle, CheckCircle2, Loader2, Save, 
    Trash2, Edit3, Settings2, Package, Info,
    User, ArrowRight, Sparkles, Search, Check,
    Building2, Banknote, ClipboardList, RefreshCcw,
    Store
} from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

function BulkPrepContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { adminRequest, refreshData } = useAdmin();
    
    const [orders, setOrders] = useState([]);
    const [cities, setCities] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [forceRebook, setForceRebook] = useState(false);
    const [prepError, setPrepError] = useState(null);
    const [failedMap, setFailedMap] = useState({});

    // Phase 4: Fetch fresh data for selected orders
    useEffect(() => {
        const init = async () => {
            const idsString = searchParams.get('ids');
            if (!idsString) {
                setPrepError('No orders selected. Go back and select orders to book.');
                setLoading(false);
                return;
            }
            const orderIds = idsString.split(',').filter(Boolean);

            try {
                // Fetch reference data and order data in parallel
                const [citiesRes, addrRes, prepRes, statusRes] = await Promise.all([
                    adminRequest('/postex/cities'),
                    adminRequest('/postex/pickup-addresses'),
                    adminRequest('/postex/bulk-prepare', 'POST', { orderIds }),
                    adminRequest('/postex/status')
                ]);

                if (citiesRes?.success) setCities(citiesRes.data || []);
                if (addrRes?.success) setAddresses(addrRes.data || []);
                if (statusRes?.success) setStatus(statusRes.data);
                
                if (prepRes?.success && Array.isArray(prepRes.data) && prepRes.data.length > 0) {
                    const citiesList = citiesRes?.data || [];
                    const defaultPickup = statusRes?.data?.defaultPickupAddressCode || "";
                    
                    const data = prepRes.data.map(o => {
                        const matchedCity = citiesList.find(c => 
                            c.name.toLowerCase() === (o.originalCity || '').toLowerCase()
                        )?.name || '';

                        return {
                            ...o,
                            cityName: matchedCity,
                            pickupAddressCode: defaultPickup,
                            orderType: 'Normal'
                        };
                    });
                    setOrders(data);
                } else {
                    setPrepError(prepRes?.message || 'Could not load orders for bulk booking. Ensure the backend is running and orders exist in the database.');
                    toast.error(prepRes?.message || 'Failed to load order manifest');
                }
            } catch (err) {
                console.error("Prep failed:", err);
                setPrepError('Failed to connect to the server. Restart the backend and try again.');
                toast.error("Failed to load order manifest");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [adminRequest, searchParams]);

    const updateOrder = (idx, fields) => {
        setOrders(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...fields };
            return next;
        });
    };

    const applyToAll = (field, value) => {
        if (!value) return;
        setOrders(prev => prev.map(o => ({ ...o, [field]: value })));
        toast.success(`Updated ${field} for all rows`);
    };

    // Phase 5 & 8: Confirm Dispatch Logic
    const handleFinalBook = async () => {
        const incomplete = orders.find(o => !o.cityName || !o.pickupAddressCode);
        if (incomplete) {
            toast.error(`Order ${incomplete.orderNumber} is missing City or Pickup Location`);
            return;
        }

        setSubmitting(true);
        setFailedMap({}); // Clear previous failures

        try {
            const shipments = orders.map(o => ({
                orderId: o.orderId,
                payload: {
                    orderRefNumber: o.orderNumber,
                    orderType: o.orderType,
                    cityName: o.cityName,
                    customerName: o.customerName,
                    customerPhone: o.customerPhone,
                    deliveryAddress: o.originalAddress, 
                    invoicePayment: Number(o.totalAmount),
                    items: Number(o.itemsCount),
                    orderDetail: o.orderDetail,
                    pickupAddressCode: o.pickupAddressCode,
                    storeAddressCode: status?.defaultStoreAddressCode || "", // Include store code (Fix for Phase 5)
                    invoiceDivision: 1
                }
            }));

            const res = await adminRequest('/postex/bulk-book', 'POST', { shipments, forceRebook });
            
            if (res?.success && res.summary?.successCount > 0) {
                const { successCount, failedCount } = res.summary;
                
                if (failedCount === 0) {
                    toast.success(`Success! All ${successCount} orders booked on PostEx.`);
                    await refreshData(); 
                    router.push('/postex/bookings?bulkBooking=success');
                } else {
                    // Partial Success
                    const map = {};
                    res.failedOrders?.forEach(f => map[f.orderId] = f.reason);
                    setFailedMap(map);

                    toast.success(`${successCount} orders booked successfully.`);
                    toast.error(`${failedCount} orders failed. See reasons in table below.`, { duration: 6000 });
                    await refreshData(); 
                }
            } else {
                // Total Failure
                const map = {};
                res.failedOrders?.forEach(f => map[f.orderId] = f.reason);
                setFailedMap(map);

                const failedCount = res?.summary?.failedCount || orders.length;
                const firstReason = res?.failedOrders?.[0]?.reason || 'API rejection';
                toast.error(`Dispatch Failed: ${firstReason}`, { duration: 8000 });
                
                if (res?.failedOrders?.length > 0) {
                    console.error("PostEx Detailed Failures:", res.failedOrders);
                }
            }
        } catch (error) {
            console.error("Bulk booking error:", error);
            toast.error('Fatal dispatch failure. Check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!loading && (prepError || orders.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
                <AlertCircle className="text-[#e63946]" size={40} />
                <h2 className="text-lg font-bold text-[#1a1a2e]">No shipments to prepare</h2>
                <p className="text-sm text-gray-500 max-w-md">{prepError || 'Selected orders could not be loaded.'}</p>
                <Button onClick={() => router.push('/postex/bulk')} variant="primary">
                    Back to Bulk Booking
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-[#0a4019]" size={32} />
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Initialising Logistics Engine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-32 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#F5F3F0] shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-neutral-50 rounded-xl transition-colors text-neutral-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-[#0a4019] uppercase tracking-tight">PostEx Dispatch Manifest</h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{orders.length} Shipments Prepared</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                        <input 
                            type="checkbox" 
                            id="forceRebook" 
                            checked={forceRebook} 
                            onChange={e => setForceRebook(e.target.checked)}
                            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="forceRebook" className="text-[10px] font-bold text-amber-700 uppercase tracking-tight cursor-pointer">
                            Force Re-dispatch
                        </label>
                    </div>
                    <Button 
                        onClick={handleFinalBook} 
                        disabled={submitting}
                        className="bg-[#0a4019] text-white h-11 px-8 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-[#0a4019]/20"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : <Truck size={14} className="mr-2"/>}
                        Confirm Dispatch
                    </Button>
                </div>
            </div>

            {/* Batch Controls */}
            <div className="bg-[#051712] text-white p-5 rounded-2xl shadow-xl flex flex-wrap items-center gap-6 border border-white/10">
                <div className="flex items-center gap-2 mr-2">
                    <Settings2 size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Global Settings:</span>
                </div>
                
                <select 
                    onChange={(e) => applyToAll('pickupAddressCode', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none hover:bg-white/20 transition-all cursor-pointer"
                >
                    <option value="" className="text-black">Set All Pickups...</option>
                    {addresses.map(a => <option key={a.addressCode} value={a.addressCode} className="text-black">{a.address}</option>)}
                </select>

                <select 
                    onChange={(e) => applyToAll('cityName', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none hover:bg-white/20 transition-all cursor-pointer"
                >
                    <option value="" className="text-black">Set All Cities...</option>
                    {cities.map(c => <option key={c.name} value={c.name} className="text-black">{c.name}</option>)}
                </select>

                <select 
                    onChange={(e) => applyToAll('orderType', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none hover:bg-white/20 transition-all cursor-pointer"
                >
                    <option value="" className="text-black">Set All Service Types...</option>
                    <option value="Normal" className="text-black">Normal</option>
                    <option value="Reverse" className="text-black">Reverse</option>
                    <option value="Replacement" className="text-black">Replacement</option>
                </select>
            </div>

            {/* Manifest Table */}
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FDFCFB] border-b border-[#F5F3F0]">
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest w-12 text-center">#</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Order Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Customer Address</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">PostEx City</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pickup Location</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status / Reason</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {orders.map((o, idx) => (
                                <tr key={o.orderId} className={`hover:bg-neutral-50/50 transition-colors ${failedMap[o.orderId] ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-6 py-4 text-xs font-bold text-neutral-300 text-center">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#0a4019]">{o.orderNumber}</span>
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase truncate max-w-[150px]">{o.customerName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium text-neutral-600">{o.originalCity}</span>
                                            <span className="text-[9px] text-neutral-400 truncate max-w-[180px]">{o.originalAddress}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={o.cityName} 
                                            onChange={(e) => updateOrder(idx, { cityName: e.target.value })}
                                            className={`w-full min-w-[150px] bg-neutral-50 border rounded-lg px-3 py-2 text-[11px] font-bold text-[#0a4019] outline-none transition-all ${!o.cityName ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-neutral-100'}`}
                                        >
                                            <option value="">Select city...</option>
                                            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={o.pickupAddressCode} 
                                            onChange={(e) => updateOrder(idx, { pickupAddressCode: e.target.value })}
                                            className={`w-full min-w-[150px] bg-neutral-50 border rounded-lg px-3 py-2 text-[11px] font-bold text-[#0a4019] outline-none transition-all ${!o.pickupAddressCode ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-neutral-100'}`}
                                        >
                                            <option value="">Select Pickup...</option>
                                            {addresses.sort((a, b) => (b.addressType === 'Pickup Address' ? 1 : -1)).map(a => (
                                                <option key={a.addressCode} value={a.addressCode}>
                                                    {a.addressType === 'Pickup Address' ? '📦 ' : '🏠 '}
                                                    {a.address}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        {failedMap[o.orderId] ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-red-600">
                                                    <AlertCircle size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">Rejected</span>
                                                </div>
                                                <span className="text-[9px] text-red-500 font-medium leading-tight max-w-[180px]">{failedMap[o.orderId]}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-neutral-400">
                                                <RefreshCcw size={12} className={submitting ? "animate-spin" : ""} />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Ready</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setOrders(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-neutral-300 hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-6 right-6 z-[60]">
                <div className="bg-[#051712] text-white p-6 rounded-2xl shadow-2xl flex flex-col gap-5 border border-white/10 min-w-[320px] animate-slideUp">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Manifest Total</span>
                            <span className="text-3xl font-bold">{orders.length} <span className="text-[10px] text-white/40 uppercase">Orders</span></span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Total COD</span>
                            <div className="text-xl font-bold">Rs. {orders.reduce((acc, o) => acc + Number(o.totalAmount), 0).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleFinalBook}
                        disabled={submitting || orders.length === 0}
                        className="w-full bg-[#0a4019] text-white h-14 rounded-xl text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#0c4d1e] active:scale-[0.98] transition-all shadow-xl shadow-[#000]/20"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Truck size={18} className="mr-2" />}
                        {submitting ? "Processing Dispatch..." : "Dispatch Entire Batch"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function BulkPrepPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-[#0a4019]" size={32} /></div>}>
            <BulkPrepContent />
        </Suspense>
    );
}
