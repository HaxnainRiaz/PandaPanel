"use client";

import { useAdmin } from "@/context/AdminContext";
import { Star, MessageSquare, Check, X, Send, User, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

export default function ReviewsPage() {
    const { reviews, updateReview, loading, fetchReviews } = useAdmin();
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSaveStatus = async (id, status, reply = null) => {
        const updateData = { status };
        if (reply !== null) updateData.adminReply = reply;
        const success = await updateReview(id, updateData);
        if (success) {
            setReplyingTo(null);
            setReplyText("");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-9 h-9 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="admin-page-header">
                <h1>Customer Reviews</h1>
                <p className="text-sm text-gray-500 mt-1">Approve, reject, and respond to product reviews</p>
            </div>

            <div className="space-y-4">
                {reviews.length > 0 ? (
                    [...reviews].reverse().map((review) => (
                        <div key={review._id} className="admin-card p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                            <span className="text-xs font-semibold text-[#1a1a2e] ml-1">{review.rating}.0</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div>
                                        {review.title && (
                                            <h3 className="text-sm font-semibold text-[#1a1a2e]">{review.title}</h3>
                                        )}
                                        {review.comment && (
                                            <p className="text-sm text-gray-600 leading-relaxed mt-1">{review.comment}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {review.user?.name || review.name || "Customer"}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            {review.product?.title || "Product"}
                                        </span>
                                    </div>

                                    {review.adminReply && (
                                        <div className="p-3 bg-[#f8f9fa] rounded-[10px] border border-[#e5e7eb]">
                                            <p className="text-xs font-semibold text-[#e63946] mb-1">Your response</p>
                                            <p className="text-sm text-gray-600">{review.adminReply}</p>
                                        </div>
                                    )}

                                    {replyingTo === review._id && (
                                        <div className="space-y-3 p-4 bg-[#f8f9fa] rounded-[12px] border border-[#e5e7eb]">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a response to the customer..."
                                                rows={3}
                                                className="w-full p-3 text-sm border border-[#e5e7eb] rounded-[10px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946]"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyingTo(null)}
                                                    className="px-4 py-2 text-sm text-gray-500 hover:text-[#1a1a2e]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveStatus(review._id, review.status, replyText)}
                                                    disabled={!replyText.trim()}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#1a1a2e] text-white rounded-[10px] hover:bg-[#16213e] disabled:opacity-50"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    Send Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row lg:flex-col items-center lg:items-stretch justify-between lg:justify-center gap-4 lg:w-44 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e5e7eb] pt-4 lg:pt-0 lg:pl-6">
                                    <span className={`
                                        inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize
                                        ${review.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : ''}
                                        ${review.status === 'pending' ? 'bg-amber-50 text-amber-700' : ''}
                                        ${review.status === 'rejected' ? 'bg-red-50 text-red-700' : ''}
                                    `}>
                                        {review.status}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {review.status === "pending" && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveStatus(review._id, 'approved')}
                                                    className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[10px] hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center border border-emerald-100"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveStatus(review._id, 'rejected')}
                                                    className="w-10 h-10 bg-red-50 text-red-600 rounded-[10px] hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center border border-red-100"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {!review.adminReply && replyingTo !== review._id && (
                                            <button
                                                type="button"
                                                onClick={() => { setReplyingTo(review._id); setReplyText(""); }}
                                                className="w-10 h-10 bg-gray-50 text-gray-500 rounded-[10px] hover:bg-[#1a1a2e] hover:text-white transition-colors flex items-center justify-center border border-[#e5e7eb]"
                                                title="Reply"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="admin-card text-center py-16 px-6">
                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-[#1a1a2e]">No reviews yet</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Customer reviews will appear here for moderation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
