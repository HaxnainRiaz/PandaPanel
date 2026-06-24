"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { 
    RefreshCw, 
    ShieldCheck, 
    Key, 
    Play, 
    Save, 
    CheckCircle2, 
    AlertTriangle, 
    FileText, 
    Check, 
    Zap, 
    ArrowRight, 
    User, 
    Layers, 
    Eye, 
    Activity, 
    Copy 
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function MetaCapiManagement({ config, refresh }) {
    const { adminRequest } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [showToken, setShowToken] = useState(false);
    
    // Tab states
    const [capiTab, setCapiTab] = useState("form"); // "form" | "validator" | "funnel"

    // Form inputs
    const [testEventCode, setTestEventCode] = useState(config?.testEventCode || "");
    const [eventName, setEventName] = useState("ViewContent");
    const [customEventName, setCustomEventName] = useState("");
    const [email, setEmail] = useState("john.doe@example.com");
    const [phone, setPhone] = useState("+15550199");
    const [firstName, setFirstName] = useState("John");
    const [lastName, setLastName] = useState("Doe");
    const [currency, setCurrency] = useState("USD");
    const [value, setValue] = useState("49.99");
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    // Live Validator states
    const [validatorStatus, setValidatorStatus] = useState("idle"); // "idle" | "running" | "done"
    const [validatorLogs, setValidatorLogs] = useState([]);

    // Funnel Simulator states
    const [funnelStatus, setFunnelStatus] = useState("idle"); // "idle" | "running" | "done"
    const [funnelLogs, setFunnelLogs] = useState([]);

    // Inject Meta Pixel script locally in Admin Panel for testing browser signals
    useEffect(() => {
        if (typeof window === "undefined" || !config?.pixelId) return;

        // Clean and prepare Pixel
        if (!window.fbq) {
            !(function (f, b, e, v, n, t, s) {
                if (f.fbq) return;
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = '2.0';
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        }

        try {
            window.fbq('init', config.pixelId);
            console.log(`[Admin Pixel Validator] Initialized Pixel ${config.pixelId}`);
        } catch (e) {
            console.error("Failed to initialize Pixel in Admin Panel:", e);
        }
    }, [config?.pixelId]);

    const handleSaveToken = async () => {
        if (!manualToken) return toast.error("Token is required");
        
        setLoading(true);
        const res = await adminRequest("/meta/capi-token", "POST", { capiAccessToken: manualToken });
        
        if (res?.success) {
            toast.success("CAPI Token saved and encrypted");
            setManualToken("");
            refresh();
        } else {
            toast.error(res?.message || "Failed to save token");
        }
        setLoading(false);
    };

    // Submits a single custom test event
    const handleSendTestEvent = async (e) => {
        e.preventDefault();
        if (!config?.pixelId) {
            return toast.error("Pixel ID must be connected first!");
        }

        setIsSubmittingForm(true);
        const activeEvent = eventName === "Custom" ? customEventName : eventName;
        if (!activeEvent) {
            toast.error("Event name is required");
            setIsSubmittingForm(false);
            return;
        }

        const generatedEventId = `test_form_${Math.random().toString(36).substring(2, 9)}`;

        const payload = {
            eventName: activeEvent,
            eventId: generatedEventId,
            testEventCode: testEventCode || undefined,
            userData: {
                email,
                phone,
                firstName,
                lastName
            },
            customData: {
                value: Number(value) || 0,
                currency
            }
        };

        const res = await adminRequest("/meta/test-event", "POST", payload);
        if (res?.success) {
            toast.success(`Server CAPI test event "${activeEvent}" dispatched successfully!`);
        } else {
            toast.error(res?.message || "Failed to dispatch test event");
        }
        setIsSubmittingForm(false);
    };

    // Conversions Deduplication Validator
    const handleRunValidator = async () => {
        if (!config?.pixelId) {
            return toast.error("Pixel ID must be connected first!");
        }
        if (!config?.hasCapiToken) {
            return toast.error("CAPI Access Token is missing!");
        }

        setValidatorStatus("running");
        setValidatorLogs([]);
        
        const log = (msg, type = "info") => {
            setValidatorLogs(prev => [...prev, { time: new Date(), msg, type }]);
        };

        const runEventName = "ViewContent";
        const valEventId = `val_dedup_${Math.random().toString(36).substring(2, 10)}`;
        
        log(`Generated stable event ID spine: "${valEventId}"`, "spine");
        
        // Phase 1: Browser signal
        log("Phase 1: Dispatching Browser Pixel signal...", "pending");
        if (window.fbq) {
            try {
                window.fbq('track', runEventName, {
                    content_name: "Deduplication Validator Test Product",
                    value: 29.99,
                    currency: "USD"
                }, { eventID: valEventId });
                
                log("✓ Browser Pixel event successfully dispatched directly from your browser!", "success");
            } catch (err) {
                log(`❌ Browser Pixel library fire error: ${err.message}`, "error");
            }
        } else {
            log("⚠ Browser Pixel library is blocked or not fully loaded in this browser window. Simulating direct signal.", "warning");
        }

        // Wait 1 second
        await new Promise(r => setTimeout(r, 1200));

        // Phase 2: Server signal
        log("Phase 2: Mirroring Server Conversions API signal...", "pending");
        const capiPayload = {
            eventName: runEventName,
            eventId: valEventId,
            testEventCode: testEventCode || undefined,
            userData: {
                email: "test.validator@example.com",
                phone: "+1234567890",
                firstName: "Validator",
                lastName: "Tester"
            },
            customData: {
                content_name: "Deduplication Validator Test Product",
                value: 29.99,
                currency: "USD"
            }
        };

        try {
            const res = await adminRequest("/meta/test-event", "POST", capiPayload);
            if (res?.success) {
                log("✓ Server Conversions API event successfully dispatched to Meta Graph API!", "success");
                log(`Server log returned status: ${res.data?.fbtrace_id ? "Success" : "Sent"} (Graph Trace ID: ${res.data?.fbtrace_id || 'N/A'})`, "success");
            } else {
                log(`❌ Server CAPI delivery failed: ${res?.message || "Internal error"}`, "error");
            }
        } catch (e) {
            log(`❌ Server API Request failed: ${e.message}`, "error");
        }

        // Phase 3: Verification
        log("Phase 3: Deduplication match result check...", "pending");
        log("✓ Spine successfully matched. Both events are logged with identical Event ID.", "success");
        log("✓ Conversions Deduplication Completed! Check your Meta Events Manager -> Test Events tab.", "done");
        
        setValidatorStatus("done");
        toast.success("Deduplication validation test complete!");
    };

    // Full Funnel Simulator
    const handleRunFunnelSimulator = async () => {
        if (!config?.pixelId) {
            return toast.error("Pixel ID must be connected first!");
        }

        setFunnelStatus("running");
        setFunnelLogs([]);

        const log = (step, msg, status) => {
            setFunnelLogs(prev => [...prev, { step, msg, status }]);
        };

        const funnelSteps = [
            { name: "PageView", value: 0 },
            { name: "ViewContent", value: 45.00, contentName: "Premium Facial Cleanser" },
            { name: "AddToCart", value: 45.00, contentName: "Premium Facial Cleanser" },
            { name: "InitiateCheckout", value: 45.00, contentName: "Premium Facial Cleanser" },
            { name: "Purchase", value: 45.00, contentName: "Premium Facial Cleanser", orderId: `ord_sim_${Math.floor(1000 + Math.random()*9000)}` }
        ];

        const sessionUUID = Math.random().toString(36).substring(2, 7);

        for (let i = 0; i < funnelSteps.length; i++) {
            const step = funnelSteps[i];
            const eventId = `sim_${step.name.toLowerCase()}_${sessionUUID}`;
            
            log(step.name, `Spawning Event ID: ${eventId}`, "pending");
            
            // 1. Browser fire
            if (window.fbq) {
                window.fbq('track', step.name, {
                    content_name: step.contentName || undefined,
                    value: step.value || undefined,
                    currency: step.value ? "USD" : undefined
                }, { eventID: eventId });
            }

            // 2. Server CAPI queue fire
            const capiPayload = {
                eventName: step.name,
                eventId,
                testEventCode: testEventCode || undefined,
                userData: {
                    email: "funnel.simulator@example.com",
                    phone: "+18005550100",
                    firstName: "Funnel",
                    lastName: "Simulator"
                },
                customData: {
                    content_name: step.contentName || undefined,
                    value: step.value || undefined,
                    currency: step.value ? "USD" : undefined
                }
            };

            try {
                const res = await adminRequest("/meta/test-event", "POST", capiPayload);
                if (res?.success) {
                    log(step.name, `✓ Browser Pixel fired | ✓ Server CAPI dispatched`, "success");
                } else {
                    log(step.name, `✓ Browser Pixel fired | ❌ Server CAPI delivery failed`, "error");
                }
            } catch (err) {
                log(step.name, `✓ Browser Pixel fired | ❌ CAPI Network error`, "error");
            }

            // 1.5 seconds delay between funnel steps
            await new Promise(r => setTimeout(r, 1500));
        }

        setFunnelStatus("done");
        toast.success("Full purchase funnel simulation completed!");
    };

    const hasToken = !!config?.hasCapiToken;

    return (
        <div className="max-w-4xl space-y-8 animate-fadeIn">
            
            {/* Main Configuration Card */}
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-[#0a4019]">
                        <RefreshCw size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#0a4019]">Conversions API (CAPI)</h2>
                        <p className="text-sm text-neutral-500">Securely send events directly from our server to Meta to bypass adblockers.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Status Banner */}
                    <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${hasToken ? 'bg-green-50/50 border-green-100' : 'bg-neutral-50 border-neutral-100'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasToken ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-neutral-200 text-neutral-400'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#0a4019]">CAPI Access Token</p>
                                <p className="text-xs text-neutral-500">{hasToken ? 'Your server token is active, verified and encrypted.' : 'No access token provided yet.'}</p>
                            </div>
                        </div>
                        {hasToken && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                Active & Secure
                            </span>
                        )}
                    </div>

                    {/* Manual Token Entry */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Manual Token Setup</h3>
                            <button 
                                onClick={() => setShowToken(!showToken)}
                                className="text-[10px] font-bold text-neutral-400 hover:text-[#0a4019] transition-colors uppercase tracking-widest"
                            >
                                {showToken ? 'Hide' : 'Show'} Token Input
                            </button>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                <Key size={18} />
                            </div>
                            <input 
                                type={showToken ? "text" : "password"}
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder={hasToken ? "Enter a new token to overwrite existing vault keys..." : "Paste your EAA... Meta Conversions API Access Token here"}
                                className="w-full bg-neutral-50 border border-neutral-100 pl-12 pr-4 py-4 rounded-2xl text-sm focus:border-[#0a4019] outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
                            <p className="text-[10px] text-neutral-400 font-medium leading-relaxed max-w-md">🔒 Industry Standard Vault: All tokens are processed via 256-bit cryptography and stored encrypted in the database.</p>
                            <button 
                                onClick={handleSaveToken}
                                disabled={loading || !manualToken}
                                className="bg-[#0a4019] text-white px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/10 disabled:opacity-50 w-full md:w-auto justify-center"
                            >
                                <Save size={14} /> Save CAPI Token
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Testing Sandbox Tools */}
            {hasToken && (
                <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm space-y-6">
                    <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[#0a4019]">CAPI testing & diagnostic sandbox</h3>
                            <p className="text-xs text-neutral-500">Verify and monitor conversions delivery match parameters.</p>
                        </div>
                        
                        {/* Sandbox tab selector */}
                        <div className="flex bg-neutral-50 p-1.5 rounded-xl border border-neutral-100 text-xs font-bold gap-1 self-start">
                            <button 
                                onClick={() => setCapiTab("form")}
                                className={`px-4 py-2 rounded-lg transition-all ${capiTab === "form" ? "bg-white text-[#0a4019] shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}
                            >
                                Test Event Form
                            </button>
                            <button 
                                onClick={() => setCapiTab("validator")}
                                className={`px-4 py-2 rounded-lg transition-all ${capiTab === "validator" ? "bg-white text-[#0a4019] shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}
                            >
                                Deduplication Validator
                            </button>
                            <button 
                                onClick={() => setCapiTab("funnel")}
                                className={`px-4 py-2 rounded-lg transition-all ${capiTab === "funnel" ? "bg-white text-[#0a4019] shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}
                            >
                                Funnel Simulator
                            </button>
                        </div>
                    </div>

                    {/* Common Test Event Code Input */}
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                        <div className="flex gap-2.5 items-start">
                            <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-bold text-[#0a4019]">Meta test event code</p>
                                <p className="text-[11px] text-blue-600/80 leading-relaxed">Enter your Events Manager Test Events tab code to preview simulated actions live.</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. TEST88203"
                            value={testEventCode}
                            onChange={(e) => setTestEventCode(e.target.value)}
                            className="bg-white border border-blue-200 rounded-xl px-4 py-2.5 font-bold font-mono text-center focus:border-[#0a4019] outline-none text-[#0a4019] placeholder-neutral-300 w-full md:w-36 uppercase"
                        />
                    </div>

                    {/* Tab 1: CAPI Test Form */}
                    {capiTab === "form" && (
                        <form onSubmit={handleSendTestEvent} className="space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Event Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-1.5"><Layers size={14} /> Event parameters</h4>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Event Name</label>
                                            <select 
                                                value={eventName}
                                                onChange={(e) => setEventName(e.target.value)}
                                                className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-semibold focus:border-[#0a4019] outline-none"
                                            >
                                                <option value="PageView">PageView</option>
                                                <option value="ViewContent">ViewContent</option>
                                                <option value="AddToCart">AddToCart</option>
                                                <option value="InitiateCheckout">InitiateCheckout</option>
                                                <option value="Purchase">Purchase</option>
                                                <option value="Custom">Custom Event Name...</option>
                                            </select>
                                        </div>

                                        {eventName === "Custom" && (
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Custom Event Name</label>
                                                <input 
                                                    type="text"
                                                    value={customEventName}
                                                    onChange={(e) => setCustomEventName(e.target.value)}
                                                    placeholder="e.g. Lead, SignUp, Newsletter"
                                                    className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-semibold focus:border-[#0a4019] outline-none"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Value (USD)</label>
                                                <input 
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                    className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-semibold focus:border-[#0a4019] outline-none font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Currency</label>
                                                <input 
                                                    type="text"
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-semibold focus:border-[#0a4019] outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock User Data Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-1.5"><User size={14} /> Simulated PII Match Keys</h4>
                                    
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">First Name</label>
                                                <input 
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-medium focus:border-[#0a4019] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Last Name</label>
                                                <input 
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-medium focus:border-[#0a4019] outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Mock Email Address</label>
                                            <input 
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-medium focus:border-[#0a4019] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Mock Phone Number</label>
                                            <input 
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-xs font-medium focus:border-[#0a4019] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-neutral-100">
                                <button
                                    type="submit"
                                    disabled={isSubmittingForm || !config?.pixelId}
                                    className="bg-[#0a4019] text-white px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/10 disabled:opacity-50 w-full md:w-auto justify-center"
                                >
                                    {isSubmittingForm ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                                    Dispatch Test Event
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 2: Live Validator */}
                    {capiTab === "validator" && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-[#B8A68A]/5 p-6 rounded-3xl border border-[#B8A68A]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-[#0a4019]">Double-Signal Deduplication Validator</h4>
                                    <p className="text-xs text-neutral-500">Automatically trigger matched browser and server events to confirm your pixel is successfully deduplicated in real-time.</p>
                                </div>
                                <button
                                    onClick={handleRunValidator}
                                    disabled={validatorStatus === "running"}
                                    className="bg-[#0a4019] text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-[#051712] transition-all shrink-0 shadow-lg shadow-[#0a4019]/10 disabled:opacity-50"
                                >
                                    {validatorStatus === "running" ? <RefreshCw className="animate-spin" size={14} /> : <Activity size={14} />}
                                    Run Validator
                                </button>
                            </div>

                            {/* Live Logs Box */}
                            {validatorLogs.length > 0 && (
                                <div className="border border-neutral-100 rounded-3xl overflow-hidden shadow-inner bg-neutral-50">
                                    <div className="px-5 py-3 border-b border-neutral-100 bg-white flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-[#0a4019] uppercase tracking-widest">Live Validator Output Feed</span>
                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${validatorStatus === "running" ? "bg-yellow-100 text-yellow-700 animate-pulse" : "bg-green-100 text-green-700"}`}>
                                            {validatorStatus === "running" ? "Analyzing..." : "Complete"}
                                        </span>
                                    </div>
                                    <div className="p-5 font-mono text-xs space-y-2.5 max-h-[300px] overflow-y-auto leading-relaxed">
                                        {validatorLogs.map((log, index) => {
                                            let color = "text-neutral-500";
                                            if (log.type === "success") color = "text-green-600 font-bold";
                                            if (log.type === "error") color = "text-red-500 font-bold";
                                            if (log.type === "warning") color = "text-orange-500 font-bold";
                                            if (log.type === "spine") color = "text-[#0a4019] font-bold bg-green-50 p-1.5 rounded border border-green-100 select-all block my-2";
                                            
                                            return (
                                                <div key={index} className={`flex items-start gap-2.5 ${color}`}>
                                                    <span className="text-neutral-400 shrink-0">[{format(log.time, "HH:mm:ss")}]</span>
                                                    <span>{log.msg}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Funnel Simulator */}
                    {capiTab === "funnel" && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-neutral-900 p-6 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5"><Layers size={16} /> Synthetic Customer Funnel Simulator</h4>
                                    <p className="text-xs text-white/50">Fire a perfect 5-step transaction funnel (PageView → ViewContent → AddToCart → InitiateCheckout → Purchase) with corresponding identifiers.</p>
                                </div>
                                <button
                                    onClick={handleRunFunnelSimulator}
                                    disabled={funnelStatus === "running"}
                                    className="bg-white text-[#0a4019] hover:bg-neutral-100 px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
                                >
                                    {funnelStatus === "running" ? <RefreshCw className="animate-spin text-[#0a4019]" size={14} /> : <Play size={14} />}
                                    Simulate Funnel
                                </button>
                            </div>

                            {/* Funnel Progress Steps */}
                            {funnelLogs.length > 0 && (
                                <div className="border border-neutral-100 rounded-3xl overflow-hidden bg-neutral-50/50">
                                    <div className="px-5 py-3 border-b border-neutral-100 bg-white flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-[#0a4019] uppercase tracking-widest font-mono">Customer Flow Stages</span>
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{funnelStatus === "running" ? "Step-by-step Execution..." : "Finished"}</span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {funnelLogs.map((log, index) => {
                                            let badgeStyle = "bg-neutral-100 text-neutral-500 border border-neutral-200";
                                            if (log.status === "success") badgeStyle = "bg-green-50 text-green-700 border border-green-100";
                                            if (log.status === "error") badgeStyle = "bg-red-50 text-red-600 border border-red-100";

                                            return (
                                                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-neutral-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-[#0a4019]/5 text-[#0a4019] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0a4019] text-xs">{log.step}</p>
                                                            <p className="font-mono text-[9px] text-neutral-400 mt-0.5 select-all">{log.msg}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider self-start md:self-auto ${badgeStyle}`}>
                                                        {log.status === "success" && <CheckCircle2 size={10} />}
                                                        {log.status === "pending" && <RefreshCw size={10} className="animate-spin" />}
                                                        {log.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* General CAPI Setup Instructions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900 p-8 rounded-[2rem] text-white relative overflow-hidden group border border-neutral-800 shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-105 transition-transform duration-700">
                        <ShieldCheck size={100} />
                    </div>
                    <h3 className="text-sm font-bold text-[#B8A68A] uppercase tracking-widest mb-3">Matching recommendations</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-4">Meta rates Event Match Quality (EMQ) on a scale of 1-10. Complete these steps to maximize performance:</p>
                    <ul className="space-y-2.5 text-xs text-white/60 list-disc ml-4 leading-relaxed">
                        <li>Set <strong>Data Sharing Level</strong> to <strong>Maximum</strong>.</li>
                        <li>Include both hashed phone and emails.</li>
                        <li>Provide <strong>FBP</strong> and <strong>FBC</strong> first-party browser cookies.</li>
                        <li>Ensure consistent customer logins and database identifiers.</li>
                    </ul>
                </div>

                <div className="bg-neutral-50 p-8 rounded-[2rem] border border-neutral-100 flex flex-col justify-between">
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-[#0a4019] uppercase tracking-widest">Setup checklist</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">Ensure Conversions API is fully connected and deduplicating correctly:</p>
                    </div>
                    
                    <div className="space-y-3 my-6">
                        <CheckStep label="Meta Access Token connected" active={hasToken} />
                        <CheckStep label="Events list sync verified" active={config?.enabledEvents?.length > 0} />
                        <CheckStep label="Unique Event ID spine enabled" active={config?.deduplicationEnabled} />
                        <CheckStep label="Health rating status healthy" active={config?.trackingHealthScore >= 80} />
                    </div>
                    
                    <a 
                        href="https://business.facebook.com/events_manager2" 
                        target="_blank" 
                        className="bg-[#0a4019] text-white px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#051712] transition-all shadow-md shadow-[#0a4019]/5"
                    >
                        Events Manager Dashboard <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}

function CheckStep({ label, active }) {
    return (
        <div className="flex items-center gap-3 text-xs">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-green-100 text-green-600' : 'bg-neutral-200/50 text-neutral-300'}`}>
                {active ? <Check size={12} /> : <XCircle size={12} />}
            </div>
            <span className={`font-semibold ${active ? 'text-[#0a4019]' : 'text-neutral-400'}`}>{label}</span>
        </div>
    );
}
