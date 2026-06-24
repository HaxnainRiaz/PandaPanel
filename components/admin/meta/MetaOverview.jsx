"use client";

import { useState } from "react";
import { 
    Facebook, 
    ShieldCheck, 
    Database, 
    Briefcase, 
    Activity, 
    RefreshCw, 
    AlertCircle, 
    CheckCircle2, 
    ExternalLink,
    Settings,
    LogOut,
    ChevronRight,
    Zap,
    HelpCircle,
    ArrowUpRight,
    Clock,
    XCircle,
    ShieldAlert
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaOverview({ config, setActiveTab, refresh, adminRequest }) {
    const [loading, setLoading] = useState(false);
    const isConnected = config?.connectionStatus === 'connected';
    const isSetupComplete = config?.setupCompleted;

    const healthScore = config?.trackingHealthScore !== undefined ? config.trackingHealthScore : 100;
    
    // Get stats from config
    const statsData = config?.stats || {
        totalEvents: 0,
        queuedEvents: 0,
        sentEvents: 0,
        failedEvents: 0,
        skippedEvents: 0
    };

    const stats = [
        { 
            label: "Browser Pixel", 
            status: config?.isPixelEnabled ? "Active" : "Disabled", 
            icon: <Database size={16} />, 
            color: config?.isPixelEnabled ? "text-green-600 bg-green-50" : "text-neutral-400 bg-neutral-50",
            desc: "Tracks direct user browser events"
        },
        { 
            label: "Conversions API", 
            status: config?.isCapiEnabled ? "Active" : "Disabled", 
            icon: <Zap size={16} />, 
            color: config?.isCapiEnabled ? "text-green-600 bg-green-50" : "text-neutral-400 bg-neutral-50",
            desc: "Tracks server-to-server data"
        },
        { 
            label: "Deduplication", 
            status: config?.deduplicationEnabled ? "Active" : "Disabled", 
            icon: <ShieldCheck size={16} />, 
            color: config?.deduplicationEnabled ? "text-green-600 bg-green-50" : "text-neutral-400 bg-neutral-50",
            desc: "Prevents double-counting signals"
        },
    ];

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Meta? This will stop all tracking and clear your settings.")) return;
        
        setLoading(true);
        const res = await adminRequest("/meta/disconnect", "POST");
        if (res?.success) {
            toast.success("Meta integration disconnected");
            refresh();
        } else {
            toast.error(res?.message || "Failed to disconnect");
        }
        setLoading(false);
    };

    // Calculate dynamic health label
    const getHealthLabel = (score) => {
        if (score >= 90) return { label: "Excellent", color: "text-green-600 bg-green-50 border-green-100" };
        if (score >= 70) return { label: "Healthy", color: "text-yellow-600 bg-yellow-50 border-yellow-100" };
        return { label: "Needs Review", color: "text-red-600 bg-red-50 border-red-100" };
    };

    const healthMeta = getHealthLabel(healthScore);

    return (
        <div className="space-y-8 animate-fadeIn">
            
            {/* Connection Status Banner */}
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#1877F2] rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
                        {config?.metaProfilePicture ? (
                            <img src={config.metaProfilePicture} alt="Meta Profile" className="w-full h-full object-cover" />
                        ) : (
                            <Facebook size={40} />
                        )}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                            <h2 className="text-xl font-bold text-[#0a4019]">{config?.metaUserName || "Meta Integration Connected"}</h2>
                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${isConnected ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {isConnected ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} 
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            {isConnected && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${healthMeta.color}`}>
                                    {healthMeta.label}
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-500 text-xs font-medium leading-relaxed max-w-xl">
                            Double-signal tracking is running. All server transactions are offloaded asynchronously to safeguard checkout performance.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <button 
                        onClick={() => setActiveTab("settings")}
                        className="flex-1 md:flex-none bg-neutral-100 text-[#0a4019] px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all"
                    >
                        <Settings size={14} /> Configure
                    </button>
                    <button 
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="flex-1 md:flex-none border border-red-100 text-red-500 px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={14} /> : <LogOut size={14} />}
                        Disconnect
                    </button>
                </div>
            </div>

            {/* Tracking Status Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${stat.color}`}>{stat.status}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                            <p className="text-sm font-bold text-[#0a4019]">{stat.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Assets & Health Scorecard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Health Scorecard Ring */}
                <div className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm flex flex-col justify-between items-center text-center space-y-6">
                    <div className="w-full text-left">
                        <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} /> CAPI Health rating</h3>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Calculated based on successful event logs.</p>
                    </div>

                    <div className="relative w-36 h-36 flex items-center justify-center">
                        {/* Radial progress ring */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle 
                                cx="50" cy="50" r="42" 
                                className="stroke-neutral-100" 
                                strokeWidth="8" fill="transparent" 
                            />
                            <circle 
                                cx="50" cy="50" r="42" 
                                className={`${healthScore >= 70 ? 'stroke-[#0a4019]' : 'stroke-red-500'} transition-all duration-1000`} 
                                strokeWidth="8" fill="transparent"
                                strokeDasharray={263.8}
                                strokeDashoffset={263.8 - (263.8 * healthScore) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-extrabold text-[#0a4019] font-mono leading-none">{healthScore}%</span>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{healthMeta.label}</span>
                        </div>
                    </div>

                    <div className="text-xs text-neutral-500 font-medium leading-relaxed max-w-[200px]">
                        {healthScore >= 90 ? "Excellent tracking score. Match rate quality is fully optimized." : 
                         healthScore >= 70 ? "Healthy status. Some retry activities are successfully running." : 
                         "Tracking attention required. Inspect event failure reasons inside logs."}
                    </div>
                </div>

                {/* Queue Stats Dashboard */}
                <div className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-1.5"><Clock size={14} /> Queue Stats Dashboard</h3>
                        <p className="text-[10px] text-neutral-400 mt-0.5 mb-5">Current event log queue status on Mongoose server.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <QueueMiniCard title="Queued" count={statsData.queuedEvents} icon={<Clock className="text-yellow-600" size={14} />} color="bg-yellow-50" />
                            <QueueMiniCard title="Delivered" count={statsData.sentEvents} icon={<CheckCircle2 className="text-green-600" size={14} />} color="bg-green-50" />
                            <QueueMiniCard title="Failures" count={statsData.failedEvents} icon={<XCircle className="text-red-500" size={14} />} color="bg-red-50" />
                            <QueueMiniCard title="Duplicates" count={statsData.skippedEvents} icon={<ShieldAlert className="text-neutral-500" size={14} />} color="bg-neutral-50" />
                        </div>
                    </div>

                    <button 
                        onClick={() => setActiveTab("logs")}
                        className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[#0a4019] py-3 rounded-2xl font-bold text-xs w-full flex items-center justify-center gap-1.5 transition-all mt-6"
                    >
                        View Database Logs <ChevronRight size={14} />
                    </button>
                </div>

                {/* Active Tracking Assets */}
                <div className="bg-[#0a4019] p-8 rounded-[3rem] text-white shadow-xl shadow-[#0a4019]/5 relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-105 transition-transform duration-700">
                        <Facebook size={120} />
                    </div>
                    
                    <div className="relative space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[#B8A68A] uppercase tracking-widest mb-1">Active Assets</h3>
                            <p className="text-white/50 text-[10px] max-w-xs">Data streams are synchronized with these Meta integrations.</p>
                        </div>
                        
                        <div className="space-y-2.5">
                            <AssetMiniRow label="Business" value={config?.businessName || "Connected Owner"} />
                            <AssetMiniRow label="Ad Account" value={config?.adAccountName || "Personal Account"} />
                            <AssetMiniRow label="Dataset / Pixel" value={config?.pixelName || "Connected Pixel"} />
                        </div>
                    </div>

                    <button 
                        onClick={() => setActiveTab("setup")}
                        className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-bold text-xs w-full flex items-center justify-center gap-1 backdrop-blur-md transition-all border border-white/5 relative z-10 mt-6"
                    >
                        Manage Assets <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Event Match Quality (EMQ) Checklist Panel */}
            <div className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={16} /> Meta Event Match Quality (EMQ) Checklist</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Recommended practices to maximize event correlation rates inside Meta Ads Manager.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EmqCheckItem 
                        title="Maximum Data Sharing active" 
                        desc="Advanced matching is configured to lowercase, trim, and SHA-256 hash customer profiles before transmitting." 
                        complete={config?.dataSharingLevel === 'maximum'}
                    />
                    <EmqCheckItem 
                        title="Pre-hashed server database logs" 
                        desc="PII is encrypted and pre-hashed immediately inside memory. Database log fields store hashed strings only." 
                        complete={isConnected}
                    />
                    <EmqCheckItem 
                        title="First-party browser cookie fallbacks" 
                        desc="Automatic FBP and FBC generator engines recover Safari and iOS session tracking cookies." 
                        complete={config?.isPixelEnabled}
                    />
                    <EmqCheckItem 
                        title="Client-first Event ID spine" 
                        desc="browser and server events share matched UUID identifiers to ensure flawless Meta deduplication." 
                        complete={config?.deduplicationEnabled}
                    />
                </div>

                <div className="bg-[#B8A68A]/5 p-6 rounded-[2.5rem] border border-[#B8A68A]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#B8A68A] shadow-sm shrink-0">
                            <Zap size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-xs text-[#0a4019]">Verify your tracking configuration</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Use the CAPI test sandbox tab to trigger synthetic matched signals and check Meta Events Manager.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab("capi")}
                        className="bg-[#0a4019] text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 self-start md:self-auto shadow-md shadow-[#0a4019]/10"
                    >
                        Go to Sandbox <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function QueueMiniCard({ title, count, icon, color }) {
    return (
        <div className={`p-4 rounded-2xl border border-neutral-100 flex items-center gap-3 ${color}`}>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-1">{title}</p>
                <p className="text-base font-extrabold text-[#0a4019] font-mono leading-none">{count}</p>
            </div>
        </div>
    );
}

function AssetMiniRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-b-0">
            <span className="text-white/40 font-semibold">{label}:</span>
            <span className="font-bold text-white max-w-[150px] truncate" title={value}>{value}</span>
        </div>
    );
}

function EmqCheckItem({ title, desc, complete }) {
    return (
        <div className={`p-5 rounded-2xl border flex gap-4 items-start ${complete ? 'bg-green-50/20 border-green-100/60' : 'bg-neutral-50 border-neutral-100'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${complete ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-300'}`}>
                {complete ? <CheckCircle2 size={14} /> : <HelpCircle size={14} />}
            </div>
            <div>
                <p className={`font-bold text-xs ${complete ? 'text-[#0a4019]' : 'text-neutral-400'}`}>{title}</p>
                <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    );
}
