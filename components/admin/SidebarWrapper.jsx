"use client";

import Sidebar from "./Sidebar";

export default function SidebarWrapper({ children, isLoginPage }) {
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-[#2b2b3b] font-body">
            {!isLoginPage && <Sidebar />}
            <main className={!isLoginPage ? "transition-all duration-300 md:ml-64 min-h-screen p-4 sm:p-6 md:p-8" : ""}>
                <div className={!isLoginPage ? "max-w-7xl mx-auto animate-fadeIn" : ""}>
                    {children}
                </div>
            </main>
        </div>
    );
}
