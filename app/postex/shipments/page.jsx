"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import toast from 'react-hot-toast';
import {
    Truck, Search, RefreshCw, X, Download, FileText,
    Loader2, Eye, AlertTriangle, Package, CheckCircle, Clock, ToggleLeft, ToggleRight,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_COLORS = {
    'Booked':             'bg-blue-50 text-blue-700 border-blue-100',
    'Picked Up':          'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Picked By PostEx':   'bg-indigo-50 text-indigo-700 border-indigo-100',
    'At PostEx Warehouse':'bg-purple-50 text-purple-700 border-purple-100',
    'PostEx WareHouse':   'bg-purple-50 text-purple-700 border-purple-100',
    'In Transit':         'bg-violet-50 text-violet-700 border-violet-100',
    'Package on Route':   'bg-violet-50 text-violet-700 border-violet-100',
    'Out For Delivery':   'bg-amber-50 text-amber-700 border-amber-100',
    'Delivered':          'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Returned':           'bg-red-50 text-red-700 border-red-100',
    'Returning':          'bg-orange-50 text-orange-700 border-orange-100',
    'Delivery Attempted': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    'Attempted':          'bg-yellow-50 text-yellow-700 border-yellow-100',
    'Delivery Under Review':'bg-rose-50 text-rose-700 border-rose-100',
    'Under Review':       'bg-rose-50 text-rose-700 border-rose-100',
    'Cancelled':          'bg-neutral-100 text-neutral-500 border-neutral-200',
    'UnBooked':           'bg-neutral-100 text-neutral-500 border-neutral-200',
    'Pending':            'bg-slate-50 text-slate-600 border-slate-100',
};

const ALL_STATUSES = [
    "UnBooked", "Booked", "PostEx WareHouse", "Out For Delivery", "Delivered",
    "Returned", "Un-Assigned By Me", "Expired", "Delivery Under Review",
    "Picked By PostEx", "Out For Return", "Attempted", "En-Route to PostEx warehouse", "Cancelled"
];

export default function PostExShipmentsPage() {
    const { adminRequest } = useAdmin();
    const [shipments, setShipments] = useState([]);
    const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0, exception: 0, pending: 0 });
    const [totalEntries, setTotalEntries] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selected, setSelected] = useState(new Set());
    
    // Pagination and Filters
    const [filters, setFilters] = useState({ trackingNumber: '', orderRefNumber: '', status: '', from: '', to: '' });
    const [activeFilters, setActiveFilters] = useState({ trackingNumber: '', orderRefNumber: '', status: '', from: '', to: '' });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Auto Refresh
    const [autoRefresh, setAutoRefresh] = useState(false);
    const autoRefreshInterval = useRef(null);

    // Modals
    const [trackingDetail, setTrackingDetail] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(null);
    const [paymentDetail, setPaymentDetail] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);

    const fetchStats = useCallback(async () => {
        const res = await adminRequest('/postex/shipments/stats');
        if (res?.success) setStats(res.data);
    }, [adminRequest]);

    const fetchShipments = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page, limit });
        Object.entries(activeFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
        
        const res = await adminRequest(`/postex/shipments?${params.toString()}`);
        if (res?.success) {
            setShipments(res.data || []);
            setTotalEntries(res.total || 0);
        } else {
            toast.error(res?.message || 'Failed to load shipments');
        }
        setLoading(false);
    }, [adminRequest, activeFilters, page, limit]);

    const handleRefresh = async () => {
        await Promise.all([fetchStats(), fetchShipments()]);
    };

    useEffect(() => {
        handleRefresh();
    }, [fetchShipments, fetchStats]);

    // Auto-refresh logic
    useEffect(() => {
        if (autoRefresh) {
            autoRefreshInterval.current = setInterval(() => {
                adminRequest('/postex/sync-tracking', 'POST').then(() => {
                    handleRefresh();
                });
            }, 60000); // 1 minute
        } else {
            if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current);
        }
        return () => { if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current); };
    }, [autoRefresh, adminRequest, handleRefresh]);

    const handleSearch = () => {
        setPage(1);
        setActiveFilters({ ...filters });
    };

    const handleReset = () => {
        const empty = { trackingNumber: '', orderRefNumber: '', status: '', from: '', to: '' };
        setFilters(empty);
        setActiveFilters(empty);
        setPage(1);
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        const res = await adminRequest('/postex/sync-tracking', 'POST');
        if (res?.success) { 
            toast.success(`${res.updatesCount} shipments updated`); 
            handleRefresh(); 
        } else {
            toast.error(res?.message || 'Sync failed');
        }
        setSyncing(false);
    };

    const handleTrack = async (trackingNumber) => {
        setTrackingLoading(trackingNumber);
        const res = await adminRequest(`/postex/track/${trackingNumber}`);
        if (res?.success) { 
            setTrackingDetail(res); 
            handleRefresh(); 
        } else {
            toast.error(res?.message || 'Tracking failed');
        }
        setTrackingLoading(null);
    };

    const handlePaymentStatus = async (trackingNumber) => {
        const res = await adminRequest(`/postex/payment-status/${trackingNumber}`);
        if (res?.success) setPaymentDetail(res);
        else toast.error(res?.message || 'Failed to fetch payment status');
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        const res = await adminRequest(`/postex/cancel/${cancelTarget}`, 'PUT');
        if (res?.success) { 
            toast.success('Shipment cancelled'); 
            setCancelTarget(null); 
            handleRefresh(); 
        } else {
            toast.error(res?.message || 'Cancel failed');
        }
    };

    const handleBulkInvoice = async () => {
        if (selected.size === 0) return toast.error('Select at least one shipment');
        const nums = Array.from(selected).slice(0, 10).join(',');
        const res = await adminRequest(`/postex/invoice?trackingNumbers=${nums}`);
        if (res?.success && res.data?.dist?.invoiceUrl) {
            window.open(res.data.dist.invoiceUrl, '_blank');
        } else toast.error(res?.message || 'Invoice generation failed');
    };

    const toggleSelect = (tn) => setSelected(prev => {
        const n = new Set(prev);
        n.has(tn) ? n.delete(tn) : n.add(tn);
        return n;
    });

    const totalPages = Math.ceil(totalEntries / limit) || 1;

    // Helper for location display
    const getLocation = (s) => {
        if (s.transactionStatusHistory && s.transactionStatusHistory.length > 0) {
            return s.transactionStatusHistory[0]?.status || s.transactionStatusHistory[0]?.transactionStatus || 'N/A';
        }
        if (s.orderStatus === 'Booked') return 'Shipment Booked';
        return 'Awaiting Pickup';
    };

    return (
        <div className="space-y-6 pb-20 animate-fadeIn max-w-7xl mx-auto">
            {/* Section 1: Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-3">
                        <Truck size={26}/> Shipping Dashboard
                    </h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.15em]">
                        Monitor, manage, and track all PostEx shipments from one place
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Auto Refresh</span>
                        <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-${autoRefresh ? 'emerald-600' : 'neutral-400'} transition-colors`}>
                            {autoRefresh ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                        </button>
                    </div>
                    {selected.size > 0 && (
                        <button onClick={handleBulkInvoice} className="flex items-center gap-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                            <FileText size={15}/> Invoice ({Math.min(selected.size, 10)})
                        </button>
                    )}
                    <button onClick={handleSyncAll} disabled={syncing} className="flex items-center gap-2 bg-[#0a4019] text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-[#0a4019]/90 disabled:opacity-50">
                        {syncing ? <Loader2 size={15} className="animate-spin"/> : <RefreshCw size={15}/>} Sync All
                    </button>
                </div>
            </div>

            {/* Section 2: Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { title: 'Total Shipments', val: stats.total, sub: 'All Shipments', icon: Package, color: 'text-blue-500' },
                    { title: 'In Transit', val: stats.inTransit, sub: stats.total ? `${((stats.inTransit/stats.total)*100).toFixed(1)}%` : '0%', icon: Truck, color: 'text-violet-500' },
                    { title: 'Delivered', val: stats.delivered, sub: stats.total ? `${((stats.delivered/stats.total)*100).toFixed(1)}%` : '0%', icon: CheckCircle, color: 'text-emerald-500' },
                    { title: 'Exception', val: stats.exception, sub: stats.total ? `${((stats.exception/stats.total)*100).toFixed(1)}%` : '0%', icon: AlertTriangle, color: 'text-orange-500' },
                    { title: 'Pending', val: stats.pending, sub: stats.total ? `${((stats.pending/stats.total)*100).toFixed(1)}%` : '0%', icon: Clock, color: 'text-slate-500' }
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-xl bg-neutral-50 ${c.color}`}>
                                <c.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">{c.title}</p>
                            <p className="text-2xl font-bold text-neutral-800">{c.val}</p>
                            <p className="text-[10px] uppercase font-bold text-neutral-400 mt-1">{c.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Section 3: Filters and Search */}
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
                    <input placeholder="Tracking number…" value={filters.trackingNumber}
                        onChange={e => setFilters(p => ({ ...p, trackingNumber: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#0a4019] transition-colors"/>
                </div>
                <div className="relative flex-1 min-w-[160px]">
                    <input placeholder="Order reference…" value={filters.orderRefNumber}
                        onChange={e => setFilters(p => ({ ...p, orderRefNumber: e.target.value }))}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#0a4019] transition-colors"/>
                </div>
                <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                    className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0a4019] min-w-[160px] bg-white">
                    <option value="">All Statuses</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-2 items-center bg-white border border-neutral-200 rounded-xl px-2 py-1.5 focus-within:border-[#0a4019] transition-colors">
                    <input type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))}
                        className="text-sm focus:outline-none bg-transparent"/>
                    <span className="text-neutral-300">-</span>
                    <input type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))}
                        className="text-sm focus:outline-none bg-transparent"/>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleSearch} className="flex-1 sm:flex-none bg-[#0a4019] text-white rounded-xl px-5 py-2 text-sm font-bold hover:bg-[#0a4019]/90 transition-colors">Search</button>
                    <button onClick={handleReset} className="flex-1 sm:flex-none border border-neutral-200 rounded-xl px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Reset</button>
                </div>
            </div>

            {/* Section 4: Shipments Tracking Table */}
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 border-b border-[#F5F3F0]">
                            <tr>
                                <th className="w-10 px-4 py-4"><input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(shipments.map(s => s.postexTrackingNumber)) : new Set())}/></th>
                                {['Tracking #','Order Ref','Customer','Destination','Status','Current Location','Last Update','Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="py-20 text-center">
                                        <Loader2 className="animate-spin text-[#0a4019] mx-auto" size={28}/>
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-16 text-center text-neutral-400">
                                        <Truck size={40} className="mx-auto mb-3 opacity-20"/>
                                        <p className="font-bold text-sm">No shipments found</p>
                                        <p className="text-xs mt-1">Adjust filters or sync to load data.</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map(s => (
                                    <tr key={s._id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <input type="checkbox" className="rounded" checked={selected.has(s.postexTrackingNumber)}
                                                onChange={() => toggleSelect(s.postexTrackingNumber)}/>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold text-[#0a4019] hover:underline cursor-pointer text-xs whitespace-nowrap" onClick={() => handleTrack(s.postexTrackingNumber)}>
                                            {s.postexTrackingNumber}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-neutral-700 whitespace-nowrap">{s.orderRefNumber || s.localOrderId?.orderNumber || '—'}</td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            <div className="font-medium text-neutral-800">{s.customerName}</div>
                                            <div className="text-neutral-500 mt-0.5">{s.customerPhone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{s.cityName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${STATUS_COLORS[s.orderStatus] || STATUS_COLORS['Pending']}`}>
                                                {s.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-600 max-w-[200px] truncate" title={getLocation(s)}>
                                            {getLocation(s)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                                            {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                <button onClick={() => handleTrack(s.postexTrackingNumber)} title="Track"
                                                    disabled={trackingLoading === s.postexTrackingNumber}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0a4019]/20 text-[#0a4019] hover:bg-[#0a4019] hover:text-white transition-colors text-xs font-bold disabled:opacity-50">
                                                    {trackingLoading === s.postexTrackingNumber ? <Loader2 size={12} className="animate-spin"/> : <Eye size={12}/>}
                                                    Track
                                                </button>
                                                <button onClick={() => handlePaymentStatus(s.postexTrackingNumber)} title="Payment Info"
                                                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-emerald-600 hover:text-white transition-colors text-neutral-500">
                                                    <Download size={14}/>
                                                </button>
                                                {!s.isCancelled && !['Delivered','Returned','Cancelled'].includes(s.orderStatus) && (
                                                    <button onClick={() => setCancelTarget(s.postexTrackingNumber)} title="Cancel Shipment"
                                                        className="p-1.5 rounded-lg border border-neutral-200 hover:bg-red-500 hover:text-white transition-colors text-neutral-500">
                                                        <X size={14}/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Section 5: Pagination */}
                {!loading && totalEntries > 0 && (
                    <div className="p-4 border-t border-[#F5F3F0] flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-50/50">
                        <div className="text-xs text-neutral-500 font-medium">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalEntries)} of {totalEntries} entries
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500">Rows per page:</span>
                                <select 
                                    value={limit} 
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#0a4019]"
                                >
                                    {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                                ><ChevronLeft size={16}/></button>
                                <span className="px-3 py-1.5 text-xs font-bold bg-white border border-neutral-200 rounded-lg min-w-8 text-center">
                                    {page}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                                ><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tracking detail modal */}
            {trackingDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTrackingDetail(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#0a4019] uppercase tracking-widest text-sm">Tracking Details</h3>
                            <button onClick={() => setTrackingDetail(null)} className="text-neutral-400 hover:text-black transition-colors"><X size={18}/></button>
                        </div>
                        {trackingDetail.data?.dist ? (
                            <>
                                <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${STATUS_COLORS[trackingDetail.shipment?.orderStatus] || STATUS_COLORS['Pending']}`}>
                                        {trackingDetail.data.dist.transactionStatus || trackingDetail.shipment?.orderStatus}
                                    </span>
                                    <span className="font-mono font-bold text-sm text-neutral-700">{trackingDetail.data.dist.trackingNumber}</span>
                                </div>
                                {Array.isArray(trackingDetail.data.dist.transactionHistory) && trackingDetail.data.dist.transactionHistory.length > 0 ? (
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {trackingDetail.data.dist.transactionHistory.map((h, i) => (
                                            <div key={i} className="flex gap-4 items-start relative">
                                                {i !== trackingDetail.data.dist.transactionHistory.length - 1 && (
                                                    <div className="absolute left-1.5 top-4 bottom-[-16px] w-[1px] bg-neutral-200 z-0"/>
                                                )}
                                                <div className="w-3 h-3 rounded-full bg-[#0a4019] mt-1 flex-shrink-0 z-10 border-[3px] border-white shadow-sm"/>
                                                <div className="bg-neutral-50 rounded-xl p-3 flex-1 border border-neutral-100">
                                                    <p className="text-xs font-bold text-neutral-800">{h.status || h.transactionStatus}</p>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mt-1">{h.date || h.updatedAt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 text-center py-4">No detailed tracking history available yet.</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">Invalid tracking response from PostEx.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Payment status modal */}
            {paymentDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPaymentDetail(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-[#0a4019] uppercase tracking-widest text-sm">Payment Info</h3>
                            <button onClick={() => setPaymentDetail(null)} className="text-neutral-400 hover:text-black transition-colors"><X size={18}/></button>
                        </div>
                        {paymentDetail.data?.dist ? (
                            <div className="space-y-4">
                                {[
                                    ['Tracking #', paymentDetail.data.dist.trackingNumber, 'font-mono text-neutral-800'],
                                    ['Settled', paymentDetail.data.dist.settle ? '✅ Yes' : '❌ No', ''],
                                    ['Settlement Date', paymentDetail.data.dist.settlementDate || 'Not settled', 'text-neutral-600'],
                                    ['Upfront Payment', paymentDetail.data.dist.upfrontPaymentDate || 'N/A', 'text-neutral-600'],
                                    ['Reserve Payment', paymentDetail.data.dist.reservePaymentDate || 'N/A', 'text-neutral-600'],
                                ].map(([k, v, classes]) => (
                                    <div key={k} className="flex justify-between items-center text-sm border-b border-neutral-100 pb-3">
                                        <span className="text-neutral-500 font-medium">{k}</span>
                                        <span className={`font-bold ${classes}`}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-neutral-500 text-center py-4">No payment data available yet.</p>}
                    </div>
                </div>
            )}

            {/* Cancel confirm modal */}
            {cancelTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                            <AlertTriangle size={24}/>
                            <h3 className="font-bold uppercase tracking-widest text-sm">Cancel Shipment</h3>
                        </div>
                        <p className="text-sm text-neutral-600">Are you sure you want to completely cancel shipment <span className="font-mono font-bold text-black bg-neutral-100 px-1 rounded">{cancelTarget}</span>? This action cannot be undone and will notify PostEx.</p>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setCancelTarget(null)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Go Back</button>
                            <button onClick={handleCancel} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-200">Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
