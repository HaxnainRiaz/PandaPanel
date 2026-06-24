"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
    ChevronLeft, Printer, Edit2, ChevronRight,
    Box, Clock, User, MapPin, Phone, MessageSquare,
    Truck, CheckCircle, XCircle, Tag, Save, X, ExternalLink,
    ArrowLeft, MoreVertical, AlertCircle, RefreshCw, Undo,
    StickyNote, Plus
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";
import useOrderStore from "@/store/useOrderStore";
import { useOrderDraft } from "@/hooks/useOrderDraft";
import ShipWithPostExModal from "@/components/postex/ShipWithPostExModal";

// --- Sub-components ---

const StatusBadge = ({ label, variant }) => {
    let colors = "bg-neutral-100 text-neutral-600";
    const status = (label || "").toUpperCase();

    if (variant === 'payment') {
        if (status === 'PAID') colors = "bg-[#d4edda] text-[#155724] border-[#c3e6cb]";
        else if (status === 'PENDING') colors = "bg-[#fff3cd] text-[#856404] border-[#ffeeba]";
        else if (status === 'FAILED') colors = "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]";
    } else if (variant === 'order' || variant === 'fulfillment') {
        if (status === 'DELIVERED') colors = "bg-[#d4edda] text-[#155724] border-[#c3e6cb]";
        else if (['SHIPPED', 'CONFIRMED', 'FULFILLED'].includes(status)) colors = "bg-[#d1e7ff] text-[#004085] border-[#b8daff]";
        else if (['PROCESSING', 'IN PROGRESS', 'PENDING'].includes(status)) colors = "bg-[#fff3cd] text-[#856404] border-[#ffeeba]";
        else if (status === 'ON HOLD') colors = "bg-orange-100 text-orange-700 border-orange-200";
        else if (['CANCELLED', 'RETURNED'].includes(status)) colors = "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]";
        else if (status === 'UNFULFILLED') colors = "bg-neutral-100 text-neutral-600 border-neutral-200";
    }

    return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${colors}`}>
            {label}
        </span>
    );
};

export default function OrderSlider() {
    const {
        isSliderOpen,
        selectedOrderId,
        closeSlider,
        nextOrder,
        prevOrder,
        currentIndex,
        currentOrderList,
        setCurrentOrderList
    } = useOrderStore();

    const { adminRequest, updateOrder } = useAdmin();

    // --- State Management via Custom Hook ---
    const {
        order,
        setOrder,
        itemEdits,
        inputStates,
        isSaving: isDraftSaving,
        handleInputChange,
        updateLocalItem,
        cancelItemEdit,
        saveItemEdit
    } = useOrderDraft(
        useMemo(() => currentOrderList.find(o => o._id === selectedOrderId), [currentOrderList, selectedOrderId])
    );

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [newNote, setNewNote] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNotePopup, setShowNotePopup] = useState(false);
    const [showShipModal, setShowShipModal] = useState(false);

    const orderStatuses = [
        'pending', 'processing', 'in progress', 'confirmed', 'on hold', 'unfulfilled', 'shipped', 'delivered', 'cancelled', 'returned'
    ];

    // Fetch Order
    const fetchOrder = useCallback(async () => {
        if (!selectedOrderId) return;
        setLoading(true);
        try {
            const res = await adminRequest(`/orders/${selectedOrderId}`);
            if (res?.success) {
                setOrder(res.data);
                setNewNote(res.data.transactionNotes || "");
                setBookingParams(prev => ({
                    ...prev,
                    remarks: res.data.transactionNotes || ""
                }));
            }
        } catch (err) {
            toast.error("Failed to load order");
        } finally {
            setLoading(false);
        }
    }, [selectedOrderId, adminRequest, setOrder]);

    useEffect(() => {
        if (isSliderOpen && selectedOrderId) {
            fetchOrder();
        }
    }, [isSliderOpen, selectedOrderId, fetchOrder]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') closeSlider(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeSlider]);

    // Generic Action Helper
    const performAction = useCallback(async (key, endpoint, method = 'PATCH', payload = {}) => {
        setActionLoading(prev => ({ ...prev, [key]: true }));

        try {
            const res = await adminRequest(endpoint, method, payload);
            if (res?.success) {
                toast.success(res.message || "Action successful");
                if (res.data) {
                    setOrder(res.data);
                    if (updateOrder) updateOrder(res.data._id, res.data);
                    const newList = currentOrderList.map(o => o._id === res.data._id ? res.data : o);
                    setCurrentOrderList(newList);
                } else {
                    fetchOrder();
                }
                if (key === 'cancel') setShowCancelModal(false);
            } else {
                toast.error(res?.message || "Action failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    }, [adminRequest, fetchOrder, setOrder, updateOrder, currentOrderList, setCurrentOrderList]);

    const handleSaveField = useCallback(async (path, value) => {
        let payload = { [path]: value };
        if (path === 'totalAmount') payload = { totalAmount: parseFloat(value) };
        await performAction('save_field', `/orders/${order._id}`, 'PATCH', payload);
    }, [order?._id, performAction]);

    // bookPostEx replaced by ShipWithPostExModal


    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold;">${item.productName || (item.product && item.product.title) || 'Product'}</div>
                    <div style="font-size: 11px; color: #666;">${item.variant || ''}</div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price * item.quantity}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order ${order.orderNumber || order._id}</title>
                    <style>
                        body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #1a4a1a; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #1a4a1a; }
                        .order-info { text-align: right; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .section-title { font-size: 10px; font-weight: bold; color: #6b7c6b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        th { background: #f7fbf7; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; color: #6b7c6b; }
                        .totals { margin-left: auto; width: 300px; }
                        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
                        .grand-total { font-size: 18px; font-weight: bold; color: #1a4a1a; border-top: 1px solid #e8f0e8; margin-top: 10px; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">STORVIA</div>
                        <div class="order-info">
                            <div style="font-size: 20px; font-weight: bold;">Order ${order.orderNumber || `#ID-${order._id.substring(18).toUpperCase()}`}</div>
                            <div style="color: #666;">${format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                        </div>
                    </div>
                    <div class="grid">
                        <div>
                            <div class="section-title">Shipping To</div>
                            <div style="font-weight: bold; font-size: 16px;">${order.shippingAddress?.fullName}</div>
                            <div>${order.shippingAddress?.phone}</div>
                            <div>${order.shippingAddress?.street}</div>
                            <div>${order.shippingAddress?.city}, ${order.shippingAddress?.state || ''}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div class="totals">
                        <div class="total-row grand-total"><span>Amount</span><span>Rs. ${order.totalAmount}</span></div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const EditableField = ({ label, value, path, type = "text" }) => {
        const [localEdit, setLocalEdit] = useState(false);
        const [val, setVal] = useState(value || "");

        const handleSave = () => {
            handleSaveField(path, val);
            setLocalEdit(false);
        };

        return (
            <div className="group py-3 border-b border-[#e8f0e8] last:border-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest">{label}</span>
                    {!localEdit && (
                        <button onClick={() => setLocalEdit(true)} className="opacity-0 group-hover:opacity-100 p-1 text-[#6b7c6b] hover:bg-[#f7fbf7] rounded transition-opacity">
                            <Edit2 size={12} />
                        </button>
                    )}
                </div>
                {localEdit ? (
                    <div className="flex gap-2">
                        {type === 'textarea' ? (
                            <textarea
                                className="flex-1 text-sm border border-[#1a4a1a] rounded-md p-2 bg-white outline-none font-bold"
                                value={val}
                                onChange={e => setVal(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleSave();
                                    }
                                }}
                            />
                        ) : (
                            <input
                                className="flex-1 text-sm border border-[#1a4a1a] rounded-md p-2 bg-white outline-none font-bold"
                                value={val}
                                type={type === 'number' ? 'number' : 'text'}
                                onChange={e => setVal(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSave();
                                    }
                                }}
                            />
                        )}
                        <div className="flex flex-col gap-1">
                            <button onClick={handleSave} className="p-1 bg-[#1a4a1a] text-white rounded shadow-sm hover:scale-105 active:scale-95 transition-transform"><Save size={14} /></button>
                            <button onClick={() => { setVal(value); setLocalEdit(false); }} className="p-1 bg-neutral-100 text-neutral-400 rounded hover:bg-neutral-200"><X size={14} /></button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-[#1a1a1a]">{value || "---"}</p>
                )}
            </div>
        );
    };

    if (!isSliderOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px] transition-all animate-fadeIn"
                onClick={closeSlider}
            />

            {/* Slider Container */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[720px] bg-[#f7fbf7] z-[101] shadow-2xl flex flex-col overflow-hidden animate-slideIn">

                {/* 1. STICKY HEADER */}
                <div className="sticky top-0 z-30 bg-white border-b border-[#e8f0e8] px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={closeSlider}
                            className="p-2 hover:bg-[#f7fbf7] rounded-full text-[#1a4a1a] transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">
                                {order ? `Order ${order.orderNumber || `#ID-${order._id.substring(18).toUpperCase()}`}` : "Loading..."}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {order && (
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="h-8 px-3 border-[#1a4a1a] text-[#1a4a1a] text-[10px] font-bold tracking-widest uppercase rounded-[6px] hover:bg-[#1a4a1a] hover:text-white transition-all"
                            >
                                <Printer size={12} className="mr-2" /> Print Slip
                            </Button>
                        )}
                        <div className="flex items-center gap-1 ml-2 border-l border-[#e8f0e8] pl-2">
                            <button disabled={currentIndex <= 0} onClick={prevOrder} className="p-1.5 hover:bg-[#f7fbf7] rounded-lg text-[#1a4a1a] disabled:opacity-30"><ChevronLeft size={18} /></button>
                            <button disabled={currentIndex >= currentOrderList.length - 1} onClick={nextOrder} className="p-1.5 hover:bg-[#f7fbf7] rounded-lg text-[#1a4a1a] disabled:opacity-30"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* 2. SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
                    {!order ? (
                        <div className="flex h-[40vh] items-center justify-center"><div className="w-8 h-8 border-3 border-[#1a4a1a] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <>
                            {/* Staff Notes Toolbar */}
                            <div className="bg-orange-50/40 p-5 rounded-2xl border border-orange-100 flex items-center justify-between animate-fadeIn shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl text-orange-600 flex items-center justify-center shadow-inner">
                                        <StickyNote size={22} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-orange-900 uppercase tracking-widest text-[10px] mb-1">Internal Note</h2>
                                        <p className="text-[11px] text-orange-800/80 font-medium max-w-[280px] line-clamp-1 italic">
                                            {order.transactionNotes ? `"${order.transactionNotes}"` : "No internal instructions for this order."}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setNewNote(order.transactionNotes || "");
                                        setShowNotePopup(true);
                                    }}
                                    className="h-11 px-5 text-[10px] font-bold uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Plus size={14} /> {order.transactionNotes ? 'Update' : 'Add Note'}
                                </Button>
                            </div>

                            {/* Note Popup Modal */}
                            {showNotePopup && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
                                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 animate-slideUp">
                                        <div className="p-8 border-b border-neutral-50 flex items-center justify-between bg-orange-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-orange-100 rounded-2xl text-orange-600 flex items-center justify-center shadow-inner">
                                                    <StickyNote size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-neutral-800 text-xl tracking-tight">Internal Staff Note</h3>
                                                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">Confidential • Admin Only</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowNotePopup(false)}
                                                className="w-10 h-10 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="p-8 space-y-8">
                                            <div className="relative">
                                                <textarea
                                                    className="w-full bg-neutral-50 border border-neutral-100 rounded-3xl px-6 py-5 text-sm focus:outline-none focus:ring-8 focus:ring-orange-500/5 focus:border-orange-500/50 h-52 resize-none font-medium transition-all shadow-inner"
                                                    placeholder="Enter internal shipping instructions, customer preferences, or fraud alerts..."
                                                    value={newNote}
                                                    onChange={e => setNewNote(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="absolute bottom-4 right-4 pointer-events-none">
                                                    <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">Auto-Saving Enabled</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button
                                                    onClick={() => setShowNotePopup(false)}
                                                    variant="outline"
                                                    className="flex-1 h-14 text-xs font-bold uppercase tracking-widest border-neutral-200 rounded-2xl hover:bg-neutral-50 transition-all"
                                                >
                                                    Discard
                                                </Button>
                                                <Button
                                                    onClick={async () => {
                                                        await handleSaveField('transactionNotes', newNote);
                                                        setShowNotePopup(false);
                                                    }}
                                                    className="flex-1 h-14 text-xs font-bold uppercase tracking-widest bg-[#0a4019] hover:bg-[#051712] text-white rounded-2xl shadow-xl shadow-[#0a4019]/20 transition-all active:scale-95"
                                                    disabled={actionLoading.save_field}
                                                >
                                                    {actionLoading.save_field ? 'Syncing...' : 'Save Instruction'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workflow Control Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-[#e8f0e8] shadow-sm">
                                    <p className="text-[9px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-2">Payment</p>
                                    <select
                                        className="w-full bg-neutral-50 border border-neutral-100 rounded-md p-1.5 text-[10px] font-bold uppercase tracking-widest outline-none text-[#1a4a1a]"
                                        value={order.paymentStatus}
                                        onChange={(e) => handleSaveField('paymentStatus', e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                    <div className="mt-2"><StatusBadge label={order.paymentStatus} variant="payment" /></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#e8f0e8] shadow-sm">
                                    <p className="text-[9px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-2">Order Lifecycle</p>
                                    <select
                                        className="w-full bg-neutral-50 border border-neutral-100 rounded-md p-1.5 text-[10px] font-bold uppercase tracking-widest outline-none text-[#1a4a1a]"
                                        value={order.orderStatus}
                                        onChange={(e) => {
                                            const newStatus = e.target.value;
                                            let payload = { orderStatus: newStatus };

                                            // Auto-sync fulfillment based on status
                                            if (['confirmed', 'shipped', 'delivered', 'fulfilled'].includes(newStatus)) {
                                                payload.fulfillmentStatus = 'Fulfilled';
                                            } else if (['pending', 'processing', 'on hold', 'unfulfilled'].includes(newStatus)) {
                                                payload.fulfillmentStatus = 'Unfulfilled';
                                            }

                                            // Auto-mark as paid if delivered
                                            if (newStatus === 'delivered') {
                                                payload.paymentStatus = 'paid';
                                            }

                                            performAction('save_field', `/orders/${order._id}`, 'PATCH', payload);
                                        }}
                                    >
                                        {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="mt-2"><StatusBadge label={order.orderStatus} variant="order" /></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#e8f0e8] shadow-sm">
                                    <p className="text-[9px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-2">PostEx Delivery</p>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-[#1a4a1a] uppercase truncate mb-2">
                                        {order.deliveryStatus || "Not Booked"}
                                        {order.isPostExBooked && (
                                            <button onClick={() => performAction('sync', `/postex/orders/${order._id}/tracking`, 'GET')} className="p-1 hover:bg-neutral-100 rounded-full">
                                                <RefreshCw size={12} className={actionLoading.sync ? 'animate-spin' : ''} />
                                            </button>
                                        )}
                                    </div>
                                    <StatusBadge label={order.isPostExBooked ? 'BOOKED' : 'UNBOOKED'} variant="postex" />
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="space-y-6">
                                {/* Items Manifest */}
                                <div className="bg-white rounded-xl border border-[#e8f0e8] shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-[#e8f0e8] flex items-center justify-between bg-[#fcfdfc]">
                                        <div className="flex items-center gap-2">
                                            <Box size={16} className="text-[#1a4a1a]" />
                                            <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-[11px]">Items Manifest</h2>
                                        </div>
                                        <span className="text-[9px] font-bold text-[#6b7c6b] uppercase bg-[#f7fbf7] px-2 py-1 rounded border border-[#e8f0e8]">{order.fulfillmentStatus || 'Unfulfilled'}</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {order.items?.map((item, idx) => {
                                            const editedItem = itemEdits[idx] || item;
                                            const isEditing = !!itemEdits[idx];

                                            return (
                                                <div key={idx} className="flex items-center gap-4 py-4 border-b border-neutral-50 last:border-0 group">
                                                    {/* Product Image */}
                                                    <div className="w-[64px] h-[64px] rounded-2xl bg-[#f7fbf7] border border-[#e8f0e8] overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                        {item.product?.images?.[0] ? <img src={item.product.images[0]} className="w-full h-full object-cover" /> : <Box size={24} className="text-[#6b7c6b]/30" />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-[#1a1a1a] truncate mb-2">{item.product?.title || 'Product'}</p>
                                                        <div className="flex items-center gap-3">
                                                            {/* Modern Quantity Pill */}
                                                            <div className="flex items-center bg-[#f7fbf7] rounded-xl border border-[#e8f0e8] p-1 shadow-inner">
                                                                <button
                                                                    onClick={() => {
                                                                        const newQty = Math.max(1, editedItem.quantity - 1);
                                                                        updateLocalItem(idx, { quantity: newQty });
                                                                        handleInputChange(idx, 'quantity', newQty.toString());
                                                                        handleInputChange(idx, 'total', (editedItem.price * newQty).toString());
                                                                    }}
                                                                    className="w-7 h-7 flex items-center justify-center text-[#1a4a1a] hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-90 font-bold"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    className="w-10 bg-transparent outline-none text-[11px] font-bold text-[#1a4a1a] text-center no-spin"
                                                                    value={inputStates[`${idx}-quantity`] !== undefined ? inputStates[`${idx}-quantity`] : editedItem.quantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        handleInputChange(idx, 'quantity', val);
                                                                        const num = parseInt(val);
                                                                        if (!isNaN(num) && num > 0) {
                                                                            updateLocalItem(idx, { quantity: num });
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newQty = editedItem.quantity + 1;
                                                                        updateLocalItem(idx, { quantity: newQty });
                                                                        handleInputChange(idx, 'quantity', newQty.toString());
                                                                        handleInputChange(idx, 'total', (editedItem.price * newQty).toString());
                                                                    }}
                                                                    className="w-7 h-7 flex items-center justify-center text-[#1a4a1a] hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-90 font-bold"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <div className="text-[10px] font-bold text-neutral-300 mx-1">×</div>

                                                            {/* Unit Price Editing */}
                                                            <div className="flex items-center gap-1.5 bg-white border border-transparent hover:border-neutral-200 focus-within:border-[#1a4a1a] focus-within:shadow-sm px-2 py-1 rounded-xl transition-all group/price">
                                                                <span className="text-[10px] font-bold text-neutral-400">Rs.</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-16 bg-transparent outline-none text-[11px] font-bold text-[#1a4a1a] no-spin"
                                                                    value={inputStates[`${idx}-price`] !== undefined ? inputStates[`${idx}-price`] : editedItem.price}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        handleInputChange(idx, 'price', val);
                                                                        const num = parseFloat(val);
                                                                        if (!isNaN(num)) {
                                                                            updateLocalItem(idx, { price: num });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Editable Line Total */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right group/total">
                                                            <div className="inline-flex items-center gap-1.5 bg-[#f7fbf7] px-3 py-2 rounded-xl border border-[#e8f0e8] transition-all group-hover/total:border-[#1a4a1a]/30 group-hover/total:bg-white group-hover/total:shadow-sm">
                                                                <span className="text-[10px] font-bold text-[#1a4a1a]/40">Total Rs.</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-20 bg-transparent outline-none text-xs font-bold text-[#1a4a1a] text-right no-spin"
                                                                    value={inputStates[`${idx}-total`] !== undefined ? inputStates[`${idx}-total`] : (editedItem.price * editedItem.quantity)}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        handleInputChange(idx, 'total', val);
                                                                        const newTotal = parseFloat(val);
                                                                        if (!isNaN(newTotal) && editedItem.quantity > 0) {
                                                                            updateLocalItem(idx, { price: newTotal / editedItem.quantity });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {isEditing && (
                                                            <div className="flex flex-col gap-1 animate-fadeIn">
                                                                <button
                                                                    onClick={() => saveItemEdit(idx)}
                                                                    disabled={isDraftSaving}
                                                                    className="p-1.5 bg-[#1a4a1a] text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                                    title="Save Changes"
                                                                >
                                                                    {isDraftSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelItemEdit(idx)}
                                                                    className="p-1.5 bg-neutral-100 text-neutral-400 rounded-lg hover:bg-neutral-200 hover:text-neutral-600 transition-all"
                                                                    title="Cancel Changes"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div className="bg-white rounded-xl border border-[#e8f0e8] shadow-sm">
                                    <div className="p-4 border-b border-[#e8f0e8] flex items-center gap-2 bg-[#fcfdfc]">
                                        <User size={16} className="text-[#1a4a1a]" />
                                        <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-[11px]">Customer & Shipping Details</h2>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                        <EditableField label="Full Name" value={order.customerName || order.shippingAddress?.fullName} path="customerName" />
                                        <EditableField label="Phone Number" value={order.customerPhone || order.shippingAddress?.phone} path="customerPhone" />
                                        <EditableField label="City" value={order.cityName || order.shippingAddress?.city} path="cityName" />
                                        <EditableField label="Street Address" value={order.deliveryAddress || order.shippingAddress?.street} path="deliveryAddress" type="textarea" />
                                    </div>
                                </div>

                                {/* PostEx Management */}
                                <div className={`rounded-xl border shadow-sm overflow-hidden transition-all ${order.isPostExBooked ? 'bg-[#fcfdfc] border-[#d4edda]' : 'bg-white border-[#1a4a1a]/20'}`}>
                                    <div className="p-4 border-b border-inherit bg-inherit flex items-center gap-3">
                                        <Truck size={18} className={order.isPostExBooked ? 'text-[#155724]' : 'text-[#1a4a1a]'} />
                                        <h2 className={`font-bold text-[11px] uppercase tracking-widest ${order.isPostExBooked ? 'text-[#155724]' : 'text-[#1a1a1a]'}`}>PostEx Integration</h2>
                                    </div>
                                    <div className="p-4">
                                        {order.isPostExBooked && (
                                            <div className="bg-white p-4 rounded-xl border border-[#d4edda] flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-[9px] font-bold text-[#6b7c6b] uppercase mb-1">Tracking Number</p>
                                                    <p className="text-lg font-mono font-bold text-[#155724]">{order.postex?.trackingNumber}</p>
                                                </div>
                                                <a href={`https://postex.pk/tracking?trackingId=${order.postex?.trackingNumber}`} target="_blank" className="p-2.5 bg-emerald-50 rounded-full text-[#155724] hover:bg-emerald-100 transition-all"><ExternalLink size={18} /></a>
                                            </div>
                                        )}
                                        <Button
                                            onClick={() => setShowShipModal(true)}
                                            disabled={order.orderStatus === 'cancelled'}
                                            className={`w-full h-12 text-[10px] font-bold tracking-widest uppercase rounded-[8px] shadow-lg transition-all ${order.isPostExBooked
                                                ? 'bg-[#0a4019] border border-[#1a4a1a] text-[#1a4a1a] hover:bg-[#1a4a1a] hover:text-white'
                                                : 'bg-[#1a4a1a] text-white shadow-[#1a4a1a]/20 hover:bg-[#051712]'
                                                }`}
                                        >
                                            {order.isPostExBooked ? 'Re-book Shipment' : 'Book Shipment Now'}
                                        </Button>
                                    </div>
                                </div>

                                {showShipModal && (
                                    <ShipWithPostExModal
                                        order={order}
                                        onClose={() => setShowShipModal(false)}
                                        onSuccess={() => fetchOrder()}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* 3. STICKY FOOTER ACTIONS */}
                <div className="sticky bottom-0 z-30 bg-white border-t border-[#e8f0e8] px-6 py-4 flex items-center justify-between shadow-[0_-4px_15px_rgba(0,0,0,0.03)] shrink-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline" onClick={() => setShowCancelModal(true)} loading={actionLoading.cancel} disabled={!order || order.orderStatus === 'cancelled'}
                            className="h-10 px-4 border-[#dc3545] text-[#dc3545] text-[10px] font-bold uppercase tracking-widest rounded-[8px] hover:bg-[#dc3545] hover:text-white"
                        >
                            <XCircle size={14} className="mr-2" /> Cancel Order
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => performAction('save_field', `/orders/${order._id}`, 'PATCH', { orderStatus: 'on hold' })}
                            className="h-10 px-4 border-orange-200 text-orange-600 text-[10px] font-bold uppercase tracking-widest rounded-[8px] hover:bg-orange-50"
                            disabled={!order || order.orderStatus === 'on hold'}
                        >
                            <Clock size={14} className="mr-2" /> On Hold
                        </Button>
                        <Button
                            onClick={() => performAction('save_field', `/orders/${order._id}`, 'PATCH', { orderStatus: 'confirmed', fulfillmentStatus: 'Fulfilled' })}
                            className="h-10 px-6 bg-[#0a4019] text-white text-[10px] font-bold uppercase tracking-widest rounded-[8px] shadow-lg shadow-[#0a4019]/20 hover:bg-[#051712]"
                            disabled={!order || ['confirmed', 'shipped', 'delivered'].includes(order.orderStatus)}
                        >
                            <CheckCircle size={14} className="mr-2" /> Confirm Order
                        </Button>
                    </div>
                </div>

                {/* Cancel Confirmation Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-800 mb-2">Cancel Order?</h3>
                                <p className="text-sm text-neutral-500 mb-8">This action will mark the order as cancelled and cannot be undone. Are you sure you want to proceed?</p>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1 h-12 rounded-xl">No, keep it</Button>
                                    <Button
                                        onClick={() => performAction('cancel', `/orders/${order._id}`, 'PATCH', { orderStatus: 'cancelled' })}
                                        className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20"
                                        loading={actionLoading.cancel}
                                    >
                                        Yes, Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
