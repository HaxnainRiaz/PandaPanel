"use client";

import { 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    ShieldCheck, 
    Zap, 
    Database, 
    RefreshCw, 
    ExternalLink,
    AlertTriangle,
    Check,
    Cpu,
    ArrowRight
} from "lucide-react";

export default function MetaDiagnostics({ config }) {
    const isConnected = config?.connectionStatus === 'connected';
    const hasPixel = !!config?.pixelId;
    const hasCapi = !!config?.isCapiEnabled && !!config?.hasCapiToken;
    const sharingLevel = config?.dataSharingLevel || 'standard';
    const stats = config?.stats || { failedEvents: 0 };
    const deduplicationEnabled = config?.deduplicationEnabled;
    const lastErrorMessage = config?.lastErrorMessage;

    const checks = [
        {
            id: 'account',
            title: 'Account Connection',
            status: isConnected ? 'success' : 'error',
            message: isConnected ? 'Your Meta account is connected and tokens are valid.' : 'Please connect your Meta account in the Account tab.',
            icon: ShieldCheck
        },
        {
            id: 'pixel',
            title: 'Meta Pixel',
            status: hasPixel ? 'success' : 'error',
            message: hasPixel ? `Pixel ID ${config.pixelId} is configured for browser tracking.` : 'No Pixel ID found. Browser tracking is inactive.',
            icon: Database
        },
        {
            id: 'capi',
            title: 'Conversions API',
            status: hasCapi ? 'success' : (config?.isCapiEnabled ? 'warning' : 'neutral'),
            message: hasCapi ? 'Server-side tracking is active and sending events.' : (config?.isCapiEnabled ? 'CAPI is enabled but access token is missing.' : 'Conversions API is currently disabled.'),
            icon: Zap
        },
        {
            id: 'sharing',
            title: 'Data Sharing Level',
            status: sharingLevel === 'maximum' ? 'success' : (sharingLevel === 'enhanced' ? 'warning' : 'neutral'),
            message: `Current level: ${sharingLevel.toUpperCase()}. ${sharingLevel === 'standard' ? 'Consider upgrading to Enhanced or Maximum for better results.' : ''}`,
            icon: Zap
        }
    ];

    // Generate intelligent system diagnostics alerts
    const getSystemAlerts = () => {
        const alerts = [];

        if (!isConnected) {
            alerts.push({
                type: 'critical',
                title: 'Meta account disconnected',
                desc: 'Your MERN store is not receiving marketing attribution signals because the Meta account is disconnected.',
                solution: 'Go to the setup wizard or account tab and click "Connect Meta Account" to authorize the integration.'
            });
        }

        if (isConnected && !hasPixel) {
            alerts.push({
                type: 'critical',
                title: 'No Dataset/Pixel selected',
                desc: 'Although connected, there is no Meta Pixel dataset configured to receive your webstore browser and server events.',
                solution: 'Visit the Setup tab and select an existing Pixel dataset, or paste one manually.'
            });
        }

        if (hasPixel && !config?.isPixelEnabled) {
            alerts.push({
                type: 'warning',
                title: 'Browser Pixel tracking disabled',
                desc: 'Direct client-side tracking is disabled. Relying purely on server tracking can degrade matching rates.',
                solution: 'Go to the Settings tab, enable the Meta Pixel toggle, and save changes.'
            });
        }

        if (config?.isCapiEnabled && !hasCapi) {
            alerts.push({
                type: 'critical',
                title: 'CAPI Token Missing',
                desc: 'Conversions API is enabled, but no Graph access token is configured. Queue payloads will build up but fail delivery.',
                solution: 'Navigate to the Conversions API tab, paste an EAA access token generated in Meta Events Manager, and save.'
            });
        }

        if (isConnected && deduplicationEnabled === false) {
            alerts.push({
                type: 'warning',
                title: 'Event Deduplication inactive',
                desc: 'Browser and server event deduplication is turned off. This can cause double-counting of conversion actions in Ads Manager.',
                solution: 'Enable "Verify Event Deduplication" inside Settings to generate synchronized client-first Event IDs.'
            });
        }

        if (sharingLevel !== 'maximum') {
            alerts.push({
                type: 'warning',
                title: 'Standard data sharing limit',
                desc: 'Your data sharing level is standard or enhanced. Meta cannot optimize target matching due to limited customer identifiers.',
                solution: 'Change data sharing level to "Maximum" inside Settings to enable hashed PII matching parameters.'
            });
        }

        if (stats.failedEvents > 0) {
            alerts.push({
                type: 'warning',
                title: `${stats.failedEvents} Queue delivery failures`,
                desc: `We detected ${stats.failedEvents} failed Conversions API events in the queue. These transactions require retrying.`,
                solution: 'Navigate to the Event Logs tab and click "Retry All Failed" or manual "Process Queue" to flush pending records.'
            });
        }

        if (lastErrorMessage) {
            alerts.push({
                type: 'error',
                title: 'Meta API Endpoint Rejected Code',
                desc: `Meta returned a transmission error: "${lastErrorMessage}"`,
                solution: 'Ensure your CAPI token has not expired or been deleted in Events Manager, and that your Pixel ID is valid.'
            });
        }

        return alerts;
    };

    const activeAlerts = getSystemAlerts();

    return (
        <div className="max-w-4xl space-y-8 animate-fadeIn">
            {/* System Health Overview Cards */}
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <h2 className="text-xl font-bold text-[#0a4019] mb-6">System Health Check</h2>
                
                <div className="space-y-6">
                    {checks.map((check) => (
                        <div key={check.id} className="flex items-start gap-5 p-6 rounded-3xl border border-neutral-50 bg-neutral-50/30">
                            <div className={`p-3 rounded-2xl ${
                                check.status === 'success' ? 'bg-green-100 text-green-600' : 
                                check.status === 'error' ? 'bg-red-100 text-red-600' : 
                                check.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                'bg-neutral-100 text-neutral-400'
                            }`}>
                                <check.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-[#0a4019] text-sm">{check.title}</h3>
                                    <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                        check.status === 'success' ? 'bg-green-100 text-green-700' : 
                                        check.status === 'error' ? 'bg-red-100 text-red-700' : 
                                        check.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-neutral-100 text-neutral-500'
                                    }`}>
                                        {check.status}
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500">{check.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Diagnostics Alerts Warnings Engine */}
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-[#0a4019] flex items-center gap-2"><Cpu size={20} /> System Diagnostics Warnings Engine</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Real-time alerts detected inside the MERN integration setup.</p>
                </div>

                {activeAlerts.length === 0 ? (
                    <div className="p-8 bg-green-50/50 border border-green-100 text-green-800 rounded-3xl flex items-center gap-4 text-xs font-semibold">
                        <CheckCircle2 className="text-green-600 shrink-0" size={24} />
                        <div>
                            <p className="text-sm font-bold text-[#0a4019]">✓ All systems fully optimized!</p>
                            <p className="text-[11px] text-green-600/80 mt-0.5">No critical integration warnings or delivery faults found. Your store tracking is fully healthy.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeAlerts.map((alert, i) => (
                            <div 
                                key={i} 
                                className={`p-6 rounded-3xl border flex items-start gap-4 text-xs ${
                                    alert.type === 'critical' || alert.type === 'error'
                                        ? 'bg-red-50/50 border-red-100 text-red-800' 
                                        : 'bg-yellow-50/50 border-yellow-100 text-yellow-800'
                                }`}
                            >
                                <AlertTriangle className={`shrink-0 mt-0.5 ${alert.type === 'critical' || alert.type === 'error' ? 'text-red-500' : 'text-yellow-600'}`} size={18} />
                                <div className="space-y-2 flex-1">
                                    <div>
                                        <p className="font-bold text-[#0a4019] text-sm">{alert.title}</p>
                                        <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5">{alert.desc}</p>
                                    </div>
                                    <div className="p-3 bg-white/70 border border-neutral-100 rounded-xl flex items-start gap-2">
                                        <ArrowRight className="text-green-600 mt-0.5 shrink-0" size={12} />
                                        <div>
                                            <p className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest">Recommended Solution</p>
                                            <p className="text-[11px] text-[#0a4019] font-medium leading-relaxed mt-0.5">{alert.solution}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommendations & Links */}
            <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="text-blue-600" />
                    <h3 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest">Platform best practices</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RecommendationItem 
                        title="Double-Signal Redundancy" 
                        desc="Always keep both Browser Pixel and Server CAPI active. This maximizes data capture rates even under strict privacy controls like Safari ITP or iOS 14+." 
                    />
                    <RecommendationItem 
                        title="Match Key Quality Rating" 
                        desc="Meta relies heavily on user match keys. Ensure your checkout flow gathers clean, standard phone and email addresses to maximize conversion attribution accuracy." 
                    />
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <a 
                    href="https://business.facebook.com/events_manager2/diagnostics" 
                    target="_blank"
                    className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-[#0a4019] transition-all"
                >
                    View Meta Diagnostics Dashboard <ExternalLink size={14} />
                </a>
            </div>
        </div>
    );
}

function RecommendationItem({ title, desc }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-neutral-100">
            <h4 className="text-xs font-bold text-[#0a4019] mb-1">{title}</h4>
            <p className="text-[10px] text-neutral-500 leading-relaxed">{desc}</p>
        </div>
    );
}
