"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import {
    ChevronLeft, Printer, Edit2, ChevronRight,
    Box, Clock, User, MapPin, Phone, MessageSquare,
    Truck, CheckCircle, XCircle, Tag, Save, X, ExternalLink,
    ArrowLeft, RefreshCw, AlertCircle, StickyNote
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";
import useOrderStore from "@/store/useOrderStore";
import { useOrderDraft } from "@/hooks/useOrderDraft";
import ShipWithPostExModal from "@/components/postex/ShipWithPostExModal";

// --- Components ---

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
    } else if (variant === 'postex') {
        if (status === 'BOOKED') colors = "bg-[#d4edda] text-[#155724]";
        else if (status === 'UNBOOKED') colors = "bg-[#f8d7da] text-[#721c24]";
    }

    return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${colors}`}>
            {label}
        </span>
    );
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { adminRequest, updateOrder } = useAdmin();
    const { currentOrderList, currentIndex } = useOrderStore();

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
        useMemo(() => currentOrderList.find(o => o._id === id), [currentOrderList, id])
    );

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [editedFields, setEditedFields] = useState({});
    const [newNote, setNewNote] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showShipModal, setShowShipModal] = useState(false);

    // Fetch Order
    const fetchOrder = useCallback(async () => {
        try {
            const res = await adminRequest(`/orders/${id}`);
            if (res?.success) {
                setOrder(res.data);
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
    }, [id, adminRequest, setOrder]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Helpers
    const performAction = useCallback(async (key, endpoint, method = 'PATCH', payload = {}) => {
        setActionLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await adminRequest(endpoint, method, payload);
            if (res?.success) {
                toast.success(res.message || "Action successful");
                if (res.data) {
                    setOrder(res.data);
                    if (updateOrder) updateOrder(res.data._id, res.data);
                } else {
                    fetchOrder();
                }
                if (key === 'save_all') setIsGlobalEditing(false);
                if (key === 'cancel') setShowCancelModal(false);
            } else {
                toast.error(res?.message || "Action failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    }, [adminRequest, fetchOrder, setOrder, updateOrder]);

    const handleSaveField = useCallback(async (path, value) => {
        await performAction('save_field', `/orders/${order._id}`, 'PATCH', { [path]: value });
    }, [order?._id, performAction]);

    const handleSaveAll = useCallback(async () => {
        await performAction('save_all', `/orders/${order._id}`, 'PATCH', editedFields);
    }, [order?._id, editedFields, performAction]);

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
                            <div style="font-size: 20px; font-weight: bold;">Order #${order.orderNumber || order._id.substring(18).toUpperCase()}</div>
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

    const navigateTo = (newId) => {
        router.push(`/orders/${newId}`);
    };

    const EditableField = ({ label, value, path, type = "text" }) => {
        const [localEdit, setLocalEdit] = useState(false);
        const [val, setVal] = useState(value || "");

        const active = isGlobalEditing || localEdit;

        const handleSave = () => {
            handleSaveField(path, val);
            setLocalEdit(false);
        };

        return (
            <div className="group py-3 border-b border-[#e8f0e8] last:border-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest">{label}</span>
                    {!active && (
                        <button onClick={() => setLocalEdit(true)} className="opacity-0 group-hover:opacity-100 p-1 text-[#6b7c6b] hover:bg-[#f7fbf7] rounded">
                            <Edit2 size={12} />
                        </button>
                    )}
                </div>
                {active ? (
                    <div className="flex gap-2">
                        {type === 'textarea' ? (
                            <textarea
                                className="flex-1 text-sm border border-[#1a4a1a] rounded-md p-2 bg-white outline-none font-bold"
                                value={val}
                                onChange={e => {
                                    setVal(e.target.value);
                                    if (isGlobalEditing) setEditedFields(prev => ({ ...prev, [path]: e.target.value }));
                                }}
                            />
                        ) : (
                            <input
                                className="flex-1 text-sm border border-[#1a4a1a] rounded-md p-2 bg-white outline-none font-bold"
                                value={val}
                                onChange={e => {
                                    setVal(e.target.value);
                                    if (isGlobalEditing) setEditedFields(prev => ({ ...prev, [path]: e.target.value }));
                                }}
                            />
                        )}
                        {!isGlobalEditing && (
                            <div className="flex flex-col gap-1">
                                <button onClick={handleSave} className="p-1 bg-[#1a4a1a] text-white rounded shadow-sm hover:scale-105 active:scale-95 transition-transform"><Save size={14} /></button>
                                <button onClick={() => { setVal(value); setLocalEdit(false); }} className="p-1 bg-neutral-100 text-neutral-400 rounded hover:bg-neutral-200"><X size={14} /></button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm font-bold text-[#1a1a1a]">{value || "---"}</p>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#1a4a1a] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-neutral-400 uppercase tracking-widest">Order Not Found</h2>
            <Button onClick={() => router.push('/orders')} variant="outline">Back to Orders</Button>
        </div>
    );

    const isNew = new Date(order.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    return (
        <div className="min-h-screen bg-[#f7fbf7] flex flex-col font-sans relative">

            {/* 1. STICKY HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#e8f0e8] px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/orders')}
                        className="p-2 hover:bg-[#f7fbf7] rounded-full text-[#1a4a1a] transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                            Order #{order.orderNumber || order._id.substring(18).toUpperCase()}
                        </h1>
                        {isNew && (
                            <span className="bg-[#1a4a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">NEW</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="h-9 px-4 border-[#1a4a1a] text-[#1a4a1a] text-xs font-bold tracking-widest uppercase rounded-[8px] hover:bg-[#1a4a1a] hover:text-white transition-all"
                    >
                        <Printer size={14} className="mr-2" /> Print Slip
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsGlobalEditing(!isGlobalEditing)}
                        className={`h-9 px-4 border-[#1a4a1a] text-[#1a4a1a] text-xs font-bold tracking-widest uppercase rounded-[8px] transition-all ${isGlobalEditing ? 'bg-[#1a4a1a] text-white' : 'hover:bg-[#1a4a1a] hover:text-white'}`}
                    >
                        <Edit2 size={14} className="mr-2" /> {isGlobalEditing ? 'Cancel Edit' : 'Edit Order'}
                    </Button>
                    <div className="flex items-center gap-1 ml-4 border-l border-[#e8f0e8] pl-4">
                        <button
                            disabled={currentIndex <= 0}
                            onClick={() => navigateTo(currentOrderList[currentIndex - 1]._id)}
                            className="p-2 hover:bg-[#f7fbf7] rounded-lg text-[#1a4a1a] disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={currentIndex >= currentOrderList.length - 1}
                            onClick={() => navigateTo(currentOrderList[currentIndex + 1]._id)}
                            className="p-2 hover:bg-[#f7fbf7] rounded-lg text-[#1a4a1a] disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. STATUS BAR */}
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-[12px] border border-[#e8f0e8] shadow-sm">
                    <p className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-3">Payment Status</p>
                    <div className="flex items-center justify-between">
                        <StatusBadge label={order.paymentStatus} variant="payment" />
                        <span className="text-sm font-bold text-[#1a1a1a]">Rs. {order.totalAmount}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[12px] border border-[#e8f0e8] shadow-sm">
                    <p className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-3">Fulfillment</p>
                    <div className="flex items-center justify-between">
                        <StatusBadge
                            label={order.orderStatus}
                            variant="fulfillment"
                        />
                        <span className="text-sm font-bold text-[#1a1a1a]">{order.items?.length || 0} Items</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[12px] border border-[#e8f0e8] shadow-sm">
                    <p className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-3">PostEx Status</p>
                    <div className="flex items-center justify-between">
                        <StatusBadge label={order.isPostExBooked ? 'BOOKED' : 'UNBOOKED'} variant="postex" />
                        <span className="text-sm font-bold text-[#1a1a1a] font-mono">{order.postex?.trackingNumber || "---"}</span>
                    </div>
                </div>
            </div>

            {/* 3. TWO-COLUMN BODY */}
            <div className="px-8 pb-32 flex flex-col lg:flex-row gap-[2%] items-start">

                {/* LEFT COLUMN (58%) */}
                <div className="w-full lg:w-[58%] space-y-6">

                    {/* Items Manifest */}
                    <div className="bg-white rounded-[12px] border border-[#e8f0e8] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[#e8f0e8] flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <Box size={20} className="text-[#1a4a1a]" />
                                <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-sm">Items Manifest</h2>
                            </div>
                            <span className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest bg-[#f7fbf7] px-2 py-1 rounded">
                                {order.items?.length || 0} Products
                            </span>
                        </div>
                        <div className="p-6 space-y-6">
                            {order.items?.map((item, idx) => {
                                const editedItem = itemEdits[idx] || item;
                                const isEditing = !!itemEdits[idx];

                                return (
                                    <div key={idx} className="flex items-center gap-6 py-4 border-b border-neutral-50 last:border-0 group">
                                        <div className="w-[72px] h-[72px] rounded-[12px] bg-[#f7fbf7] border border-[#e8f0e8] overflow-hidden flex items-center justify-center shrink-0">
                                            {item.product?.images?.[0] ? <img src={item.product.images[0]} className="w-full h-full object-cover" /> : <Box size={28} className="text-[#6b7c6b]/30" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1a1a1a] truncate mb-2">{item.product?.title || 'Product'}</p>
                                            <div className="flex items-center gap-4">
                                                {/* Quantity Control */}
                                                <div className="flex items-center bg-[#f7fbf7] rounded-lg border border-[#e8f0e8] p-1">
                                                    <button
                                                        onClick={() => {
                                                            const newQty = Math.max(1, editedItem.quantity - 1);
                                                            updateLocalItem(idx, { quantity: newQty });
                                                            handleInputChange(idx, 'quantity', newQty.toString());
                                                            handleInputChange(idx, 'total', (editedItem.price * newQty).toString());
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center text-[#1a4a1a] hover:bg-white rounded transition-all font-bold"
                                                    >-</button>
                                                    <input
                                                        type="number"
                                                        className="w-8 bg-transparent outline-none text-[11px] font-bold text-center no-spin"
                                                        value={inputStates[`${idx}-quantity`] !== undefined ? inputStates[`${idx}-quantity`] : editedItem.quantity}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            handleInputChange(idx, 'quantity', val);
                                                            const num = parseInt(val);
                                                            if (!isNaN(num) && num > 0) updateLocalItem(idx, { quantity: num });
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newQty = editedItem.quantity + 1;
                                                            updateLocalItem(idx, { quantity: newQty });
                                                            handleInputChange(idx, 'quantity', newQty.toString());
                                                            handleInputChange(idx, 'total', (editedItem.price * newQty).toString());
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center text-[#1a4a1a] hover:bg-white rounded transition-all font-bold"
                                                    >+</button>
                                                </div>
                                                <span className="text-neutral-300">×</span>
                                                {/* Price Control */}
                                                <div className="flex items-center gap-1 bg-white border border-[#e8f0e8] px-2 py-1 rounded-lg">
                                                    <span className="text-[10px] font-bold text-neutral-400">Rs.</span>
                                                    <input
                                                        type="number"
                                                        className="w-16 bg-transparent outline-none text-[11px] font-bold no-spin"
                                                        value={inputStates[`${idx}-price`] !== undefined ? inputStates[`${idx}-price`] : editedItem.price}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            handleInputChange(idx, 'price', val);
                                                            const num = parseFloat(val);
                                                            if (!isNaN(num)) updateLocalItem(idx, { price: num });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Line Total</p>
                                                <p className="text-sm font-bold text-[#1a4a1a]">Rs. {editedItem.price * editedItem.quantity}</p>
                                            </div>
                                            {isEditing && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => saveItemEdit(idx)} disabled={isDraftSaving} className="p-1.5 bg-[#1a4a1a] text-white rounded-md shadow-sm hover:scale-105 transition-all">
                                                        {isDraftSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                                                    </button>
                                                    <button onClick={() => cancelItemEdit(idx)} className="p-1.5 bg-neutral-100 text-neutral-400 rounded-md hover:bg-neutral-200 transition-all">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="mt-8 pt-6 border-t border-[#e8f0e8] space-y-2">
                                <div className="flex justify-between text-xs font-bold text-[#6b7c6b] uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span>Rs. {order.totalAmount - (order.shippingFee || 0)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-[#6b7c6b] uppercase tracking-widest">
                                    <span>Shipping Logistics</span>
                                    <span>Rs. {order.shippingFee || 0}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-[#2d6a2d] pt-4 border-t border-[#e8f0e8]">
                                    <span className="uppercase tracking-tighter">Total Valuation</span>
                                    <span>Rs. {order.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Timeline */}
                    <div className="bg-white rounded-[12px] border border-[#e8f0e8] shadow-sm">
                        <div className="p-6 border-b border-[#e8f0e8] flex items-center gap-3">
                            <Clock size={20} className="text-[#1a4a1a]" />
                            <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-sm">Operational Timeline</h2>
                        </div>
                        <div className="p-8">
                            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e8f0e8]">
                                {[
                                    { label: "Order Created", date: order.createdAt, dot: "bg-[#1a4a1a]" },
                                    order.paidAt && { label: "Payment Received", date: order.paidAt, dot: "bg-[#2d6a2d]" },
                                    order.fulfilledAt && { label: "Order Fulfilled", date: order.fulfilledAt, dot: "bg-[#2d6a2d]" },
                                    order.postex?.bookedAt && { label: "PostEx Shipment Booked", date: order.postex.bookedAt, dot: "bg-[#1a4a1a]" },
                                    order.cancelledAt && { label: "Order Cancelled", date: order.cancelledAt, dot: "bg-[#dc3545]" },
                                ].filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)).map((event, idx) => (
                                    <div key={idx} className="relative pl-10">
                                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white ${event.dot} shadow-sm z-10`} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#1a1a1a]">{event.label}</span>
                                            <span className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest mt-1">
                                                {format(new Date(event.date), 'MMM dd, yyyy • HH:mm')} ({formatDistanceToNow(new Date(event.date))} ago)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div className="bg-white rounded-[12px] border border-[#e8f0e8] shadow-sm">
                        <div className="p-6 border-b border-[#e8f0e8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User size={20} className="text-[#1a4a1a]" />
                                <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-sm">Customer & Shipping</h2>
                            </div>
                            {isGlobalEditing && (
                                <Button onClick={handleSaveAll} loading={actionLoading.save_all} className="bg-[#1a4a1a] h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg shadow-[#1a4a1a]/20">Save Changes</Button>
                            )}
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div className="space-y-1">
                                <EditableField label="Full Name" value={order.customerName || order.shippingAddress?.fullName} path="customerName" />
                                <EditableField label="Phone Number" value={order.customerPhone || order.shippingAddress?.phone} path="customerPhone" />
                                <EditableField label="Email Address" value={order.user?.email || order.shippingAddress?.email} path="user.email" />
                            </div>
                            <div className="space-y-1">
                                <EditableField label="City" value={order.cityName || order.shippingAddress?.city} path="cityName" />
                                <EditableField label="Street Address" value={order.deliveryAddress || (order.shippingAddress?.street || order.shippingAddress?.address)} path="deliveryAddress" type="textarea" />
                                <EditableField label="Notes / Landmarks" value={order.shippingAddress?.nearestPlace} path="shippingAddress.nearestPlace" />
                            </div>
                        </div>
                    </div>

                    {/* Internal Staff Note Component (Standardized) */}
                    <div className="bg-white rounded-[12px] border border-[#e8f0e8] shadow-sm">
                        <div className="p-6 border-b border-[#e8f0e8] flex items-center gap-3">
                            <StickyNote size={20} className="text-orange-600" />
                            <h2 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-sm">Internal Instruction</h2>
                        </div>
                        <div className="p-6">
                            <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100 mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl text-orange-600 flex items-center justify-center shadow-inner">
                                        <StickyNote size={18} />
                                    </div>
                                    <h3 className="font-bold text-orange-900 uppercase tracking-widest text-[10px]">Current Instruction</h3>
                                </div>
                                <p className="text-sm text-orange-800 font-medium italic leading-relaxed">
                                    {order.transactionNotes || "No internal instructions set for this order."}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <textarea
                                    className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-200 resize-none h-24 transition-all"
                                    placeholder="Enter internal shipping instructions..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                                <Button
                                    onClick={async () => {
                                        if (!newNote) return;
                                        await handleSaveField('transactionNotes', newNote);
                                        setNewNote("");
                                    }}
                                    loading={actionLoading.save_field}
                                    className="bg-orange-600 hover:bg-orange-700 text-white h-auto px-6 text-[10px] font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-600/20 transition-all active:scale-95 self-stretch"
                                >
                                    Update Note
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (40%) */}
                <div className="w-full lg:w-[40%] space-y-6">

                    {/* PostEx Booking Panel */}
                    <div className={`rounded-[12px] border shadow-md overflow-hidden transition-all ${order.isPostExBooked ? 'bg-[#f7fbf7] border-[#d4edda]' : 'bg-white border-[#1a4a1a]/20'}`}>
                        <div className="p-6 border-b border-inherit bg-inherit">
                            <div className="flex items-center gap-3">
                                <Truck size={24} className={order.isPostExBooked ? 'text-[#155724]' : 'text-[#1a4a1a]'} />
                                <div>
                                    <h2 className={`font-bold text-sm uppercase tracking-[0.2em] ${order.isPostExBooked ? 'text-[#155724]' : 'text-[#1a1a1a]'}`}>
                                        {order.isPostExBooked ? 'Shipment Booked' : 'Ready to Book with PostEx'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-[#6b7c6b] uppercase mt-1 tracking-widest opacity-60">
                                        Powered by PostEx COD API
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {order.isPostExBooked && (
                                <div className="bg-white p-4 rounded-xl border border-[#d4edda] space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-[#6b7c6b] uppercase tracking-widest mb-1">Tracking Number</p>
                                        <p className="text-xl font-mono font-bold text-[#155724]">{order.postex?.trackingNumber}</p>
                                    </div>
                                    <a href={`https://postex.pk/tracking?trackingId=${order.postex?.trackingNumber}`} target="_blank"
                                        className="flex items-center gap-1 text-[10px] font-bold text-[#1a4a1a] uppercase tracking-widest hover:underline">
                                        Open Tracking Page <ExternalLink size={11}/>
                                    </a>
                                </div>
                            )}
                            <Button
                                onClick={() => setShowShipModal(true)}
                                disabled={order.orderStatus === 'cancelled'}
                                className={`w-full h-12 text-xs font-bold tracking-widest uppercase rounded-[8px] transition-all ${
                                    order.isPostExBooked
                                        ? 'border border-[#1a4a1a] text-[#1a4a1a] bg-transparent hover:bg-[#1a4a1a] hover:text-white'
                                        : 'bg-[#1a4a1a] text-white shadow-lg shadow-[#1a4a1a]/20 hover:bg-[#051712]'
                                }`}
                            >
                                <Truck size={14} className="mr-2 inline"/>
                                {order.isPostExBooked ? 'Re-book / Update Shipment' : 'Ship with PostEx'}
                            </Button>
                            {order.orderStatus === 'cancelled' && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">Cannot ship a cancelled order</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ship with PostEx Modal */}
            {showShipModal && (
                <ShipWithPostExModal
                    order={order}
                    onClose={() => setShowShipModal(false)}
                    onSuccess={() => fetchOrder()}
                />
            )}

            {/* 4. STICKY BOTTOM ACTION BAR */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-[#f7fbf7] border-t-[1.5px] border-[#e8f0e8] px-8 py-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowCancelModal(true)}
                        loading={actionLoading.cancel}
                        disabled={order.orderStatus === 'cancelled'}
                        className="h-10 px-6 border-[#dc3545] text-[#dc3545] bg-transparent text-xs font-bold tracking-widest uppercase rounded-[8px] hover:bg-[#dc3545] hover:text-white transition-all"
                    >
                        Cancel Order
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    {order.paymentStatus !== 'paid' && (
                        <Button
                            onClick={() => performAction('pay', `/orders/${order._id}`, 'PATCH', { paymentStatus: 'paid', paidAt: new Date() })}
                            loading={actionLoading.pay}
                            className="h-10 px-8 bg-[#1a4a1a] text-white text-xs font-bold tracking-widest uppercase rounded-[8px] shadow-sm hover:bg-[#051712]"
                        >
                            Mark as Paid
                        </Button>
                    )}

                    {['shipped', 'delivered', 'fulfilled'].includes(order.orderStatus) ? (
                        <Button
                            variant="outline"
                            onClick={() => performAction('unfulfill', `/orders/${order._id}`, 'PATCH', { orderStatus: 'processing', fulfilledAt: null })}
                            loading={actionLoading.unfulfill}
                            className="h-10 px-8 border-[#1a4a1a] text-[#1a4a1a] text-xs font-bold tracking-widest uppercase rounded-[8px]"
                        >
                            Unfulfill
                        </Button>
                    ) : (
                        <Button
                            onClick={() => performAction('fulfill', `/orders/${order._id}`, 'PATCH', { orderStatus: 'confirmed', fulfilledAt: new Date() })}
                            loading={actionLoading.fulfill}
                            className="h-10 px-8 bg-[#1a4a1a] text-white text-xs font-bold tracking-widest uppercase rounded-[8px] shadow-sm hover:bg-[#051712]"
                        >
                            Mark as Fulfilled
                        </Button>
                    )}
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl mx-4 animate-slideUp">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a1a] mb-2 text-center">Cancel this order?</h3>
                        <p className="text-sm text-[#6b7c6b] mb-8 text-center">This action will cancel the order and release allocated stock. This cannot be undone.</p>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 border-[#e8f0e8] text-[#6b7c6b] font-bold uppercase tracking-widest text-[10px] rounded-xl"
                                onClick={() => setShowCancelModal(false)}
                            >
                                No, Keep It
                            </Button>
                            <Button
                                className="flex-1 h-12 bg-[#dc3545] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#b02a37] rounded-xl shadow-lg shadow-red-500/20"
                                onClick={() => performAction('cancel', `/orders/${order._id}`, 'PATCH', { orderStatus: 'cancelled', cancelledAt: new Date() })}
                                loading={actionLoading.cancel}
                            >
                                Yes, Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
