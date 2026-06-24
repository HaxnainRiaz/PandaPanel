"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { ToastProvider } from "@/context/ToastContext";

export default function Providers({ children }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <AdminProvider>
                    {children}
                </AdminProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
