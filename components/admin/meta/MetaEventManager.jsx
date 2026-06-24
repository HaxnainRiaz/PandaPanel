"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Activity, Globe, Server, CheckCircle2, Save, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaEventManager({ config, refresh }) {
    const { adminRequest } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [enabledEvents, setEnabledEvents] = useState(config?.enabledEvents || [
        'PageView', 'ViewContent', 'Search', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase'
    ]);

    const handleToggleEvent = (eventName) => {
        if (enabledEvents.includes(eventName)) {
            setEnabledEvents(enabledEvents.filter(e => e !== eventName));
        } else {
            setEnabledEvents([...enabledEvents, eventName]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await adminRequest("/meta/settings", "POST", { enabledEvents });
        if (res?.success) {
            toast.success("Event settings updated");
            refresh();
        } else {
            toast.error(res?.message || "Failed to save settings");
        }
        setLoading(false);
    };

    const events = [
        { name: 'PageView', desc: 'Fires on every page load', browser: true, server: true },
        { name: 'ViewContent', desc: 'Fires when a product page is viewed', browser: true, server: true },
        { name: 'Search', desc: 'Fires when a user searches for products', browser: true, server: true },
        { name: 'AddToCart', desc: 'Fires when a product is added to cart', browser: true, server: true },
        { name: 'InitiateCheckout', desc: 'Fires when the checkout process starts', browser: true, server: true },
        { name: 'AddPaymentInfo', desc: 'Fires when payment info is entered', browser: true, server: true },
        { name: 'Purchase', desc: 'Fires on order success page', browser: true, server: true, critical: true },
    ];

    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#0a4019]">Event Manager</h2>
                            <p className="text-sm text-neutral-500">Enable or disable specific tracking events.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#0a4019] text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-[#051712] transition-all"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>

                <div className="overflow-hidden border border-neutral-100 rounded-3xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Event Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Browser</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Server</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">Enable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {events.map((event) => (
                                <tr key={event.name} className="group hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#0a4019] text-sm flex items-center gap-2">
                                                {event.name}
                                                {event.critical && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tighter">Critical</span>}
                                            </span>
                                            <span className="text-xs text-neutral-400">{event.desc}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <div className={`p-1.5 rounded-lg ${event.browser ? 'text-[#0a4019] bg-neutral-100' : 'text-neutral-200'}`}>
                                                <Globe size={16} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <div className={`p-1.5 rounded-lg ${event.server ? 'text-[#0a4019] bg-neutral-100' : 'text-neutral-200'}`}>
                                                <Server size={16} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => handleToggleEvent(event.name)}
                                                className={`w-10 h-5 rounded-full transition-all relative ${enabledEvents.includes(event.name) ? 'bg-green-500' : 'bg-neutral-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabledEvents.includes(event.name) ? 'left-5.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-neutral-50 p-8 rounded-[2rem] border border-neutral-100">
                <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest mb-4 italic">Event Data Payload</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <PayloadCard 
                        title="User Data" 
                        fields={['Email', 'Phone', 'IP Address', 'User Agent', 'FBP/FBC Cookies']} 
                    />
                    <PayloadCard 
                        title="Order Data" 
                        fields={['Order ID', 'Total Value', 'Currency', 'Items Count']} 
                    />
                    <PayloadCard 
                        title="Product Data" 
                        fields={['SKU / Product ID', 'Category', 'Quantity', 'Price']} 
                    />
                </div>
            </div>
        </div>
    );
}

function PayloadCard({ title, fields }) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#B8A68A] uppercase tracking-widest">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {fields.map(f => (
                    <span key={f} className="text-[10px] font-medium text-neutral-500 bg-white border border-neutral-200 px-2 py-1 rounded-lg">
                        {f}
                    </span>
                ))}
            </div>
        </div>
    );
}
