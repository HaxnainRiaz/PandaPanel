"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Facebook, ShieldCheck, LogOut, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaAccount({ config, refresh }) {
    const { adminRequest } = useAdmin();
    const [loading, setLoading] = useState(false);
    const isConnected = config?.connectionStatus === 'connected';

    const handleConnect = async () => {
        setLoading(true);
        const res = await adminRequest("/meta/oauth/start");
        setLoading(false);

        if (res?.success && res.oauthUrl) {
            window.location.href = res.oauthUrl;
        } else if (res?.message?.includes("Database temporarily unavailable") || res?.message?.includes("connection")) {
            toast.error("Database connection issue. Please try again in a few minutes");
        } else if (res?.message === 'Invalid or expired token' || res?.message === 'No token provided' || res?.message === 'User not found with this token') {
            toast.error("Please login again");
        } else {
            toast.error(res?.message || "Failed to initiate Meta login");
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect your Meta account? This will clear all integration settings.")) return;
        
        setLoading(true);
        const res = await adminRequest("/meta/disconnect", "POST");
        if (res?.success) {
            toast.success("Disconnected successfully");
            refresh();
        } else {
            toast.error(res?.message || "Failed to disconnect");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-6 mb-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg ${isConnected ? 'bg-[#1877F2]' : 'bg-neutral-200'}`}>
                        <Facebook size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#0a4019]">Meta Account</h2>
                        <p className="text-sm text-neutral-500">
                            {isConnected ? 'Your store is connected to Meta.' : 'Connect your Meta account to access assets.'}
                        </p>
                    </div>
                </div>

                {isConnected ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden">
                                    <img 
                                        src={config.metaProfilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(config.metaUserName || 'Meta User')}&background=0a4019&color=fff`} 
                                        alt="Meta User" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-[#0a4019]">{config.metaUserName || 'Meta User'}</p>
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Connected User ID: {config.metaUserId || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                <ShieldCheck size={12} />
                                Active
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleConnect}
                                className="flex-1 bg-neutral-100 text-[#0a4019] px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all"
                            >
                                <RefreshCw size={16} /> Reconnect
                            </button>
                            <button 
                                onClick={handleDisconnect}
                                disabled={loading}
                                className="flex-1 border border-red-100 text-red-500 px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                            >
                                <LogOut size={16} /> Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
                            <div className="flex items-start gap-3 mb-4 text-blue-700">
                                <AlertCircle size={20} className="shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold mb-1">Before you connect</p>
                                    <p className="text-blue-600/80">Make sure you have a Meta Business Manager account with admin access to the Pixel and Ad Account you want to use.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleConnect}
                            className="w-full bg-[#1877F2] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all shadow-lg shadow-[#1877F2]/20"
                        >
                            <Facebook size={20} /> Connect with Facebook
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-[#B8A68A]/5 p-8 rounded-[2rem] border border-[#B8A68A]/10">
                <h3 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest mb-4">Permissions required</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PermissionItem label="Ads Management" />
                    <PermissionItem label="Business Management" />
                    <PermissionItem label="Catalog Management" />
                    <PermissionItem label="Pixel Management" />
                </ul>
            </div>
        </div>
    );
}

function PermissionItem({ label }) {
    return (
        <li className="flex items-center gap-2 text-xs text-neutral-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[#B8A68A]" />
            {label}
        </li>
    );
}
