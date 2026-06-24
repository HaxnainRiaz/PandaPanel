"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Database, Plus, Search, CheckCircle2, Save, Trash2, ChevronRight, RefreshCw, Briefcase, Target } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaPixelManagement({ config, refresh }) {
    const { adminRequest } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [assetLoading, setAssetLoading] = useState({
        businesses: false,
        adAccounts: false,
        pixels: false
    });
    
    // Manual Input State
    const [manualPixelId, setManualPixelId] = useState(config?.pixelId || "");
    const [manualPixelName, setManualPixelName] = useState(config?.pixelName || "Primary Pixel");

    // Asset Browser State
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [adAccounts, setAdAccounts] = useState([]);
    const [selectedAdAccount, setSelectedAdAccount] = useState(null);
    const [pixels, setPixels] = useState([]);

    const isConnected = config?.connectionStatus === 'connected';

    // Hydrate from config
    useEffect(() => {
        if (!config) return;

        if (config.businessId && config.businessName) {
            setSelectedBusiness({ id: config.businessId, name: config.businessName });
        }
        if (config.adAccountId && config.adAccountName) {
            setSelectedAdAccount({ 
                id: config.adAccountId, 
                name: config.adAccountName,
                currency: config.adAccountCurrency 
            });
        }
        if (config.pixelId) {
            setManualPixelId(config.pixelId);
            setManualPixelName(config.pixelName || "");
        }
    }, [config]);

    useEffect(() => {
        if (isConnected) fetchBusinesses();
    }, [isConnected]);

    // Auto-fetch dependent assets when hydrated or selected
    useEffect(() => {
        if (selectedBusiness?.id && adAccounts.length === 0 && !assetLoading.adAccounts) {
            fetchAdAccounts(selectedBusiness.id);
        }
    }, [selectedBusiness?.id, adAccounts.length]);

    useEffect(() => {
        const targetId = selectedAdAccount?.id || config?.adAccountId;
        if (targetId && pixels.length === 0 && !assetLoading.pixels) {
            fetchPixels(targetId);
        }
    }, [selectedAdAccount?.id, pixels.length, config?.adAccountId]);

    const fetchBusinesses = async () => {
        setAssetLoading(prev => ({ ...prev, businesses: true }));
        const res = await adminRequest("/meta/businesses");
        if (res?.success) setBusinesses(res.data);
        setAssetLoading(prev => ({ ...prev, businesses: false }));
    };

    const fetchAdAccounts = async (bizId) => {
        if (!bizId) return;
        setAssetLoading(prev => ({ ...prev, adAccounts: true }));
        const res = await adminRequest(`/meta/ad-accounts/${bizId}`);
        if (res?.success) setAdAccounts(res.data);
        setAssetLoading(prev => ({ ...prev, adAccounts: false }));
    };

    const fetchPixels = async (accId) => {
        if (!accId) return;
        setAssetLoading(prev => ({ ...prev, pixels: true }));
        const res = await adminRequest(`/meta/pixels?adAccountId=${accId}`);
        if (res?.success) setPixels(res.data?.pixels || res.pixels || []);
        setAssetLoading(prev => ({ ...prev, pixels: false }));
    };

    const handleSelectBusiness = async (biz) => {
        setSelectedBusiness(biz);
        setSelectedAdAccount(null);
        setPixels([]);
        fetchAdAccounts(biz.id);
    };

    const handleSelectAdAccount = async (acc) => {
        setSelectedAdAccount(acc);
        fetchPixels(acc.id);
    };

    const handleSelectPixel = async (px) => {
        setLoading(true);
        const res = await adminRequest("/meta/settings", "POST", {
            pixelId: px.id,
            pixelName: px.name,
            businessId: selectedBusiness.id,
            businessName: selectedBusiness.name,
            adAccountId: selectedAdAccount.id,
            adAccountName: selectedAdAccount.name
        });
        
        if (res?.success) {
            toast.success(`Pixel "${px.name}" selected!`);
            refresh();
        } else {
            toast.error(res?.message || "Failed to select pixel");
        }
        setLoading(false);
    };

    const handleSaveManual = async () => {
        if (!manualPixelId) return toast.error("Pixel ID is required");
        
        setLoading(true);
        const res = await adminRequest("/meta/manual-pixel", "POST", {
            pixelId: manualPixelId,
            pixelName: manualPixelName || "Manual Pixel"
        });
        
        if (res?.success) {
            toast.success("Pixel ID saved successfully");
            if (typeof refresh === "function") refresh();
        } else {
            toast.error(res?.message || "Failed to save Pixel ID");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#0a4019]">Pixel Management</h2>
                        <p className="text-sm text-neutral-500">Select or manually enter your Meta Pixel ID.</p>
                    </div>
                </div>

                {/* Asset Browser Section */}
                {isConnected ? (
                    <div className="space-y-6 mb-12">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest">Select from Meta Assets</h3>
                            {(assetLoading.businesses || assetLoading.adAccounts || assetLoading.pixels) && <RefreshCw size={14} className="animate-spin text-neutral-400" />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Businesses */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2">1. Business</p>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {businesses.map(biz => (
                                        <button
                                            key={biz.id}
                                            onClick={() => handleSelectBusiness(biz)}
                                            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${selectedBusiness?.id === biz.id ? 'bg-[#0a4019] text-white border-[#0a4019]' : 'bg-neutral-50 text-[#0a4019] border-neutral-100 hover:border-neutral-200'}`}
                                        >
                                            {biz.name}
                                        </button>
                                    ))}
                                    {businesses.length === 0 && !assetLoading && <p className="text-[10px] text-neutral-400 px-2 italic">No businesses found</p>}
                                </div>
                            </div>

                            {/* Ad Accounts */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">2. Ad Account</p>
                                    {selectedBusiness && (
                                        <button 
                                            onClick={() => fetchAdAccounts(selectedBusiness.id)}
                                            className="text-[8px] font-bold text-[#0a4019] hover:underline"
                                            disabled={assetLoading.adAccounts}
                                        >
                                            {assetLoading.adAccounts ? 'Loading...' : 'Refresh'}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {selectedBusiness ? adAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => handleSelectAdAccount(acc)}
                                            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${selectedAdAccount?.id === acc.id ? 'bg-[#0a4019] text-white border-[#0a4019]' : 'bg-neutral-50 text-[#0a4019] border-neutral-100 hover:border-neutral-200'}`}
                                        >
                                            {acc.name}
                                        </button>
                                    )) : <p className="text-[10px] text-neutral-400 px-2 italic pt-2">Select a business first</p>}
                                    {selectedBusiness && adAccounts.length === 0 && !assetLoading.adAccounts && (
                                        <div className="py-8 text-center px-4">
                                            <p className="text-[10px] text-neutral-400 italic mb-2">No ad accounts found for this business.</p>
                                            <button 
                                                onClick={() => fetchAdAccounts(selectedBusiness.id)}
                                                className="text-[10px] font-bold text-[#0a4019] underline"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pixels */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">3. Pixel / Dataset</p>
                                    {(selectedAdAccount || selectedBusiness) && (
                                        <button 
                                            onClick={() => fetchPixels(selectedAdAccount?.id, selectedBusiness?.id)}
                                            className="text-[8px] font-bold text-[#0a4019] hover:underline"
                                            disabled={assetLoading.pixels}
                                        >
                                            {assetLoading.pixels ? 'Loading...' : 'Refresh'}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {selectedAdAccount ? pixels.map(px => (
                                        <button
                                            key={px.id}
                                            onClick={() => handleSelectPixel(px)}
                                            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${config?.pixelId === px.id ? 'bg-green-500 text-white border-green-500' : 'bg-neutral-50 text-[#0a4019] border-neutral-100 hover:border-green-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{px.name}</span>
                                                {config?.pixelId === px.id && <CheckCircle2 size={12} />}
                                            </div>
                                            <p className={`text-[8px] mt-1 ${config?.pixelId === px.id ? 'text-white/70' : 'text-neutral-400'}`}>ID: {px.id}</p>
                                        </button>
                                    )) : <p className="text-[10px] text-neutral-400 px-2 italic pt-2">Select an ad account first</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 text-center mb-12">
                        <Briefcase className="mx-auto text-neutral-300 mb-4" size={32} />
                        <p className="text-sm font-bold text-[#0a4019] mb-1">Browse Assets Automatically</p>
                        <p className="text-xs text-neutral-500 mb-6">Connect your Meta account to browse your Businesses, Ad Accounts, and Pixels directly.</p>
                        <button 
                            onClick={() => window.location.href='/meta?tab=account'}
                            className="text-xs font-bold text-[#0a4019] underline underline-offset-4"
                        >
                            Connect Account Now
                        </button>
                    </div>
                )}

                {/* Manual Input Section */}
                <div className="p-8 border-2 border-dashed border-neutral-100 rounded-[2rem] space-y-6">
                    <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest">Manual Setup</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Pixel Name</label>
                            <input 
                                type="text"
                                value={manualPixelName}
                                onChange={(e) => setManualPixelName(e.target.value)}
                                placeholder="e.g. StorVia Main Pixel"
                                className="w-full bg-neutral-50 border border-neutral-100 px-4 py-3 rounded-2xl text-sm focus:border-[#0a4019] outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Pixel ID</label>
                            <input 
                                type="text"
                                value={manualPixelId}
                                onChange={(e) => setManualPixelId(e.target.value)}
                                placeholder="15-16 digit number"
                                className="w-full bg-neutral-50 border border-neutral-100 px-4 py-3 rounded-2xl text-sm focus:border-[#0a4019] outline-none transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleSaveManual}
                            disabled={loading}
                            className="bg-[#0a4019] text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/20"
                        >
                            <Save size={16} /> Save Pixel
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-orange-50/50 p-8 rounded-[2rem] border border-orange-100">
                <h3 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4">Pixel ID Location</h3>
                <p className="text-xs text-orange-700 leading-relaxed mb-4">
                    You can find your Pixel ID in Meta Events Manager under <strong>Data Sources</strong>. It is a 15-16 digit number.
                </p>
                <a 
                    href="https://business.facebook.com/events_manager2/list/dataset/" 
                    target="_blank"
                    className="text-xs font-bold text-orange-800 flex items-center gap-1 hover:underline underline-offset-4"
                >
                    Go to Events Manager <Plus size={12} className="rotate-45" />
                </a>
            </div>
        </div>
    );
}
