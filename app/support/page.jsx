"use client";

import { useAdmin } from "@/context/AdminContext";
import { useState } from "react";
import {
    LifeBuoy,
    AlertCircle,
    CheckCircle,
    User,
    ShieldCheck
} from "lucide-react";

export default function SupportPage() {
    const { supportTickets, updateTicketStatus, replyToTicket, loading } = useAdmin();

    const [statusFilter, setStatusFilter] = useState("All");
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);

    const tickets = supportTickets || [];

    // Status mapping: UI Label -> Backend Value
    const statusMap = {
        'Open': 'open',
        'Pending': 'in-progress',
        'Resolved': 'resolved'
    };

    const filteredTickets = statusFilter === "All"
        ? tickets
        : tickets.filter((t) => {
            const backendStatus = statusMap[statusFilter];
            return t.status.toLowerCase() === backendStatus;
        });

    const toggleExpand = (id) => {
        setExpandedTicketId((prev) => (prev === id ? null : id));
    };

    const handleSendReply = async (e, ticketId) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setIsSending(true);
        const res = await replyToTicket(ticketId, reply);
        if (res?.success) setReply("");
        setIsSending(false);
    };

    const getPriorityColor = (p) => {
        const priority = p?.toLowerCase();
        if (priority === "high") return "text-red-600 bg-red-50 border-red-100";
        if (priority === "medium") return "text-orange-600 bg-orange-50 border-orange-100";
        return "text-green-600 bg-green-50 border-green-100";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-bold">Syncing Concierge Desk…</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-bold italic text-[#0a4019]">
                    Concierge Console
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Sustain customer excellence and brand fidelity
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Filters */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                            Dispatch Filters
                        </h3>

                        {["All", "Open", "Pending", "Resolved"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`w-full px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest mb-2 transition
                   ${statusFilter === status
                                        ? "bg-[#0a4019] text-white"
                                        : "hover:bg-neutral-100"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tickets */}
                <div className="md:col-span-3 space-y-4">
                    {filteredTickets.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-3xl border">
                            <LifeBuoy className="mx-auto mb-4 text-neutral-300" size={42} />
                            <h3 className="font-bold text-[#0a4019] text-xl italic">
                                No active tickets
                            </h3>
                        </div>
                    )}

                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket._id}
                            className="bg-white rounded-3xl border overflow-hidden"
                        >
                            {/* Header */}
                            <div
                                onClick={() => toggleExpand(ticket._id)}
                                className="p-6 cursor-pointer hover:bg-neutral-50 flex justify-between items-center"
                            >
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold italic text-[#0a4019]">
                                            {ticket.subject}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getPriorityColor(
                                                ticket.priority
                                            )}`}
                                        >
                                            {ticket.priority}
                                        </span>
                                    </div>

                                    <p className="text-xs text-neutral-400 mt-1">
                                        #{ticket._id.slice(-6).toUpperCase()} •{" "}
                                        {ticket.user?.name || "Customer"} •{" "}
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <span
                                    className={`px-4 py-2 text-[10px] font-bold rounded-full border capitalize ${ticket.status.toLowerCase() === "resolved"
                                        ? "bg-green-50 text-green-700 border-green-100"
                                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                                        }`}
                                >
                                    {ticket.status}
                                </span>
                            </div>

                            {/* Expanded Chat */}
                            {expandedTicketId === ticket._id && (
                                <>
                                    <div className="border-t p-6 space-y-6 max-h-[500px] overflow-y-auto">
                                        {/* Original client message */}
                                        <div className="flex gap-4 justify-start">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center">
                                                <User size={18} />
                                            </div>
                                            <div className="max-w-[80%]">
                                                <div className="bg-neutral-100 p-4 rounded-2xl rounded-tl-none text-sm">
                                                    {ticket.message}
                                                </div>
                                                <span className="text-[10px] text-neutral-400 mt-1 block ml-2">
                                                    Customer
                                                </span>
                                            </div>
                                        </div>

                                        {/* Replies */}
                                        {(ticket.replies || []).map((msg, idx) => {
                                            const isAdmin =
                                                msg.sender === "admin" || msg.isAdmin === true;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex gap-4 ${isAdmin ? "justify-end" : "justify-start"
                                                        }`}
                                                >
                                                    {!isAdmin && (
                                                        <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center">
                                                            <User size={18} />
                                                        </div>
                                                    )}

                                                    <div className="max-w-[80%]">
                                                        <div
                                                            className={`p-4 rounded-2xl text-sm shadow-sm
                                ${isAdmin
                                                                    ? "bg-[#0a4019] text-white rounded-tr-none"
                                                                    : "bg-neutral-100 rounded-tl-none"
                                                                }`}
                                                        >
                                                            {msg.message}
                                                        </div>
                                                        <span className={`text-[10px] text-neutral-400 mt-1 block ${isAdmin ? "text-right" : ""}`}>
                                                            {isAdmin ? "Admin" : "Customer"} •{" "}
                                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="w-10 h-10 rounded-xl bg-[#0a4019] text-white flex items-center justify-center">
                                                            <ShieldCheck size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Reply box - Hidden if Resolved */}
                                    {ticket.status.toLowerCase() !== "resolved" ? (
                                        <div className="border-t p-6 bg-white">
                                            <form
                                                onSubmit={(e) => handleSendReply(e, ticket._id)}
                                                className="flex gap-3"
                                            >
                                                <input
                                                    value={reply}
                                                    onChange={(e) => setReply(e.target.value)}
                                                    placeholder="Type your response…"
                                                    className="flex-1 px-4 py-3 rounded-xl border bg-neutral-50 text-sm"
                                                />
                                                <button
                                                    disabled={isSending}
                                                    className="px-6 py-3 bg-[#0a4019] text-white rounded-xl text-xs font-bold uppercase"
                                                >
                                                    {isSending ? "Sending…" : "Send"}
                                                </button>
                                            </form>

                                            <button
                                                onClick={() =>
                                                    updateTicketStatus(ticket._id, "resolved")
                                                }
                                                className="mt-3 text-xs font-bold text-green-600 uppercase hover:underline"
                                            >
                                                Mark as resolved
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-t p-6 bg-neutral-50 text-center">
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                                This inquiry has been resolved. Messaging is disabled.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
