"use client";

import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { useState, useEffect } from "react";
import { TicketPercent, Plus, Trash2, Copy, Check, X, Save, Calendar, DollarSign, Zap, ChevronDown, Package, ShoppingCart, Gift } from "lucide-react";
import { Input, Dropdown, Button, MultiSelect } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export default function DiscountsPage() {
    const { coupons, addCoupon, deleteCoupon, updateSettings, settings, loading, products } = useAdmin();
    const { addToast } = useToast();
    const [copiedId, setCopiedId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [newDiscount, setNewDiscount] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minAmount: "",
        expiresAt: "",
        bundleProducts: [],
        buyXGetY: {
            buyQty: 2,
            getQty: 1,
            discountType: "free",
            discountValue: 0,
            buyProducts: [],
            getProducts: []
        },
        quantityDiscount: {
            minQty: 3,
            discountValue: 20,
            products: []
        }
    });

    const [shippingSettings, setShippingSettings] = useState({
        fee: 200,
        freeShippingEnabled: false,
        freeShippingThreshold: 5000,
        freeShippingQuantityThreshold: 0,
        freeShippingMode: 'either'
    });

    // Fetch initial settings from context
    useEffect(() => {
        if (settings && settings.shipping) {
            setShippingSettings(settings.shipping);
        }
    }, [settings]);

    const handleSaveShipping = async () => {
        const res = await updateSettings({ shipping: shippingSettings });
        if (res?.success) {
            addToast('Logistics protocols updated successfully', 'success');
        } else {
            addToast('Failed to update logistics protocols', 'error');
        }
    };

    const handleCopy = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        let couponData = {
            ...newDiscount,
            discountValue: Number(newDiscount.discountValue || 0),
            minAmount: Number(newDiscount.minAmount || 0),
        };

        // Cleanup based on type
        if (newDiscount.discountType === 'bundle') {
            couponData.discountValue = 0;
            couponData.bundleProducts = newDiscount.bundleProducts.map(id => ({ product: id, quantity: 1 }));
        } else if (newDiscount.discountType === 'buy_x_get_y') {
            couponData.discountValue = 0;
            // Ensure products are passed correctly
        } else if (newDiscount.discountType === 'quantity_discount') {
            couponData.discountValue = 0;
        } else if (newDiscount.discountType === 'free_shipping') {
            couponData.discountValue = 0;
        }

        const success = await addCoupon(couponData);
        if (success?.success) {
            setShowModal(false);
            setNewDiscount({ 
                code: "", discountType: "percentage", discountValue: "", minAmount: "", expiresAt: "", 
                bundleProducts: [], 
                buyXGetY: { buyQty: 2, getQty: 1, discountType: "free", discountValue: 0, buyProducts: [], getProducts: [] },
                quantityDiscount: { minQty: 3, discountValue: 20, products: [] }
            });
            addToast('New promotion forged successfully', 'success');
        } else {
            addToast(success?.message || 'Failed to authorize coupon', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Initializing Perks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Promotions</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Deploy automated incentives across the estate</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-[#0a4019] text-[#d3d3d3] px-8 py-4 rounded-2xl hover:bg-[#051712] transition-all shadow-xl shadow-[#0a4019]/10 font-bold text-xs uppercase tracking-widest active:scale-95"
                >
                    <Plus size={18} />
                    <span>Generate Code</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {coupons.length > 0 ? (
                    coupons.map((discount) => (
                        <div key={discount._id} className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] group hover:shadow-[0_16px_60px_rgba(11,47,38,0.15)] transition-all duration-500 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d3d3d3] to-[#B8A68A]" />

                            <div className="flex items-start justify-between mb-8">
                                <div className="p-4 bg-[#d3d3d3]/10 rounded-2xl text-[#0a4019] border border-[#d3d3d3]/20 shadow-inner">
                                    {discount.discountType === 'bundle' ? <Package size={28} /> : 
                                     discount.discountType === 'buy_x_get_y' ? <Gift size={28} /> :
                                     discount.discountType === 'quantity_discount' ? <ShoppingCart size={28} /> :
                                     <TicketPercent size={28} />}
                                </div>
                                <span className={`
                                    px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border shadow-sm
                                    ${discount.discountType === 'percentage' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                      discount.discountType === 'bundle' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                      discount.discountType === 'buy_x_get_y' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                      discount.discountType === 'quantity_discount' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-green-50 text-green-700 border-green-100'}
                                `}>
                                    {discount.discountType.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-3xl font-bold text-[#0a4019] tracking-widest font-heading italic">{discount.code}</h3>
                                    <button
                                        onClick={() => handleCopy(discount.code, discount._id)}
                                        className="p-2 text-neutral-300 hover:text-[#d3d3d3] transition-all hover:bg-neutral-50 rounded-xl"
                                    >
                                        {copiedId === discount._id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-[#d3d3d3]" />
                                    <p className="text-[#6B6B6B] text-xs font-bold uppercase tracking-wider">
                                        {discount.discountType === 'percentage' ? `${discount.discountValue}% Reduction` :
                                            discount.discountType === 'free_shipping' ? 'Complimentary Logistics' :
                                            discount.discountType === 'bundle' ? `${discount.bundleProducts?.length || 0} Assets Linked` :
                                            discount.discountType === 'buy_x_get_y' ? `Buy ${discount.buyXGetY?.buyQty} Get ${discount.buyXGetY?.getQty} ${discount.buyXGetY?.discountType}` :
                                            discount.discountType === 'quantity_discount' ? `${discount.quantityDiscount?.discountValue}% off ${discount.quantityDiscount?.minQty}+ items` :
                                                `${formatPrice(discount.discountValue)} Credit`}
                                    </p>
                                </div>
                            </div>

                            {discount.discountType === 'bundle' && discount.bundleProducts && (
                                <div className="mb-6 space-y-2">
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Included Assets</p>
                                    <div className="flex flex-wrap gap-2">
                                        {discount.bundleProducts.map((bp, i) => (
                                            <span key={i} className="text-[10px] bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-lg text-[#0a4019] font-medium">
                                                {bp.product?.title || 'Unknown Product'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-8 border-t border-[#F5F3F0]/50 mt-auto">
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <DollarSign size={12} />
                                        <span>Minimum Spend</span>
                                    </div>
                                    <span className="text-[#0a4019]">{formatPrice(discount.minAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <Calendar size={12} />
                                        <span>Expiration</span>
                                    </div>
                                    <span className="text-[#0a4019]">{new Date(discount.expiresAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    const res = await deleteCoupon(discount._id);
                                    if (res?.success) addToast('Promotion terminated', 'info');
                                }}
                                className="mt-8 w-full py-3 text-red-400 hover:text-white hover:bg-red-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl border border-red-100 hover:border-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                                Terminate Reward
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-40 text-center bg-[#FDFCFB]/20 rounded-[3rem] border-2 border-dashed border-[#F5F3F0]">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_4px_20px_rgba(11,47,38,0.08)]">
                            <TicketPercent className="text-neutral-200" size={32} />
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-[#0a4019]">No Active Promotions</h3>
                        <p className="text-[#6B6B6B] text-sm mt-2 font-medium">Create your first incentive code to drive estate conversion.</p>
                    </div>
                )}
            </div>

            {/* Create Code Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a4019]/40 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-6 lg:p-8 shadow-[0_16px_60px_rgba(11,47,38,0.15)] border border-white animate-scaleIn relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d3d3d3]/10 rounded-full -mr-24 -mt-24" />

                        <div className="flex justify-between items-start relative">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#0a4019] italic">Forge Reward</h2>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.3em] mt-2">Promotional Engine v3.0</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-neutral-50 rounded-full transition-colors text-neutral-300">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 md:space-y-6 relative max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <Input
                                    label="Identity Code (UPPERCASE) *"
                                    required
                                    value={newDiscount.code}
                                    onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMERBOGO"
                                    className="md:col-span-2"
                                />

                                <Dropdown
                                    label="Discount Logic"
                                    value={newDiscount.discountType}
                                    onChange={e => setNewDiscount({ ...newDiscount, discountType: e.target.value })}
                                    options={[
                                        { value: "percentage", label: "Percentage (%)" },
                                        { value: "fixed", label: "Fixed Amount (PKR)" },
                                        { value: "free_shipping", label: "Free Shipping" },
                                        { value: "bundle", label: "Fixed Bundle (Fixed Products)" },
                                        { value: "buy_x_get_y", label: "Buy X Get Y (BOGO / Deals)" },
                                        { value: "quantity_discount", label: "Quantity Discount (Bulk)" }
                                    ]}
                                />

                                {/* Standard Discount Value */}
                                {['percentage', 'fixed'].includes(newDiscount.discountType) && (
                                    <Input
                                        label="Discount Value *"
                                        type="number"
                                        required
                                        value={newDiscount.discountValue}
                                        onChange={e => setNewDiscount({ ...newDiscount, discountValue: e.target.value })}
                                        placeholder="20"
                                    />
                                )}

                                {/* Bundle Products */}
                                {newDiscount.discountType === 'bundle' && (
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-[#0a4019] uppercase tracking-widest block mb-4">Linked Products *</label>
                                        <MultiSelect
                                            options={products.map(p => ({ label: p.title, value: p._id }))}
                                            value={newDiscount.bundleProducts}
                                            onChange={(vals) => setNewDiscount({ ...newDiscount, bundleProducts: vals })}
                                            placeholder="Select bundle contents..."
                                        />
                                    </div>
                                )}

                                {/* Buy X Get Y */}
                                {newDiscount.discountType === 'buy_x_get_y' && (
                                    <div className="md:col-span-2 space-y-6 p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Buy Quantity"
                                                type="number"
                                                value={newDiscount.buyXGetY.buyQty}
                                                onChange={e => setNewDiscount({ ...newDiscount, buyXGetY: { ...newDiscount.buyXGetY, buyQty: Number(e.target.value) }})}
                                            />
                                            <Input
                                                label="Get Quantity"
                                                type="number"
                                                value={newDiscount.buyXGetY.getQty}
                                                onChange={e => setNewDiscount({ ...newDiscount, buyXGetY: { ...newDiscount.buyXGetY, getQty: Number(e.target.value) }})}
                                            />
                                        </div>
                                        <Dropdown
                                            label="Reward Type"
                                            value={newDiscount.buyXGetY.discountType}
                                            onChange={e => setNewDiscount({ ...newDiscount, buyXGetY: { ...newDiscount.buyXGetY, discountType: e.target.value }})}
                                            options={[
                                                { value: "free", label: "Free" },
                                                { value: "percentage", label: "Percentage Off" },
                                                { value: "fixed", label: "Fixed Discount" }
                                            ]}
                                        />
                                        {newDiscount.buyXGetY.discountType !== 'free' && (
                                            <Input
                                                label="Reward Value"
                                                type="number"
                                                value={newDiscount.buyXGetY.discountValue}
                                                onChange={e => setNewDiscount({ ...newDiscount, buyXGetY: { ...newDiscount.buyXGetY, discountValue: Number(e.target.value) }})}
                                            />
                                        )}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Applicable Products (Buy)</label>
                                            <MultiSelect
                                                options={products.map(p => ({ label: p.title, value: p._id }))}
                                                value={newDiscount.buyXGetY.buyProducts}
                                                onChange={(vals) => setNewDiscount({ ...newDiscount, buyXGetY: { ...newDiscount.buyXGetY, buyProducts: vals }})}
                                                placeholder="All Products (Leave empty for all)"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Discount */}
                                {newDiscount.discountType === 'quantity_discount' && (
                                    <div className="md:col-span-2 space-y-6 p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Min. Quantity"
                                                type="number"
                                                value={newDiscount.quantityDiscount.minQty}
                                                onChange={e => setNewDiscount({ ...newDiscount, quantityDiscount: { ...newDiscount.quantityDiscount, minQty: Number(e.target.value) }})}
                                            />
                                            <Input
                                                label="Discount (%)"
                                                type="number"
                                                value={newDiscount.quantityDiscount.discountValue}
                                                onChange={e => setNewDiscount({ ...newDiscount, quantityDiscount: { ...newDiscount.quantityDiscount, discountValue: Number(e.target.value) }})}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Eligible Products</label>
                                            <MultiSelect
                                                options={products.map(p => ({ label: p.title, value: p._id }))}
                                                value={newDiscount.quantityDiscount.products}
                                                onChange={(vals) => setNewDiscount({ ...newDiscount, quantityDiscount: { ...newDiscount.quantityDiscount, products: vals }})}
                                                placeholder="All Products (Leave empty for all)"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Input
                                    label="Min. Spend Threshold"
                                    type="number"
                                    value={newDiscount.minAmount}
                                    onChange={e => setNewDiscount({ ...newDiscount, minAmount: e.target.value })}
                                    placeholder="0"
                                />

                                <Input
                                    label="Expiration Protocol *"
                                    type="date"
                                    required
                                    value={newDiscount.expiresAt}
                                    onChange={e => setNewDiscount({ ...newDiscount, expiresAt: e.target.value })}
                                />
                            </div>

                            <div className="pt-8 flex gap-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 rounded-2xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 py-5 rounded-2xl shadow-2xl shadow-[#0a4019]/20"
                                >
                                    Forge Promotion
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Logistics Configuration */}
            <div className="bg-white rounded-[3rem] p-10 shadow-[0_4px_30px_rgba(11,47,38,0.06)] border border-[#F5F3F0] animate-fadeInUp">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-[#0a4019] text-[#d3d3d3] rounded-2xl">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-[#0a4019] italic">Logistics Protocols</h2>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Configure automated shipping logic</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-[#0a4019] uppercase tracking-widest block">Standard Shipping Fee</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0a4019] font-bold">Rs</span>
                            <input
                                type="number"
                                value={shippingSettings.fee}
                                onChange={(e) => setShippingSettings({ ...shippingSettings, fee: Number(e.target.value) })}
                                className="w-full bg-[#FDFCFB] border-2 border-[#F5F3F0] rounded-2xl py-4 pl-12 pr-6 font-bold text-[#0a4019] outline-none transition-all group-hover:border-[#0a4019]/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-[#0a4019] uppercase tracking-widest block">Free Shipping Mode</label>
                        <div className="relative">
                            <select
                                value={shippingSettings.freeShippingMode}
                                onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingMode: e.target.value })}
                                className="w-full bg-[#FDFCFB] border-2 border-[#F5F3F0] rounded-2xl py-4 px-6 font-bold text-[#0a4019] outline-none appearance-none cursor-pointer"
                                disabled={!shippingSettings.freeShippingEnabled}
                            >
                                <option value="amount">Amount Threshold Only</option>
                                <option value="quantity">Quantity Threshold Only</option>
                                <option value="either">Either Amount or Quantity</option>
                                <option value="both">Both Amount and Quantity</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0a4019] pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => setShippingSettings({ ...shippingSettings, freeShippingEnabled: !shippingSettings.freeShippingEnabled })}
                            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border-2 ${shippingSettings.freeShippingEnabled
                                ? 'bg-[#0a4019] text-white border-[#0a4019]'
                                : 'bg-transparent text-[#6B6B6B] border-[#F5F3F0] hover:border-[#0a4019]/20'
                                }`}
                        >
                            {shippingSettings.freeShippingEnabled ? <Check size={16} /> : <X size={16} />}
                            <span>Free Shipping Logic: {shippingSettings.freeShippingEnabled ? 'ACTIVE' : 'DEACTIVATED'}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#F5F3F0] flex justify-end">
                    <button
                        onClick={handleSaveShipping}
                        className="bg-[#B8A68A] text-white px-10 py-4 rounded-2xl hover:bg-[#0a4019] transition-all font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#B8A68A]/20 flex items-center gap-3"
                    >
                        <Save size={18} />
                        Update Logistics Core
                    </button>
                </div>
            </div>
        </div>
    );
}
