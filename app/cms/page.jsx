"use client";

import { useAdmin } from "@/context/AdminContext";
import { Save, ToggleLeft, ToggleRight, LayoutTemplate, Type, Image as ImageIcon, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { Input, Button } from "@/components/ui";

export default function CMSPage() {
    const { settings, updateSettings, loading } = useAdmin();
    const [localSettings, setLocalSettings] = useState(null);

    useEffect(() => {
        if (settings) setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }, [settings]);

    const handleSave = async () => {
        await updateSettings(localSettings);
    };

    if (loading || !localSettings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Retrieving Brand Assets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Identity Forge</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Sculpt the digital presence and global messaging</p>
                </div>

                <Button
                    onClick={handleSave}
                    icon={Save}
                    className="px-8"
                >
                    Deploy Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Announcement Bar & Hero */}
                <div className="space-y-10">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d3d3d3]/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                        <h2 className="text-xl font-heading font-bold text-[#0a4019] mb-6 flex items-center gap-3">
                            <div className="p-2 bg-[#d3d3d3]/20 rounded-lg text-[#0a4019]"><LayoutTemplate size={18} /></div>
                            Global Herald
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Visibility Status</span>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, announcementBar: { ...localSettings.announcementBar, enabled: !localSettings.announcementBar.enabled } })}
                                    className={`transition-colors ${localSettings.announcementBar?.enabled ? "text-[#d3d3d3]" : "text-neutral-200"}`}
                                >
                                    {localSettings.announcementBar?.enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                </button>
                            </div>
                            <textarea
                                value={localSettings.announcementBar?.text || ""}
                                onChange={(e) => setLocalSettings({ ...localSettings, announcementBar: { ...localSettings.announcementBar, text: e.target.value } })}
                                rows={2}
                                className="w-full p-6 bg-white border border-[#F5F3F0] rounded-2xl shadow-sm hover:shadow-md resize-none font-medium text-[#0a4019] text-sm italic"
                                placeholder="Universal announcement text..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0]">
                        <h2 className="text-xl font-heading font-bold text-[#0a4019] mb-8 flex items-center gap-3">
                            <div className="p-2 bg-[#d3d3d3]/20 rounded-lg text-[#0a4019]"><ImageIcon size={18} /></div>
                            Hero Atmosphere
                        </h2>

                        <div className="space-y-6">
                            <Input
                                label="Main Headline"
                                value={localSettings.hero?.headline || ""}
                                onChange={(e) => setLocalSettings({ ...localSettings, hero: { ...localSettings.hero, headline: e.target.value } })}
                                className="italic font-heading"
                            />

                            <div>
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">Subtext Narrative</label>
                                <textarea
                                    value={localSettings.hero?.subHeadline || ""}
                                    onChange={(e) => setLocalSettings({ ...localSettings, hero: { ...localSettings.hero, subHeadline: e.target.value } })}
                                    rows={3}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl shadow-sm hover:shadow-md font-medium text-[#0a4019] text-sm leading-relaxed"
                                />
                            </div>

                            <Input
                                label="Hero Asset URL"
                                value={localSettings.hero?.image || ""}
                                onChange={(e) => setLocalSettings({ ...localSettings, hero: { ...localSettings.hero, image: e.target.value } })}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Toggles */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a4019] to-[#051712] opacity-10" />
                    <h2 className="text-2xl font-heading font-bold text-[#0a4019] mb-3 italic">Estate Architecture</h2>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-10 border-b border-[#F5F3F0] pb-4">Homepage Modular Control</p>

                    <div className="space-y-4">
                        {localSettings.homepageToggles && Object.entries(localSettings.homepageToggles).map(([key, isEnabled]) => (
                            <div key={key} className="flex items-center justify-between p-6 bg-[#FDFCFB]/5 border border-[#F5F3F0]/50 rounded-2xl hover:bg-[#FDFCFB] transition-all duration-300 group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${isEnabled ? 'bg-[#d3d3d3]/20 text-[#0a4019]' : 'bg-neutral-100 text-neutral-300'}`}>
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-[#0a4019] uppercase tracking-widest">{key} Section</span>
                                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Toggle visibility on master storefront</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, homepageToggles: { ...localSettings.homepageToggles, [key]: !isEnabled } })}
                                    className={`transition-all duration-500 transform ${isEnabled ? "text-[#d3d3d3] scale-110" : "text-neutral-200"}`}
                                >
                                    {isEnabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                                </button>
                            </div>
                        ))}

                        <div className="mt-12 p-8 bg-[#0a4019] rounded-[2rem] text-[#d3d3d3] relative overflow-hidden group shadow-xl">
                            <LayoutTemplate className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-[#d3d3d3]/5 group-hover:scale-110 transition-transform duration-1000" />
                            <h3 className="text-lg font-heading text-white font-bold mb-2">Pro Aesthetic Mode</h3>
                            <p className="text-[#d3d3d3]/60 text-xs leading-relaxed max-w-[240px]">The current configuration is optimized for luxury retail conversion (StorVia v2.4).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
