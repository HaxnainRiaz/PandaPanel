"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FDFCFB] flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          
          <h1 className="text-3xl font-bold text-[#0a4019]">System Error</h1>
          <p className="text-neutral-500">
            A critical error occurred in the administrative panel. We have been notified and are looking into it.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="bg-[#0a4019] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/20"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="text-[#0a4019] font-bold text-sm hover:underline"
            >
              Return to Dashboard
            </button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-left">
              <p className="text-[10px] font-mono text-red-800 break-all">
                {error?.message || "Unknown error"}
              </p>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
