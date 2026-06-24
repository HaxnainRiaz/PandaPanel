"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { 
    History, 
    Download,
    Search, 
    Filter, 
    RefreshCw, 
    CheckCircle2, 
    XCircle, 
    Globe, 
    Server, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    X, 
    AlertTriangle, 
    Play, 
    Check, 
    Copy, 
    Clock, 
    ShieldAlert, 
    ExternalLink, 
    ArrowRight 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function MetaEventLogs() {
    const { adminRequest } = useAdmin();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ eventName: "", status: "", source: "" });
    
    // Details drawer states
    const [selectedLog, setSelectedLog] = useState(null);
    const [activeTab, setActiveTab] = useState("payload"); // "payload" | "response" | "matching"

    const fetchLogs = async () => {
        setLoading(true);
        const query = new URLSearchParams({ page, limit: 15, ...filters }).toString();
        const res = await adminRequest(`/meta/event-logs?${query}`);
        if (res?.success) {
            setLogs(res.data);
            setTotal(res.pagination.total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const handleProcessQueue = async () => {
        setActionLoading(true);
        const res = await adminRequest("/meta/process-pending", "POST");
        if (res?.success) {
            toast.success(res.message || "Queue processed successfully");
            fetchLogs();
        } else {
            toast.error(res?.message || "Failed to process queue");
        }
        setActionLoading(false);
    };

    const handleRetryLog = async (logId) => {
        setActionLoading(true);
        const res = await adminRequest(`/meta/retry/${logId}`, "POST");
        if (res?.success) {
            toast.success("Event queued and processed for retry!");
            fetchLogs();
            setSelectedLog(null);
        } else {
            toast.error(res?.message || "Failed to retry event");
        }
        setActionLoading(false);
    };

    const handleRetryAll = async () => {
        if (!confirm("Are you sure you want to retry all failed/dead events?")) return;
        setActionLoading(true);
        const res = await adminRequest("/meta/retry-all", "POST");
        if (res?.success) {
            toast.success(res.message || "All failed events queued for retry");
            fetchLogs();
        } else {
            toast.error(res?.message || "Failed to retry events");
        }
        setActionLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2));
        toast.success("JSON copied to clipboard!");
    };

    const handleExportCSV = () => {
        if (!logs || logs.length === 0) {
            toast.error("No logs available to export");
            return;
        }

        // CSV Header
        const headers = ["Event Name", "Event ID", "Source", "Status", "Attempts", "Match Keys", "Created At", "Error Message"];
        
        // CSV Rows
        const rows = logs.map(log => {
            const matchKeys = [];
            if (log.hasFbp) matchKeys.push("fbp");
            if (log.hasFbc) matchKeys.push("fbc");
            if (log.hasEmailHash) matchKeys.push("em");
            if (log.hasPhoneHash) matchKeys.push("ph");
            if (log.hasExternalId) matchKeys.push("ext");

            return [
                log.eventName,
                log.eventId,
                log.source,
                log.status,
                log.attempts || 0,
                matchKeys.join("|"),
                log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss") : "",
                log.errorMessage || ""
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `meta_event_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV exported successfully!");
    };

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-6 relative">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#0a4019]">Event Logs</h2>
                            <p className="text-sm text-neutral-500">History and queue status of all events sent to Meta.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Action buttons */}
                        <button
                            onClick={handleProcessQueue}
                            disabled={actionLoading || loading}
                            className="bg-white text-[#0a4019] border border-neutral-200 hover:bg-neutral-50 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} />
                            Process Queue
                        </button>
                        
                        <button
                            onClick={handleRetryAll}
                            disabled={actionLoading || loading}
                            className="bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <AlertTriangle size={14} />
                            Retry All Failed
                        </button>

                        <button
                            onClick={handleExportCSV}
                            disabled={loading || logs.length === 0}
                            className="bg-neutral-100 hover:bg-neutral-200 text-[#0a4019] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            <Download size={14} />
                            Export CSV
                        </button>

                        <button 
                            onClick={fetchLogs}
                            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-100 bg-neutral-50/50"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-[#0a4019]" : "text-neutral-400"} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                        <input 
                            type="text"
                            placeholder="Search event name..."
                            value={filters.eventName}
                            onChange={(e) => setFilters({ ...filters, eventName: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-[#0a4019] transition-colors"
                        />
                    </div>
                    <select 
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                        className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-[#0a4019] transition-colors"
                    >
                        <option value="">All Sources</option>
                        <option value="browser">Browser</option>
                        <option value="server">Server</option>
                    </select>
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-[#0a4019] transition-colors"
                    >
                        <option value="">All Statuses</option>
                        <option value="queued">Queued</option>
                        <option value="sent">Sent</option>
                        <option value="test_sent">Test Sent</option>
                        <option value="failed">Failed (Retryable)</option>
                        <option value="dead">Dead (Non-retryable)</option>
                        <option value="skipped_duplicate">Skipped (Duplicate)</option>
                    </select>
                    {(filters.eventName || filters.source || filters.status) && (
                        <button 
                            onClick={() => setFilters({ eventName: "", source: "", status: "" })}
                            className="text-xs text-neutral-400 hover:text-red-500 font-medium px-2"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Event Table */}
                <div className="overflow-x-auto no-scrollbar border border-neutral-100 rounded-3xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Event</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Source</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Match Keys</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 italic text-sm">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 italic text-sm">
                                        No event logs found matching filters.
                                    </td>
                                </tr>
                            ) : logs.map((log) => {
                                const matchedCount = [log.hasFbp, log.hasFbc, log.hasEmailHash, log.hasPhoneHash, log.hasExternalId].filter(Boolean).length;
                                return (
                                    <tr key={log._id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0a4019] text-xs flex items-center gap-1.5">
                                                    {log.eventName}
                                                    {log.testEventCodeUsed && (
                                                        <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                                            {log.testEventCodeUsed}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[9px] text-neutral-400 font-mono select-all">{log.eventId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${log.source === 'server' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                {log.source === 'server' ? <Server size={10} /> : <Globe size={10} />}
                                                {log.source}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                                log.status === 'success' || log.status === 'sent' || log.status === 'test_sent' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                log.status === 'queued' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                log.status === 'skipped_duplicate' ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' :
                                                'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                                {log.status === 'success' || log.status === 'sent' || log.status === 'test_sent' ? <CheckCircle2 size={10} /> : 
                                                 log.status === 'queued' ? <Clock size={10} /> : <XCircle size={10} />}
                                                {log.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.source === 'server' ? (
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${matchedCount >= 3 ? 'bg-green-50 text-green-700' : matchedCount >= 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                                                        {matchedCount}/5 keys
                                                    </span>
                                                    <div className="flex gap-0.5">
                                                        <span title="FBP" className={`w-2 h-2 rounded-full ${log.hasFbp ? 'bg-green-500' : 'bg-neutral-200'}`} />
                                                        <span title="FBC" className={`w-2 h-2 rounded-full ${log.hasFbc ? 'bg-green-500' : 'bg-neutral-200'}`} />
                                                        <span title="Email" className={`w-2 h-2 rounded-full ${log.hasEmailHash ? 'bg-green-500' : 'bg-neutral-200'}`} />
                                                        <span title="Phone" className={`w-2 h-2 rounded-full ${log.hasPhoneHash ? 'bg-green-500' : 'bg-neutral-200'}`} />
                                                        <span title="Ext ID" className={`w-2 h-2 rounded-full ${log.hasExternalId ? 'bg-green-500' : 'bg-neutral-200'}`} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic font-medium">Direct Pixel</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                                                {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setActiveTab("payload");
                                                }}
                                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-[#0a4019]"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-neutral-100">
                        <p className="text-xs text-neutral-400">
                            Showing <span className="text-[#0a4019] font-bold">{(page-1)*15 + 1}</span> to <span className="text-[#0a4019] font-bold">{Math.min(page*15, total)}</span> of <span className="text-[#0a4019] font-bold">{total}</span> events
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-neutral-100 rounded-xl disabled:opacity-30 hover:bg-neutral-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-[#0a4019] px-4">Page {page} of {totalPages}</span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-neutral-100 rounded-xl disabled:opacity-30 hover:bg-neutral-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sliding Details Drawer */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setSelectedLog(null)}
                    />

                    {/* Drawer Panel */}
                    <div className="relative w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out border-l border-neutral-100 animate-slide-in">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-[#0a4019]">{selectedLog.eventName}</h3>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                        selectedLog.source === 'server' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                    }`}>
                                        {selectedLog.source}
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                        selectedLog.status === 'success' || selectedLog.status === 'sent' || selectedLog.status === 'test_sent' ? 'bg-green-50 text-green-700 border border-green-100' :
                                        selectedLog.status === 'queued' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                        'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                        {selectedLog.status.replace('_', ' ')}
                                    </div>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-mono select-all">Event ID: {selectedLog.eventId}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400 hover:text-neutral-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-neutral-100 px-6">
                            <button
                                onClick={() => setActiveTab("payload")}
                                className={`py-4 px-4 font-bold text-xs border-b-2 transition-all ${
                                    activeTab === "payload" 
                                        ? "border-[#0a4019] text-[#0a4019]" 
                                        : "border-transparent text-neutral-400 hover:text-neutral-600"
                                }`}
                            >
                                Safe Payload
                            </button>
                            <button
                                onClick={() => setActiveTab("response")}
                                className={`py-4 px-4 font-bold text-xs border-b-2 transition-all ${
                                    activeTab === "response" 
                                        ? "border-[#0a4019] text-[#0a4019]" 
                                        : "border-transparent text-neutral-400 hover:text-neutral-600"
                                }`}
                            >
                                Server Response
                            </button>
                            <button
                                onClick={() => setActiveTab("matching")}
                                className={`py-4 px-4 font-bold text-xs border-b-2 transition-all ${
                                    activeTab === "matching" 
                                        ? "border-[#0a4019] text-[#0a4019]" 
                                        : "border-transparent text-neutral-400 hover:text-neutral-600"
                                }`}
                            >
                                Deduplication & Keys
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Delivery Metadata Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
                                <div>
                                    <p className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Logged Time</p>
                                    <p className="font-semibold text-neutral-800">{format(new Date(selectedLog.createdAt), "MMM d, HH:mm:ss")}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Response Time</p>
                                    <p className="font-semibold text-neutral-800">{selectedLog.responseTimeMs ? `${selectedLog.responseTimeMs}ms` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Attempts</p>
                                    <p className="font-semibold text-neutral-800">{selectedLog.attempts}/{selectedLog.maxAttempts}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Pixel ID / Dataset</p>
                                    <p className="font-semibold text-neutral-800 font-mono text-[10px] select-all">{selectedLog.pixelId || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Error Alert Box */}
                            {selectedLog.errorMessage && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
                                    <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-0.5">Transmission Failure Error</p>
                                        <p className="font-mono text-[10px] text-red-600 bg-red-100/50 p-2 rounded-lg mt-1 whitespace-pre-wrap select-all">{selectedLog.errorMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tab 1: Payload Viewer */}
                            {activeTab === "payload" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest">Pre-hashed Event Payload</h4>
                                        <button 
                                            onClick={() => copyToClipboard(selectedLog.requestPayloadSafe)}
                                            className="text-[10px] font-bold text-neutral-400 hover:text-[#0a4019] flex items-center gap-1 uppercase tracking-widest"
                                        >
                                            <Copy size={12} /> Copy JSON
                                        </button>
                                    </div>
                                    <div className="bg-neutral-950 text-neutral-300 p-5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner max-h-[400px] border border-neutral-800 leading-relaxed">
                                        <pre>{JSON.stringify(selectedLog.requestPayloadSafe, null, 4)}</pre>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 italic">🔒 Privacy Protection: All user parameters (emails, phones, etc.) are SHA-256 hashed immediately in-memory before saving to queue databases.</p>
                                </div>
                            )}

                            {/* Tab 2: Response Viewer */}
                            {activeTab === "response" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest">Facebook Graph API Server Response</h4>
                                        {selectedLog.responsePayloadSafe && (
                                            <button 
                                                onClick={() => copyToClipboard(selectedLog.responsePayloadSafe)}
                                                className="text-[10px] font-bold text-neutral-400 hover:text-[#0a4019] flex items-center gap-1 uppercase tracking-widest"
                                            >
                                                <Copy size={12} /> Copy JSON
                                            </button>
                                        )}
                                    </div>
                                    {selectedLog.responsePayloadSafe ? (
                                        <div className="bg-neutral-950 text-neutral-300 p-5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner max-h-[400px] border border-neutral-800 leading-relaxed">
                                            <pre>{JSON.stringify(selectedLog.responsePayloadSafe, null, 4)}</pre>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-neutral-400 border border-neutral-100 rounded-2xl italic text-xs">
                                            No server response recorded yet. (Common for client Pixel direct events or queued/skipped status).
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Matching / Deduplication Keys */}
                            {activeTab === "matching" && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest">Deduplication spine</h4>
                                        <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-green-800">Deduplication Key:</span>
                                                <span className="font-mono text-xs select-all bg-white px-2 py-0.5 rounded border border-green-100 font-bold text-[#0a4019]">
                                                    {selectedLog.deduplicationKey || `${selectedLog.eventName}:${selectedLog.eventId}`}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-green-700/80 leading-relaxed">
                                                Meta's deduplication mechanism compares incoming browser Pixel and server CAPI event streams. By sharing this exact Event ID spine, duplicate counts are suppressed.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-[#0a4019] uppercase tracking-widest">PII & Cookie Match checklist</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <MatchKeyCard title="fbp (Browser Cookie)" active={selectedLog.hasFbp} desc="Identifies Facebook browser sessions." />
                                            <MatchKeyCard title="fbc (Click ID Cookie)" active={selectedLog.hasFbc} desc="Identifies specific ad click referrals." />
                                            <MatchKeyCard title="em (Email Hash)" active={selectedLog.hasEmailHash} desc="Matches event to a Facebook account." />
                                            <MatchKeyCard title="ph (Phone Hash)" active={selectedLog.hasPhoneHash} desc="Validates mobile account connection." />
                                            <MatchKeyCard title="external_id (User ID Hash)" active={selectedLog.hasExternalId} desc="Uniquely ties client records together." />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="p-6 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50 gap-4">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-3 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-all flex-1"
                            >
                                Close View
                            </button>

                            {selectedLog.source === 'server' && (selectedLog.status === 'failed' || selectedLog.status === 'dead') && (
                                <button
                                    onClick={() => handleRetryLog(selectedLog._id)}
                                    disabled={actionLoading}
                                    className="bg-[#0a4019] text-white hover:bg-[#051712] px-6 py-3 rounded-xl text-xs font-bold transition-all flex-1 flex items-center justify-center gap-2 shadow-lg shadow-[#0a4019]/10 disabled:opacity-50"
                                >
                                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                    Retry Delivery Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MatchKeyCard({ title, active, desc }) {
    return (
        <div className={`p-4 rounded-2xl border flex gap-3 items-start ${active ? 'bg-green-50/30 border-green-100 text-green-800' : 'bg-neutral-50/50 border-neutral-100 text-neutral-400'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${active ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-400'}`}>
                {active ? <Check size={12} /> : <X size={10} />}
            </div>
            <div>
                <p className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                    {title}
                    {active && <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded uppercase tracking-wider font-bold">Present</span>}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
