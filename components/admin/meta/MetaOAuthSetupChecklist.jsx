"use client";

import { AlertCircle, CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MetaOAuthSetupChecklist({ configCheck }) {
    const [copied, setCopied] = useState(null);

    if (!configCheck) return null;

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            toast.success(`Copied ${label}`);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error("Could not copy to clipboard");
        }
    };

    const redirectUri = configCheck.redirectUri || "http://localhost:5000/api/meta/oauth/callback";

    return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-bold text-[#1a1a2e] text-sm">Meta Developer App setup required</h3>
                    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                        Facebook shows &quot;Can&apos;t load URL&quot; when App Domains or Valid OAuth Redirect URIs
                        do not match your backend callback. Add the values below in{" "}
                        <a
                            href="https://developers.facebook.com/apps/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold inline-flex items-center gap-1"
                        >
                            Meta for Developers <ExternalLink size={12} />
                        </a>
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                <ChecklistBlock
                    title="Settings → Basic → App Domains"
                    subtitle="Domains only — no http://, paths, or ports"
                    items={configCheck.requiredAppDomains?.length ? configCheck.requiredAppDomains : ["localhost"]}
                    copied={copied}
                    onCopy={copyText}
                />

                <ChecklistBlock
                    title="Facebook Login → Settings → Valid OAuth Redirect URIs"
                    subtitle="Must match exactly (protocol, host, port, path)"
                    items={configCheck.requiredValidOAuthRedirectUris?.length ? configCheck.requiredValidOAuthRedirectUris : [redirectUri]}
                    copied={copied}
                    onCopy={copyText}
                    highlight
                />

                <ChecklistBlock
                    title="Facebook Login → Settings (enable)"
                    subtitle="Turn on Client OAuth Login and Web OAuth Login"
                    items={["Client OAuth Login: ON", "Web OAuth Login: ON"]}
                />
            </div>

            {configCheck.warnings?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                    {configCheck.warnings.map((w) => (
                        <p key={w.code + w.message} className="text-xs text-amber-900 flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {w.message}
                        </p>
                    ))}
                </div>
            )}

            {configCheck.isConfigValid && (
                <p className="text-xs text-green-700 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={14} />
                    Backend OAuth config looks valid. If login still fails, verify the Meta dashboard values above.
                </p>
            )}
        </div>
    );
}

function ChecklistBlock({ title, subtitle, items, copied, onCopy, highlight }) {
    return (
        <div className={`rounded-xl p-4 ${highlight ? "bg-white border border-amber-200" : "bg-white/60"}`}>
            <p className="text-xs font-bold text-[#1a1a2e]">{title}</p>
            <p className="text-[10px] text-gray-500 mb-2">{subtitle}</p>
            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex items-center justify-between gap-2">
                        <code className="text-[11px] bg-gray-100 px-2 py-1 rounded text-[#1a1a2e] break-all flex-1">
                            {item}
                        </code>
                        {onCopy && (
                            <button
                                type="button"
                                onClick={() => onCopy(item, item)}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                                title="Copy"
                            >
                                {copied === item ? (
                                    <CheckCircle2 size={14} className="text-green-600" />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const META_ERROR_MESSAGES = {
    app_domain_mismatch:
        "Facebook blocked the URL. Add localhost to App Domains and the exact callback URL to Valid OAuth Redirect URIs in your Meta app.",
    redirect_uri_mismatch:
        "Redirect URI mismatch. The Meta app callback must exactly match http://localhost:5000/api/meta/oauth/callback (or your production API URL).",
    invalid_state: "OAuth session expired or was tampered with. Please try connecting again.",
    token_exchange_failed: "Could not exchange authorization code for a token. Check META_APP_SECRET and redirect URI settings.",
    facebook_denied: "Meta authorization was denied or cancelled.",
    missing_code: "Meta did not return an authorization code.",
    missing_env: "Server Meta OAuth environment variables are not configured.",
    missing_permissions: "Required Meta permissions were not granted.",
    unknown: "Meta connection failed. Check Diagnostics or try again.",
};

export function getMetaErrorMessage(code) {
    return META_ERROR_MESSAGES[code] || META_ERROR_MESSAGES.unknown;
}
