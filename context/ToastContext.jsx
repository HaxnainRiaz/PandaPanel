'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 min-w-[320px] pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border animate-slideInRight
                            ${toast.type === 'success' ? 'bg-[#0a4019] text-[#d3d3d3] border-[#0a4019]/20' : ''}
                            ${toast.type === 'error' ? 'bg-red-600 text-white border-red-500' : ''}
                            ${toast.type === 'info' ? 'bg-[#d3d3d3] text-[#0a4019] border-[#d3d3d3]/20' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 p-1 rounded-full hover:bg-black/10 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
