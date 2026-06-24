"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import toast from 'react-hot-toast';
import { Truck, X, Loader2, AlertCircle } from 'lucide-react';

export default function ShipWithPostExModal({ order, onClose, onSuccess }) {
    const { adminRequest } = useAdmin();
    const [cities, setCities] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [forceRebook, setForceRebook] = useState(false);

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        cityName: '',
        deliveryAddress: '',
        invoicePayment: '',
        items: '',
        orderType: 'Normal',
        pickupAddressCode: '',
        storeAddressCode: '',
        transactionNotes: '',
        invoiceDivision: 1
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const [statusRes, citiesRes, addrRes] = await Promise.all([
                adminRequest('/postex/status'),
                adminRequest('/postex/cities'),
                adminRequest('/postex/pickup-addresses')
            ]);
            if (statusRes?.success) setStatus(statusRes.data);
            if (citiesRes?.success) setCities(citiesRes.data || []);
            if (addrRes?.success) setAddresses(addrRes.data || []);

            // Pre-fill from order
            if (order) {
                setForm(prev => ({
                    ...prev,
                    customerName: order.customerName || order.shippingAddress?.fullName || '',
                    customerPhone: order.customerPhone || order.shippingAddress?.phone || '',
                    cityName: order.cityName || order.shippingAddress?.city || '',
                    deliveryAddress: order.deliveryAddress || [order.shippingAddress?.street, order.shippingAddress?.city].filter(Boolean).join(', '),
                    invoicePayment: order.paymentStatus === 'paid' ? 0 : (order.totalAmount || ''),
                    items: (order.items || []).reduce((acc, i) => acc + i.quantity, 0),
                    transactionNotes: order.transactionNotes || '',
                    pickupAddressCode: statusRes?.data?.defaultPickupAddressCode || (addrRes?.data?.find(a => a.addressType === 'Pickup Address')?.addressCode) || '',
                    storeAddressCode: statusRes?.data?.defaultStoreAddressCode || ''
                }));
            }
            setLoading(false);
        };
        init();
    }, [order]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await adminRequest('/postex/create-shipment', 'POST', {
            orderId: order._id,
            ...form,
            invoicePayment: Number(form.invoicePayment),
            items: Number(form.items),
            invoiceDivision: Number(form.invoiceDivision),
            forceRebook
        });
        if (res?.success) {
            toast.success(`Booked! Tracking: ${res.data?.shipment?.postexTrackingNumber}`);
            onSuccess?.(res.data);
            onClose();
        } else {
            toast.error(res?.message || 'Booking failed');
        }
        setSubmitting(false);
    };

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#F5F3F0]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0a4019] flex items-center justify-center">
                            <Truck size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0a4019] uppercase tracking-widest text-sm">Ship with PostEx</h2>
                            <p className="text-xs text-neutral-400">{order?.orderNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                        <X size={16} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16"><Loader2 className="animate-spin text-[#0a4019]" size={28} /></div>
                ) : !status?.isConnected ? (
                    <div className="p-8 text-center">
                        <AlertCircle size={36} className="mx-auto mb-3 text-orange-400" />
                        <p className="font-bold text-sm text-neutral-700 mb-1">PostEx Not Connected</p>
                        <p className="text-xs text-neutral-500">Please connect your PostEx account in <strong>PostEx → Settings</strong> first.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {order?.isPostExBooked && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
                                <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-700">Already booked on PostEx</p>
                                    <p className="text-xs text-amber-600">Tracking: {order.postex?.trackingNumber}</p>
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                        <input type="checkbox" checked={forceRebook} onChange={e => setForceRebook(e.target.checked)} className="rounded" />
                                        <span className="text-xs text-amber-700 font-medium">Create another shipment anyway</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Customer Name" required>
                                <input value={form.customerName} onChange={e => set('customerName', e.target.value)} required className={inputCls} />
                            </Field>
                            <Field label="Phone" required>
                                <input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="03XXXXXXXXX" required className={inputCls} />
                            </Field>
                        </div>

                        <Field label="City" required>
                            <select value={form.cityName} onChange={e => set('cityName', e.target.value)} required className={inputCls}>
                                <option value="">Select city…</option>
                                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </Field>

                        <Field label="Delivery Address" required>
                            <textarea value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} rows={2} required className={inputCls} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="COD Amount (Rs.)" required>
                                <input type="number" value={form.invoicePayment} onChange={e => set('invoicePayment', e.target.value)} required min={0} className={inputCls} />
                            </Field>
                            <Field label="Items Count" required>
                                <input type="number" value={form.items} onChange={e => set('items', e.target.value)} required min={1} className={inputCls} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Order Type">
                                <select value={form.orderType} onChange={e => set('orderType', e.target.value)} className={inputCls}>
                                    <option>Normal</option>
                                    <option>Reverse</option>
                                    <option>Replacement</option>
                                </select>
                            </Field>
                            <Field label="Invoice Division">
                                <input type="number" value={form.invoiceDivision} onChange={e => set('invoiceDivision', e.target.value)} min={1} className={inputCls} />
                            </Field>
                        </div>

                        <Field label="Pickup Address">
                            <select value={form.pickupAddressCode} onChange={e => set('pickupAddressCode', e.target.value)} className={inputCls}>
                                <option value="">— None —</option>
                                {addresses.sort((a, b) => (b.addressType === 'Pickup Address' ? 1 : -1)).map(a => (
                                    <option key={a.addressCode} value={a.addressCode}>
                                        {a.addressType === 'Pickup Address' ? '📦 ' : '🏠 '}
                                        {a.address} ({a.cityName}) — {a.addressType}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Notes / Remarks">
                            <input value={form.transactionNotes} onChange={e => set('transactionNotes', e.target.value)} className={inputCls} />
                        </Field>

                        <div className="pt-2 flex gap-3">
                            <button type="submit" disabled={submitting || (order?.isPostExBooked && !forceRebook)}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#0a4019] text-white rounded-xl py-3 text-sm font-bold hover:bg-[#0a4019]/90 disabled:opacity-50 transition-all">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                                {submitting ? 'Booking…' : 'Book Shipment'}
                            </button>
                            <button type="button" onClick={onClose} className="border border-neutral-200 rounded-xl px-5 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const inputCls = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20 focus:border-[#0a4019]";

function Field({ label, required, children }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}
