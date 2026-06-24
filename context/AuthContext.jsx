'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';

import { getApiUrl } from '@/lib/apiConfig';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state
 * - Loads user from localStorage
 * - Handles login/logout
 * - Provides token to other providers
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    const buildCookie = (tokenValue = '', maxAge = 0) => {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const secureSegment = isSecure ? '; Secure' : '';
        return `token=${tokenValue}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureSegment}`;
    };

    const setAuthCookie = (tokenValue) => {
        document.cookie = buildCookie(tokenValue, 60 * 60 * 24 * 7);
    };

    const clearAuthCookie = () => {
        document.cookie = buildCookie('', 0);
    };

    // Initialize auth from localStorage (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') {
            setHydrated(true);
            return;
        }

        const initAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                setHydrated(true);
                return;
            }

            try {
                const res = await fetch(`${getApiUrl()}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (data.success && data.data?.role === 'admin') {
                    setUser(data.data);
                    setAuthCookie(token);
                } else {
                    // Clear invalid auth
                    localStorage.removeItem('token');
                    clearAuthCookie();
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                localStorage.removeItem('token');
                clearAuthCookie();
                setUser(null);
            } finally {
                setLoading(false);
                setHydrated(true);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const url = `${getApiUrl()}/auth/login`;
            console.log(`📝 Attempting login at: ${url}`);
            
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: String(email).trim().toLowerCase(),
                    password: String(password),
                }),
            });

            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await res.json()
                : { success: false, message: await res.text() };

            if (!res.ok || !data.success) {
                return {
                    success: false,
                    message: data.message || `Login failed (HTTP ${res.status})`,
                };
            }

            console.log(`✅ Response received:`, data);

            // Check if user is admin
            if (data.user?.role !== 'admin') {
                return {
                    success: false,
                    message: 'Access denied. Only admins can enter here.',
                };
            }

            // Store token in both localStorage and cookie
            const token = data.token;
            localStorage.setItem('token', token);
            setAuthCookie(token);

            setUser(data.user);

            return { success: true };
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                message: `Connection error: ${error.message}. Make sure backend is running on port 5000.`,
            };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        clearAuthCookie();
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        hydrated,
    }), [user, loading, login, logout, hydrated]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth - Hook to access auth context
 * Returns safe defaults if context is not available
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        return {
            user: null,
            loading: true,
            login: async () => ({ success: false, message: 'Auth not initialized' }),
            logout: () => { },
            hydrated: false,
        };
    }

    return context;
};

/**
 * ProtectedRoute - Wrapper for pages that need authentication
 * - Shows loader while checking auth
 * - Redirects to login if not authenticated
 * - Only runs on client-side after hydration
 */
export const ProtectedRoute = ({ children, isLoginPage = false }) => {
    const { user, loading, hydrated } = useAuth();
    const pathname = usePathname();
    const [canRender, setCanRender] = useState(false);

    useEffect(() => {
        if (!hydrated) return;

        // If we're on login page and user is logged in, redirect to dashboard
        if (isLoginPage && user) {
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                window.location.replace('/');
            }
            return;
        }

        // If we're on protected page and user is not logged in, redirect to login
        if (!isLoginPage && !loading && !user) {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
            return;
        }

        setCanRender(true);
    }, [user, loading, hydrated, isLoginPage, pathname]);

    // On login page, show children (login form) immediately even during hydration/loading
    if (isLoginPage) {
        return <>{children}</>;
    }

    // For protected pages, show loader while checking auth
    if (!hydrated || loading || !canRender) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#FDFCFB] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
};