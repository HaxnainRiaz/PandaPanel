"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Route Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
        <AlertCircle size={32} />
      </div>
      
      <h2 className="text-2xl font-bold text-[#0a4019] mb-2 italic">Something went wrong</h2>
      <p className="text-neutral-500 max-w-sm mb-8 font-medium">
        We encountered an error while loading this section. Please try refreshing or contact support if the issue persists.
      </p>
      
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 bg-[#0a4019] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/20 active:scale-95"
      >
        <RefreshCcw size={18} />
        Retry Loading
      </button>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-left max-w-2xl overflow-auto">
          <p className="text-[10px] font-mono text-red-800">
            {error?.stack || error?.message}
          </p>
        </div>
      )}
    </div>
  );
}
