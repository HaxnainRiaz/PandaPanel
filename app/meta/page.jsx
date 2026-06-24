"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { toast } from "react-hot-toast";
import {
    Facebook,
    Settings,
    Database,
    Activity,
    ShieldCheck,
    History,
    AlertCircle,
    RefreshCw,
    LayoutDashboard,
    Zap,
    Wand2
} from "lucide-react";
import MetaOverview from "@/components/admin/meta/MetaOverview";
import MetaSetupWizard from "@/components/admin/meta/MetaSetupWizard";
import MetaSettings from "@/components/admin/meta/MetaSettings";
import MetaPixelManagement from "@/components/admin/meta/MetaPixelManagement";
import MetaCapiManagement from "@/components/admin/meta/MetaCapiManagement";
import MetaEventManager from "@/components/admin/meta/MetaEventManager";
import MetaDiagnostics from "@/components/admin/meta/MetaDiagnostics";
import MetaEventLogs from "@/components/admin/meta/MetaEventLogs";
import { getMetaErrorMessage } from "@/components/admin/meta/MetaOAuthSetupChecklist";

export default function MetaIntegrationPage() {
    const { adminRequest } = useAdmin();
    const [activeTab, setActiveTab] = useState("overview");
    const [config, setConfig] = useState(null);
    const [oauthUrl, setOauthUrl] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        const res = await adminRequest(`/meta/status?t=${Date.now()}`);
        if (res?.success) {
            setConfig(res.data);
            setOauthUrl(res.oauthUrl || "");

            // Auto-switch to setup if not completed
            const isFullyConnected = res.isConnected && res.setupCompleted;
            if (!isFullyConnected && activeTab === "overview") {
                setActiveTab("setup");
            } else if (isFullyConnected && activeTab === "setup") {
                setActiveTab("overview");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        
        if (tabParam === 'dashboard' || tabParam === 'overview') {
            setActiveTab('overview');
        } else if (tabParam) {
            setActiveTab(tabParam);
        }

        if (params.get('meta_connected') === '1') {
            toast.success('Meta account connected successfully!');
            setActiveTab('setup');
            window.history.replaceState({}, '', '/meta');
        }

        const metaError = params.get('meta_error');
        if (metaError) {
            toast.error(getMetaErrorMessage(metaError), { duration: 8000 });
            setActiveTab('setup');
            window.history.replaceState({}, '', '/meta');
        }

        if (params.get('activated') === '1') {
            toast.success('Meta integration activated successfully!');
            setActiveTab('overview');
            window.history.replaceState({}, '', '/meta');
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, []);

    const tabs = [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
        { id: "setup", label: "Setup Wizard", icon: Wand2 },
        { id: "pixels", label: "Pixels", icon: Database },
        { id: "capi", label: "Conversions API", icon: Zap },
        { id: "events", label: "Events", icon: Activity },
        { id: "logs", label: "Logs", icon: History },
        { id: "diagnostics", label: "Diagnostics", icon: ShieldCheck },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    if (loading && !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-16 h-16 bg-neutral-50 rounded-3xl flex items-center justify-center">
                    <RefreshCw className="animate-spin text-[#0a4019]" size={32} />
                </div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest animate-pulse">Loading Meta Channel...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-[#1877F2] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Facebook size={18} />
                        </div>
                        <h1 className="text-3xl font-heading font-bold text-[#0a4019]">Facebook & Instagram</h1>
                    </div>
                    <p className="text-sm text-neutral-500 font-medium">Connect your store to Meta's ecosystem to drive more sales.</p>
                </div>
                <button
                    onClick={fetchConfig}
                    className="flex items-center gap-2 bg-white border border-neutral-100 px-4 py-2 rounded-xl text-xs font-bold text-[#0a4019] hover:bg-neutral-50 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh Status
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-neutral-100 overflow-x-auto no-scrollbar gap-2 px-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-4 text-xs font-bold whitespace-nowrap transition-all border-b-2
                            ${activeTab === tab.id
                                ? "border-[#0a4019] text-[#0a4019] bg-[#0a4019]/5 rounded-t-2xl"
                                : "border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-t-2xl"}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            <div className="animate-fadeIn">
                {(activeTab === "overview" && config?.setupCompleted && config?.isConnected) ? (
                    <MetaOverview config={config} setActiveTab={setActiveTab} refresh={fetchConfig} adminRequest={adminRequest} />
                ) : (activeTab === "overview" || activeTab === "setup") ? (
                    <MetaSetupWizard 
                        config={config} 
                        refresh={fetchConfig} 
                        adminRequest={adminRequest} 
                        setActiveTab={setActiveTab} 
                        oauthUrl={oauthUrl}
                    />
                ) : null}
                {activeTab === "settings" && <MetaSettings config={config} refresh={fetchConfig} />}
                {activeTab === "pixels" && <MetaPixelManagement config={config} refresh={fetchConfig} />}
                {activeTab === "capi" && <MetaCapiManagement config={config} refresh={fetchConfig} />}
                {activeTab === "events" && <MetaEventManager config={config} refresh={fetchConfig} />}
                {activeTab === "logs" && <MetaEventLogs />}
                {activeTab === "diagnostics" && <MetaDiagnostics config={config} />}
            </div>
        </div>
    );
}
