"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Facebook,
    Database,
    ShieldCheck,
    AlertCircle,
    Loader2,
    ArrowRight,
    Check,
    Zap,
    ArrowLeft,
    Target
} from "lucide-react";
import { toast } from "react-hot-toast";
import MetaOAuthSetupChecklist, { getMetaErrorMessage } from "./MetaOAuthSetupChecklist";

import { getApiBaseUrl } from "@/lib/apiConfig";

const BACKEND_ORIGIN = getApiBaseUrl();

export default function MetaSetupWizard({
    config,
    refresh,
    adminRequest,
    oauthUrl,
    setActiveTab
}) {
    const isConnected = config?.connectionStatus === "connected";
    const isSetupCompleted = config?.setupCompleted === true;

    const getInitialStep = () => {
        if (!isConnected) return 1;
        if (isSetupCompleted || config?.setupStep === 7) return 7;
        return config?.setupStep || 2;
    };

    const [step, setStep] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem('meta_wizard_step');
            if (saved) {
                const parsed = Number(saved);
                if (parsed >= 1 && parsed <= 7) return parsed;
            }
        }
        return getInitialStep();
    });
    const [loading, setLoading] = useState(false);
    const [isActivatingSuccess, setIsActivatingSuccess] = useState(false);
    const [fallbackMode, setFallbackMode] = useState(false);

    const [oauthPopup, setOauthPopup] = useState(null);
    const [oauthPolling, setOauthPolling] = useState(false);
    // Tracks whether the META_AUTH_SUCCESS postMessage was received before popup closed
    const [oauthSuccessReceived, setOauthSuccessReceived] = useState(false);
    const oauthSuccessRef = useRef(false);
    const fetchedAssetsRef = useRef({});
    const [oauthConfigCheck, setOauthConfigCheck] = useState(null);

    const [assets, setAssets] = useState({
        businesses: [],
        adAccounts: [],
        pixels: [],
        pages: []
    });

    const [selectedAsset, setSelectedAsset] = useState({
        businessId: config?.businessId || "",
        adAccountId: config?.adAccountId || "",
        pixelId: config?.pixelId || "",
        pageId: config?.pageId || ""
    });

    /**
     * Hydrate selected assets from latest backend config.
     */
    useEffect(() => {
        if (!config) return;

        setSelectedAsset((prev) => ({
            businessId: config.businessId || prev.businessId || "",
            adAccountId: config.adAccountId || prev.adAccountId || "",
            pixelId: config.pixelId || prev.pixelId || "",
            pageId: config.pageId || prev.pageId || ""
        }));
    }, [
        config?.businessId,
        config?.adAccountId,
        config?.pixelId,
        config?.pageId
    ]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('meta_wizard_step', String(step));
        }
    }, [step]);

    /**
     * Safer step sync.
     * Prevents wizard from jumping backward after successful activation.
     */
    useEffect(() => {
        if (isActivatingSuccess) {
            setStep(7);
            return;
        }

        if (!isConnected) {
            setStep(1);
            return;
        }

        if (config?.setupCompleted === true || config?.setupStep === 7) {
            setStep(7);
            return;
        }

        if (config?.setupStep) {
            setStep((prev) => {
                if (config.setupStep > prev) return config.setupStep;
                return prev;
            });
        }
    }, [
        isConnected,
        config?.setupCompleted,
        config?.setupStep,
        isActivatingSuccess
    ]);

    /**
     * Normalize backend response because different endpoints may return:
     * res.data, res.businesses, res.data.businesses, res.pixels, etc.
     */
    const normalizeMetaResponse = (type, res) => {
        if (!res) return [];

        if (Array.isArray(res.data)) return res.data;

        if (type === "businesses") {
            return res.businesses || res.data?.businesses || [];
        }

        if (type === "adAccounts") {
            return (
                res.adAccounts ||
                res.data?.adAccounts ||
                res.data?.accounts ||
                res.accounts ||
                []
            );
        }

        if (type === "pixels") {
            return res.pixels || res.data?.pixels || [];
        }

        if (type === "pages") {
            return res.pages || res.data?.pages || [];
        }

        return [];
    };

    const fetchAssets = useCallback(
        async (type, id = null) => {
            setLoading(true);

            try {
                let endpoint = "";

                if (type === "businesses") {
                    endpoint = "/meta/businesses";
                }

                if (type === "adAccounts") {
                    if (!id) {
                        toast.error("Business ID is missing.");
                        return;
                    }
                    endpoint = `/meta/ad-accounts/${id}`;
                }

                if (type === "pixels") {
                    if (!id) {
                        toast.error("Ad Account ID is missing.");
                        return;
                    }
                    endpoint = `/meta/pixels?adAccountId=${encodeURIComponent(id)}`;
                }

                if (type === "pages") {
                    endpoint = "/meta/pages";
                }

                const res = await adminRequest(endpoint);

                if (res?.success) {
                    const normalizedData = normalizeMetaResponse(type, res);

                    setAssets((prev) => ({
                        ...prev,
                        [type]: normalizedData
                    }));
                } else {
                    toast.error(res?.message || `Failed to fetch ${type}`);
                }
            } catch (err) {
                console.error(`Failed to fetch ${type}:`, err);
                toast.error(`Failed to fetch ${type}`);
            } finally {
                setLoading(false);
            }
        },
        [adminRequest]
    );

    /**
     * Fetch assets when step changes.
     */
    useEffect(() => {
        if (step === 2 && !fetchedAssetsRef.current.businesses) {
            fetchedAssetsRef.current.businesses = true;
            fetchAssets("businesses");
        }

        if (step === 3 && selectedAsset.businessId) {
            const cacheKey = `adAccounts:${selectedAsset.businessId}`;
            if (fetchedAssetsRef.current[cacheKey]) return;
            fetchedAssetsRef.current[cacheKey] = true;
            fetchAssets("adAccounts", selectedAsset.businessId);
        }

        if (step === 4 && selectedAsset.adAccountId) {
            const cacheKey = `pixels:${selectedAsset.adAccountId}`;
            if (fetchedAssetsRef.current[cacheKey]) return;
            fetchedAssetsRef.current[cacheKey] = true;
            fetchAssets("pixels", selectedAsset.adAccountId);
        }

        if (step === 5 && !fetchedAssetsRef.current.pages) {
            fetchedAssetsRef.current.pages = true;
            fetchAssets("pages");
        }
    }, [
        step,
        selectedAsset.businessId,
        selectedAsset.adAccountId,
        fetchAssets
    ]);

    useEffect(() => {
        if (step !== 1 || !adminRequest) return;

        adminRequest("/meta/oauth/config-check")
            .then((res) => {
                if (res?.success && res.data) {
                    setOauthConfigCheck(res.data);
                }
            })
            .catch(() => {});
    }, [step, adminRequest]);

    /**
     * OAuth popup listener — only accept messages from the backend callback origin.
     */
    useEffect(() => {
        const handleOAuthMessage = async (event) => {
            if (!event?.data) return;

            const allowedOrigins = [BACKEND_ORIGIN, window.location.origin];
            if (!allowedOrigins.includes(event.origin)) return;

            if (event.data?.type === "META_AUTH_SUCCESS" || event.data?.type === "META_OAUTH_SUCCESS") {
                oauthSuccessRef.current = true;
                setOauthSuccessReceived(true);
                toast.success("Meta account connected successfully!");

                if (oauthPopup && !oauthPopup.closed) {
                    oauthPopup.close();
                }

                setOauthPolling(false);
                setLoading(false);

                if (refresh) {
                    await refresh();
                }

                setStep(2);
            }

            // Backend posts META_AUTH_ERROR on failure
            if (event.data?.type === "META_AUTH_ERROR" || event.data?.type === "META_OAUTH_ERROR") {
                const code = event.data?.code || "unknown";
                toast.error(event.data?.message || getMetaErrorMessage(code));

                if (oauthPopup && !oauthPopup.closed) {
                    oauthPopup.close();
                }

                setOauthPolling(false);
                setLoading(false);
            }
        };

        window.addEventListener("message", handleOAuthMessage);

        return () => {
            window.removeEventListener("message", handleOAuthMessage);
        };
    }, [oauthPopup, refresh]);

    const openOAuthFlow = async (useSameTab = false) => {
        if (loading) return;

        setLoading(true);

        try {
            const res = await adminRequest("/meta/oauth/start");

            const finalOauthUrl = res?.oauthUrl || oauthUrl;

            if (!res?.success || !finalOauthUrl) {
                if (res?.message?.includes("Database temporarily unavailable") || res?.message?.includes("connection")) {
                    throw new Error("Database connection issue. Please try again in a few minutes");
                } else if (res?.message === 'Invalid or expired token' || res?.message === 'No token provided' || res?.message === 'User not found with this token') {
                    throw new Error("Please login again");
                }
                throw new Error(res?.message || "Failed to get Meta login URL");
            }

            if (process.env.NODE_ENV === "development" && res.devDiagnostics) {
                console.log("[Meta OAuth] Dev diagnostics:", res.devDiagnostics);
            }

            if (useSameTab) {
                window.location.href = finalOauthUrl;
                return;
            }

            const width = 600;
            const height = 750;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                finalOauthUrl,
                "meta_oauth_popup",
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
            );

            if (!popup || popup.closed || typeof popup.closed === "undefined") {
                toast.error("Popup blocked. Use the button below to open Meta login in this tab.");
                setLoading(false);
                return;
            }

            popup.focus();
            setOauthPopup(popup);
            setOauthPolling(true);
            setOauthSuccessReceived(false);
            oauthSuccessRef.current = false;

            const popupCheckInterval = setInterval(async () => {
                if (popup.closed) {
                    clearInterval(popupCheckInterval);

                    setOauthPolling(false);
                    setLoading(false);

                    if (!oauthSuccessRef.current && refresh) {
                        await refresh();
                    }

                    if (!oauthSuccessRef.current) {
                        toast(
                                (t) => (
                                    <span style={{ fontSize: "13px", lineHeight: "1.6" }}>
                                        <strong>Meta popup closed without connecting.</strong><br />
                                        If you saw &quot;Can&apos;t load URL&quot;, complete the Meta Developer App setup checklist below, then try again.
                                    </span>
                                ),
                                { duration: 10000 }
                            );
                    }
                }
            }, 1000);
        } catch (err) {
            toast.error(err.message || "Meta connection failed");
            setLoading(false);
            setOauthPolling(false);
        }
    };

    const handleConnectMetaAccount = () => openOAuthFlow(false);

    const handleSelectBusiness = async (biz) => {
        setLoading(true);

        try {
            const res = await adminRequest("/meta/select-business", "POST", {
                businessId: biz.id,
                businessName: biz.name,
                setupStep: 3
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to save business");
            }

            setSelectedAsset((prev) => ({
                ...prev,
                businessId: biz.id,
                adAccountId: "",
                pixelId: ""
            }));

            setAssets((prev) => ({
                ...prev,
                adAccounts: [],
                pixels: []
            }));

            setStep(3);
        } catch (err) {
            toast.error(err.message || "Failed to select business");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAdAccount = async (acc) => {
        setLoading(true);

        try {
            const res = await adminRequest("/meta/select-ad-account", "POST", {
                adAccountId: acc.id,
                adAccountName: acc.name,
                adAccountCurrency: acc.currency,
                setupStep: 4
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to save ad account");
            }

            setSelectedAsset((prev) => ({
                ...prev,
                adAccountId: acc.id,
                pixelId: ""
            }));

            setAssets((prev) => ({
                ...prev,
                pixels: []
            }));

            setStep(4);
        } catch (err) {
            toast.error(err.message || "Failed to select ad account");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPixel = async (px) => {
        setLoading(true);

        try {
            const res = await adminRequest("/meta/select-pixel", "POST", {
                pixelId: px.id,
                pixelName: px.name,
                setupStep: 5
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to save pixel");
            }

            setSelectedAsset((prev) => ({
                ...prev,
                pixelId: px.id
            }));

            setStep(5);
        } catch (err) {
            toast.error(err.message || "Failed to select pixel");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveManualPixel = async (data) => {
        if (!data.pixelId?.trim()) {
            toast.error("Pixel ID is required.");
            return;
        }

        setLoading(true);

        try {
            const res = await adminRequest("/meta/manual-pixel", "POST", {
                pixelId: data.pixelId.trim(),
                pixelName: data.pixelName?.trim() || "Manual Pixel",
                setupStep: 5
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to save Pixel");
            }

            toast.success("Pixel ID saved!");

            setSelectedAsset((prev) => ({
                ...prev,
                pixelId: data.pixelId.trim()
            }));

            setFallbackMode(false);
            setStep(5);
        } catch (err) {
            toast.error(err.message || "Failed to save Pixel");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPage = async (pg) => {
        setLoading(true);

        try {
            const res = await adminRequest("/meta/select-page", "POST", {
                pageId: pg.id,
                pageName: pg.name,
                setupStep: 6
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to save page");
            }

            setSelectedAsset((prev) => ({
                ...prev,
                pageId: pg.id
            }));

            setStep(6);
        } catch (err) {
            toast.error(err.message || "Failed to select page");
        } finally {
            setLoading(false);
        }
    };

    const handleActivateMetaIntegration = async (e) => {
        e?.preventDefault?.();

        if (loading) return;

        const finalPixelId = selectedAsset.pixelId || config?.pixelId;
        const finalPageId = selectedAsset.pageId || config?.pageId;
        const finalBusinessId = selectedAsset.businessId || config?.businessId;
        const finalAdAccountId = selectedAsset.adAccountId || config?.adAccountId;

        if (!finalBusinessId) {
            toast.error("Please select a Business Manager first.");
            setStep(2);
            return;
        }

        if (!finalAdAccountId) {
            toast.error("Please select an Ad Account first.");
            setStep(3);
            return;
        }

        if (!finalPixelId) {
            toast.error("Please select or enter a Pixel ID first.");
            setStep(4);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                isPixelEnabled: true,
                isCapiEnabled: Boolean(config?.hasCapiToken),
                dataSharingLevel: "maximum",
                deduplicationEnabled: true,
                enabledEvents: [
                    "PageView",
                    "ViewContent",
                    "Search",
                    "AddToCart",
                    "InitiateCheckout",
                    "Purchase"
                ],
                setupCompleted: true,
                setupStep: 7,
                connectionStatus: "connected",

                businessId: finalBusinessId,
                adAccountId: finalAdAccountId,
                pixelId: finalPixelId,
                pageId: finalPageId || ""
            };

            const res = await adminRequest("/meta/settings", "POST", payload);

            if (!res?.success) {
                throw new Error(res?.message || "Activation failed");
            }

            setIsActivatingSuccess(true);
            setStep(7);

            toast.success("Meta integration activated successfully!");

            if (refresh) {
                await refresh();
            }
        } catch (err) {
            toast.error(err.message || "Activation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleReconfigureSetup = async () => {
        setLoading(true);

        try {
            setIsActivatingSuccess(false);

            const res = await adminRequest("/meta/settings", "POST", {
                setupCompleted: false,
                setupStep: 2
            });

            if (!res?.success) {
                throw new Error(res?.message || "Failed to start reconfiguration");
            }

            if (refresh) {
                await refresh();
            }

            setStep(2);
            toast.success("Setup reconfiguration started.");
        } catch (err) {
            toast.error(err.message || "Failed to reconfigure setup");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#1877F2] rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/30 animate-float">
                    <Facebook size={40} />
                </div>

                <div className="space-y-1">
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019]">
                        Connect Facebook & Instagram
                    </h1>
                    <p className="text-neutral-500 font-medium">
                        Follow these steps to sync your products and track conversions with Meta.
                    </p>
                </div>
            </div>

            {/* Progress Tracker */}
            <div className="flex justify-between items-center px-4 relative max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-100 -translate-y-1/2 -z-10" />

                {[1, 2, 3, 4, 5, 6].map((s) => (
                    <div
                        key={s}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-4 ${step > s || step === 7
                                ? "bg-green-500 border-green-500 text-white"
                                : step === s
                                    ? "bg-white border-[#0a4019] text-[#0a4019]"
                                    : "bg-white border-neutral-100 text-neutral-300"
                            }`}
                    >
                        {step > s || step === 7 ? <Check size={16} /> : s}
                    </div>
                ))}
            </div>

            {/* Wizard Card */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm min-h-[400px] flex flex-col justify-center transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0a4019]/[0.02] rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Welcome to Meta Channel"
                            description="Connect your Meta account to start syncing products and tracking sales."
                        />

                        <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1877F2] shadow-sm shrink-0">
                                    <ShieldCheck size={20} />
                                </div>

                                <div>
                                    <p className="font-bold text-[#0a4019] text-sm">
                                        Secure Connection
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        StorVia uses Meta&apos;s official Marketing API to securely manage your assets.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <MetaOAuthSetupChecklist configCheck={oauthConfigCheck} />

                        <button
                            onClick={handleConnectMetaAccount}
                            disabled={loading}
                            className="w-full bg-[#1877F2] text-white px-8 py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <Facebook size={24} />
                            )}

                            <span>
                                {loading
                                    ? oauthPolling
                                        ? "Waiting for Meta popup..."
                                        : "Connecting..."
                                    : "Connect Meta Account"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => openOAuthFlow(true)}
                            disabled={loading}
                            className="w-full text-sm font-semibold text-[#1877F2] hover:underline disabled:opacity-50"
                        >
                            Popup blocked? Open Meta login in this tab
                        </button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Select Business Manager"
                            description="Choose the Meta Business Account that owns your store assets."
                        />

                        {loading ? (
                            <LoadingState />
                        ) : (
                            <div className="space-y-3">
                                {assets.businesses.map((biz) => (
                                    <AssetCard
                                        key={biz.id}
                                        icon={<Database size={20} />}
                                        title={biz.name}
                                        id={biz.id}
                                        onClick={() => handleSelectBusiness(biz)}
                                        selected={selectedAsset.businessId === biz.id}
                                    />
                                ))}

                                {assets.businesses.length === 0 && (
                                    <EmptyState
                                        label="No Business Managers found."
                                        onRefresh={() => fetchAssets("businesses")}
                                    />
                                )}
                            </div>
                        )}

                        <BackButton onClick={() => setStep(1)} />
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Select Ad Account"
                            description="Choose the Ad Account you use for advertising this store."
                        />

                        {loading ? (
                            <LoadingState />
                        ) : (
                            <div className="space-y-3">
                                {assets.adAccounts.map((acc) => (
                                    <AssetCard
                                        key={acc.id}
                                        icon={<Target size={20} />}
                                        title={acc.name}
                                        subtitle={`${acc.currency || "Currency N/A"} • ${acc.id}`}
                                        id={acc.id}
                                        onClick={() => handleSelectAdAccount(acc)}
                                        selected={selectedAsset.adAccountId === acc.id}
                                    />
                                ))}

                                {assets.adAccounts.length === 0 && (
                                    <EmptyState
                                        label="No Ad Accounts found."
                                        onRefresh={() =>
                                            fetchAssets("adAccounts", selectedAsset.businessId)
                                        }
                                    />
                                )}
                            </div>
                        )}

                        <BackButton onClick={() => setStep(2)} />
                    </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Select Pixel / Dataset"
                            description="Choose a Pixel to track customer actions and optimize ads."
                        />

                        {fallbackMode ? (
                            <ManualPixelForm
                                onBack={() => setFallbackMode(false)}
                                onSave={handleSaveManualPixel}
                                loading={loading}
                            />
                        ) : (
                            <>
                                {loading ? (
                                    <LoadingState />
                                ) : (
                                    <div className="space-y-3">
                                        {assets.pixels.map((px) => (
                                            <AssetCard
                                                key={px.id}
                                                icon={<Database size={20} />}
                                                title={px.name}
                                                id={px.id}
                                                onClick={() => handleSelectPixel(px)}
                                                selected={selectedAsset.pixelId === px.id}
                                            />
                                        ))}

                                        {assets.pixels.length === 0 && (
                                            <EmptyState
                                                label="No Pixels found."
                                                onRefresh={() =>
                                                    fetchAssets("pixels", selectedAsset.adAccountId)
                                                }
                                            />
                                        )}

                                        <button
                                            onClick={() => setFallbackMode(true)}
                                            className="w-full py-4 border-2 border-dashed border-neutral-100 rounded-[2rem] text-xs font-bold text-neutral-400 hover:border-neutral-200 hover:text-[#0a4019] transition-all"
                                        >
                                            + Enter Pixel ID Manually
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <BackButton onClick={() => setStep(3)} />
                    </div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Select Facebook Page"
                            description="Choose the Page representing your business on Facebook."
                        />

                        {loading ? (
                            <LoadingState />
                        ) : (
                            <div className="space-y-3">
                                {assets.pages.map((pg) => (
                                    <AssetCard
                                        key={pg.id}
                                        icon={<Facebook size={20} />}
                                        title={pg.name}
                                        subtitle={pg.category || "Facebook Page"}
                                        id={pg.id}
                                        onClick={() => handleSelectPage(pg)}
                                        selected={selectedAsset.pageId === pg.id}
                                    />
                                ))}

                                {assets.pages.length === 0 && (
                                    <EmptyState
                                        label="No Facebook Pages found."
                                        onRefresh={() => fetchAssets("pages")}
                                    />
                                )}
                            </div>
                        )}

                        <BackButton onClick={() => setStep(4)} />
                    </div>
                )}

                {/* STEP 6 */}
                {step === 6 && (
                    <div className="space-y-8 animate-fadeIn">
                        <StepHeader
                            title="Finish Setup"
                            description="Enable recommended tracking settings for best performance."
                        />

                        <div className="p-6 bg-green-50 border-2 border-green-100 rounded-[2.5rem] flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-sm border border-green-100">
                                    <Zap size={24} />
                                </div>

                                <div>
                                    <p className="font-bold text-[#0a4019]">
                                        Maximum Tracking
                                    </p>
                                    <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-0.5">
                                        Pixel + Conversions API + Event Deduplication
                                    </p>
                                </div>
                            </div>

                            <span className="bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                                Recommended
                            </span>
                        </div>

                        <button
                            onClick={handleActivateMetaIntegration}
                            disabled={loading}
                            className="w-full bg-[#0a4019] text-white px-8 py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-[#0a4019]/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Activate Meta Integration</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <BackButton onClick={() => setStep(5)} />
                    </div>
                )}

                {/* STEP 7 */}
                {step === 7 && (
                    <div className="space-y-8 text-center max-w-2xl mx-auto py-4 animate-fadeIn">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                            <Check size={36} />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-[#0a4019]">
                                Meta Integration Active
                            </h2>
                            <p className="text-neutral-500">
                                Your store is now connected with Meta Pixel, tracking settings, and event deduplication.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <SummaryCard
                                label="Business"
                                value={config?.businessName || "Connected"}
                                subtitle={
                                    config?.businessId || selectedAsset.businessId
                                        ? `ID: ${config?.businessId || selectedAsset.businessId}`
                                        : ""
                                }
                            />

                            <SummaryCard
                                label="Ad Account"
                                value={config?.adAccountName || "Selected"}
                                subtitle={
                                    config?.adAccountId || selectedAsset.adAccountId
                                        ? `ID: ${config?.adAccountId || selectedAsset.adAccountId}`
                                        : ""
                                }
                            />

                            <SummaryCard
                                label="Pixel / Dataset"
                                value={config?.pixelName || selectedAsset?.pixelId || "Selected"}
                                subtitle={
                                    config?.pixelId || selectedAsset.pixelId
                                        ? `ID: ${config?.pixelId || selectedAsset.pixelId}`
                                        : ""
                                }
                            />

                            <SummaryCard
                                label="Conversions API"
                                value={
                                    config?.hasCapiToken
                                        ? "Token Saved"
                                        : "Token Not Added Yet"
                                }
                                color={
                                    config?.hasCapiToken
                                        ? "text-green-600"
                                        : "text-orange-600"
                                }
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <ActionButton
                                label="Manage Pixel"
                                onClick={() => setActiveTab?.("pixels")}
                                secondary
                            />

                            <ActionButton
                                label="Manage CAPI Token"
                                onClick={() => setActiveTab?.("capi")}
                                primary
                            />

                            <ActionButton
                                label="Refresh Status"
                                onClick={refresh}
                                secondary
                            />
                        </div>

                        <button
                            onClick={handleReconfigureSetup}
                            disabled={loading}
                            className="text-sm font-bold text-neutral-400 hover:text-[#0a4019] transition-colors mt-4 block mx-auto disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : "Reconfigure Setup"}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Help */}
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
                <AlertCircle size={16} />
                <span>Need help?</span>
                <a
                    href="#"
                    className="font-bold text-[#0a4019] hover:underline"
                >
                    View Documentation
                </a>
            </div>
        </div>
    );
}

/* Sub-components */

function StepHeader({ title, description }) {
    return (
        <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-[#0a4019]">
                {title}
            </h2>
            <p className="text-neutral-500 text-sm">
                {description}
            </p>
        </div>
    );
}

function BackButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-[#0a4019] mx-auto transition-colors"
        >
            <ArrowLeft size={14} />
            Go Back
        </button>
    );
}

function AssetCard({ icon, title, subtitle, id, onClick, selected }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${selected
                    ? "border-[#0a4019] bg-[#0a4019]/5"
                    : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-200"
                }`}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selected
                            ? "bg-[#0a4019] text-white"
                            : "bg-white text-neutral-400 border border-neutral-100 group-hover:text-[#0a4019]"
                        }`}
                >
                    {icon}
                </div>

                <div>
                    <p className="font-bold text-sm text-[#0a4019]">
                        {title || "Unnamed Asset"}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest mt-0.5">
                        {subtitle || `ID: ${id}`}
                    </p>
                </div>
            </div>

            {selected && (
                <div className="w-8 h-8 bg-[#0a4019] rounded-full flex items-center justify-center text-white">
                    <Check size={16} />
                </div>
            )}
        </button>
    );
}

function SummaryCard({ label, value, subtitle, color }) {
    return (
        <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-3xl">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {label}
            </p>

            <p className={`font-bold mt-1 ${color || "text-[#0a4019]"}`}>
                {value}
            </p>

            {subtitle && (
                <p className="text-[10px] text-neutral-400 mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function ActionButton({ label, onClick, primary }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 px-6 py-4 rounded-2xl font-bold text-sm transition-all border ${primary
                    ? "bg-[#0a4019] text-white hover:bg-black shadow-lg shadow-green-900/20"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-100"
                }`}
        >
            {label}
        </button>
    );
}

function ManualPixelForm({ onBack, onSave, loading }) {
    const [data, setData] = useState({
        pixelId: "",
        pixelName: ""
    });

    return (
        <div className="space-y-6 animate-fadeIn text-left">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                        Pixel Name
                    </label>

                    <input
                        type="text"
                        placeholder="e.g. Website Pixel"
                        className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#0a4019] outline-none"
                        value={data.pixelName}
                        onChange={(e) =>
                            setData((prev) => ({
                                ...prev,
                                pixelName: e.target.value
                            }))
                        }
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                        Pixel ID Required
                    </label>

                    <input
                        type="text"
                        placeholder="15-16 digit number"
                        className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#0a4019] outline-none"
                        value={data.pixelId}
                        onChange={(e) =>
                            setData((prev) => ({
                                ...prev,
                                pixelId: e.target.value
                            }))
                        }
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 bg-neutral-100 text-neutral-500 px-6 py-4 rounded-2xl font-bold text-sm"
                >
                    Go Back
                </button>

                <button
                    onClick={() => onSave(data)}
                    disabled={loading || !data.pixelId.trim()}
                    className="flex-1 bg-[#0a4019] text-white px-6 py-4 rounded-2xl font-bold text-sm disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save & Continue"}
                </button>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-neutral-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">
                Fetching Assets...
            </p>
        </div>
    );
}

function EmptyState({ label, onRefresh }) {
    return (
        <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 mx-auto">
                <AlertCircle size={32} />
            </div>

            <p className="text-neutral-500 font-medium text-sm">
                {label}
            </p>

            <button
                onClick={onRefresh}
                className="text-xs font-bold text-[#0a4019] underline underline-offset-4"
            >
                Refresh List
            </button>
        </div>
    );
}