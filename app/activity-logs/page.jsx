"use client";

import React, { useState } from "react";
import { Button, SearchBar } from "@/components/ui";
import { History, Download, Calendar, ShieldAlert, Monitor, Terminal } from "lucide-react";
import toast from "react-hot-toast";

export default function ActivityLogsPage() {
    const [logs] = useState([
        { id: 1, action: "Restocked Inventory SKU", performedBy: "Admin Core (System)", module: "Inventory", date: "2026-06-02 10:20", ip: "192.168.1.5 (Chrome / Win)", status: "Success" },
        { id: 2, action: "Updated Store Identity Profile", performedBy: "Seller Hasnain", module: "Store Setup", date: "2026-06-02 10:15", ip: "192.168.1.1 (Firefox / Mac)", status: "Success" },
        { id: 3, action: "Failed Staff Authorization", performedBy: "Unknown Auditor", module: "Staff Accounts", date: "2026-06-01 23:40", ip: "182.190.22.4 (Safari / iOS)", status: "Warning" },
        { id: 4, action: "Exported Platform Audit Ledger", performedBy: "Seller Hasnain", module: "Operations", date: "2026-06-01 15:30", ip: "192.168.1.1 (Firefox / Mac)", status: "Success" },
        { id: 5, action: "Modified Ad Campaign Eid Buzz", performedBy: "Seller Hasnain", module: "Growth Tools", date: "2026-06-01 12:10", ip: "192.168.1.1 (Firefox / Mac)", status: "Success" }
    ]);

    const [searchTerm, setSearchTerm] = useState("");

    const handleExport = () => {
        toast.loading("Compiling CSV audit trail ledger...", { id: "export-logs" });
        setTimeout(() => {
            toast.success("CSV audit ledger download dispatched!", { id: "export-logs" });
        }, 1000);
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Activity Logs</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Audit administrative operations, staff events, and platform login coordinate trails</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchBar
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 md:w-64"
                    />
                    <Button onClick={handleExport} icon={Download}>
                        Export Logs
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Operational Event</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Performed By</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Segment</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">IP Coordinate & Device</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                                    <Terminal size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-[#0a4019]">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-semibold text-[#6B6B6B]">
                                            {log.performedBy}
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                            {log.module}
                                        </td>
                                        <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium flex items-center gap-1.5 pt-6.5">
                                            <Calendar size={12} className="text-[#B8A68A]" />
                                            <span>{log.date}</span>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-semibold flex items-center gap-1.5 pt-6.5">
                                            <Monitor size={12} className="text-[#B8A68A]" />
                                            <span>{log.ip}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1 ${
                                                log.status === "Success"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            }`}>
                                                {log.status === "Warning" && <ShieldAlert size={10} />}
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <History className="mx-auto text-neutral-200 mb-4" size={48} />
                                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">No Audit Trail Found</h3>
                                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">Try resetting filters to locate logs.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
