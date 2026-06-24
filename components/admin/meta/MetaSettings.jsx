"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Shield, Zap, Target, Save, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaSettings({ config, refresh }) {
    const { adminRequest } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        dataSharingLevel: config?.dataSharingLevel || "standard",
        isPixelEnabled: config?.isPixelEnabled ?? true,
        isCapiEnabled: config?.isCapiEnabled ?? false,
        automaticAdvancedMatching: config?.automaticAdvancedMatching ?? true,
        deduplicationEnabled: config?.deduplicationEnabled ?? true,
    });

    const handleSave = async () => {
        setLoading(true);
        const res = await adminRequest("/meta/settings", "POST", settings);
        if (res?.success) {
            toast.success("Settings saved successfully");
            refresh();
        } else {
            toast.error(res?.message || "Failed to save settings");
        }
        setLoading(false);
    };

    const levels = [
        { 
            id: "standard", 
            title: "Standard", 
            icon: Shield, 
            desc: "Browser Pixel tracking only. Recommended for basic reporting.",
            color: "blue"
        },
        { 
            id: "enhanced", 
            title: "Enhanced", 
            icon: Zap, 
            desc: "Pixel + Server-side Purchase tracking. Improves order attribution accuracy.",
            color: "orange"
        },
        { 
            id: "maximum", 
            title: "Maximum", 
            icon: Target, 
            desc: "Pixel + Full Conversions API for all events. Best for ad optimization and ROI.",
            color: "green"
        }
    ];

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <h2 className="text-xl font-bold text-[#0a4019] mb-2">Data Sharing Level</h2>
                <p className="text-sm text-neutral-500 mb-8">Choose how much customer data you want to share with Meta to optimize your ads.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {levels.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setSettings({ ...settings, dataSharingLevel: level.id })}
                            className={`
                                relative p-6 rounded-3xl border-2 text-left transition-all
                                ${settings.dataSharingLevel === level.id 
                                    ? "border-[#0a4019] bg-[#0a4019]/5" 
                                    : "border-neutral-100 hover:border-neutral-200 bg-white"}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 
                                ${settings.dataSharingLevel === level.id ? 'bg-[#0a4019] text-white' : 'bg-neutral-50 text-neutral-400'}`}>
                                <level.icon size={20} />
                            </div>
                            <h3 className="font-bold text-[#0a4019] mb-2">{level.title}</h3>
                            <p className="text-[11px] text-neutral-500 leading-relaxed mb-8">{level.desc}</p>
                            {settings.dataSharingLevel === level.id && (
                                <div className="absolute bottom-6 right-6">
                                    <CheckCircle2 size={20} className="text-[#0a4019]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <h2 className="text-xl font-bold text-[#0a4019] mb-6">Tracking Configuration</h2>
                
                <div className="space-y-6">
                    <ToggleItem 
                        title="Meta Pixel" 
                        desc="Track customer behavior in the browser."
                        checked={settings.isPixelEnabled}
                        onChange={(val) => setSettings({ ...settings, isPixelEnabled: val })}
                    />
                    <ToggleItem 
                        title="Conversions API" 
                        desc="Send events directly from our server to Meta for better reliability."
                        checked={settings.isCapiEnabled}
                        onChange={(val) => setSettings({ ...settings, isCapiEnabled: val })}
                    />
                    <ToggleItem 
                        title="Automatic Advanced Matching" 
                        desc="Share customer email and phone (hashed) to improve attribution."
                        checked={settings.automaticAdvancedMatching}
                        onChange={(val) => setSettings({ ...settings, automaticAdvancedMatching: val })}
                    />
                    <ToggleItem 
                        title="Event Deduplication" 
                        desc="Prevent duplicate events when using both Pixel and CAPI."
                        checked={settings.deduplicationEnabled}
                        onChange={(val) => setSettings({ ...settings, deduplicationEnabled: val })}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#0a4019] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#051712] transition-all disabled:opacity-50 shadow-lg shadow-[#0a4019]/20"
                >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Settings
                </button>
            </div>
        </div>
    );
}

function ToggleItem({ title, desc, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors">
            <div>
                <p className="font-bold text-[#0a4019] text-sm">{title}</p>
                <p className="text-xs text-neutral-500">{desc}</p>
            </div>
            <button 
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-green-500' : 'bg-neutral-200'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function RefreshCw({ className, size }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}
