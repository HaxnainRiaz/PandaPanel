"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import useOrderStore from "@/store/useOrderStore";

const AdminContext = createContext();

let API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && API_URL.includes('localhost')) {
    API_URL = 'https://store-backend-neon.vercel.app/api';
}

export const AdminProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for all data
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({});
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [settings, setSettings] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [banners, setBanners] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newsletter, setNewsletter] = useState([]);
    const [blogs, setBlogs] = useState([]);

    useEffect(() => {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        setToken(storedToken);
    }, []);

    const adminRequest = useCallback(async (url, method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            ...(body && { body: JSON.stringify(body) })
        };

        try {
            const res = await fetch(`${API_URL}${url}`, options);
            
            // Check if response is JSON before parsing
            const contentType = res.headers.get("content-type");
            let data = {};
            
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                // If not JSON (likely 404 or server error), consume as text but don't parse
                const text = await res.text();
                console.warn(`Non-JSON response from ${url}:`, text.slice(0, 100));
            }
            
            if (!res.ok) {
                return { 
                    success: false, 
                    message: data.message || `Error ${res.status}: ${res.statusText}` 
                };
            }
            
            return data;
        } catch (err) {
            console.error(`Request failed: ${url}`, err);
            return { success: false, message: 'Network error or server is offline' };
        }
    }, []);

    const fetchData = useCallback(async (options = { forceAll: false }) => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Essential data for the dashboard
            const essentialActions = [
                { key: 'stats', action: () => adminRequest('/stats/dashboard'), setter: setStats },
                { key: 'products', action: () => adminRequest('/products'), setter: setProducts },
                { key: 'orders', action: () => adminRequest('/orders'), setter: setOrders }
            ];

            // Other data that can be lazy loaded
            const lazyActions = [
                { key: 'users', action: () => adminRequest('/users'), setter: setCustomers },
                { key: 'staff', action: () => adminRequest('/users/staff'), setter: setStaff },
                { key: 'tickets', action: () => adminRequest('/support-tickets'), setter: setSupportTickets },
                { key: 'settings', action: () => adminRequest('/settings'), setter: setSettings },
                { key: 'audit', action: () => adminRequest('/audit'), setter: setAuditLogs },
                { key: 'categories', action: () => adminRequest('/categories'), setter: setCategories },
                { key: 'coupons', action: () => adminRequest('/coupons'), setter: setCoupons },
                { key: 'banners', action: () => adminRequest('/banners'), setter: setBanners },
                { key: 'reviews', action: () => adminRequest('/reviews'), setter: setReviews },
                { key: 'newsletter', action: () => adminRequest('/newsletter'), setter: setNewsletter },
                { key: 'blogs', action: () => adminRequest('/blogs'), setter: setBlogs }
            ];

            const actionsToRun = options.forceAll ? [...essentialActions, ...lazyActions] : essentialActions;

            // Execute in parallel and update state immediately
            await Promise.allSettled(actionsToRun.map(async ({ action, setter }) => {
                const res = await action();
                if (res?.success) setter(res.data);
            }));

            setLoading(false);
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [token, adminRequest]);

    // Specific fetchers for pages to call
    const fetchSupportTickets = useCallback(async () => {
        const res = await adminRequest('/support-tickets');
        if (res?.success) setSupportTickets(res.data);
        return res;
    }, [adminRequest]);

    const fetchAuditLogs = useCallback(async () => {
        const res = await adminRequest('/audit');
        if (res?.success) setAuditLogs(res.data);
        return res;
    }, [adminRequest]);

    const fetchCustomers = useCallback(async () => {
        const res = await adminRequest('/users');
        if (res?.success) setCustomers(res.data);
        return res;
    }, [adminRequest]);

    const fetchStaff = useCallback(async () => {
        const res = await adminRequest('/users/staff');
        if (res?.success) setStaff(res.data);
        return res;
    }, [adminRequest]);

    const fetchReviews = useCallback(async () => {
        const res = await adminRequest('/reviews');
        if (res?.success) setReviews(res.data);
        return res;
    }, [adminRequest]);

    const fetchBlogs = useCallback(async () => {
        const res = await adminRequest('/blogs');
        if (res?.success) setBlogs(res.data);
        return res;
    }, [adminRequest]);

    const fetchNewsletter = useCallback(async () => {
        const res = await adminRequest('/newsletter');
        if (res?.success) setNewsletter(res.data);
        return res;
    }, [adminRequest]);

    const fetchSettings = useCallback(async () => {
        const res = await adminRequest('/settings');
        if (res?.success) setSettings(res.data);
        return res;
    }, [adminRequest]);

    const fetchInventoryData = useCallback(async () => {
        const res = await adminRequest('/products');
        if (res?.success) setProducts(res.data);
        return res;
    }, [adminRequest]);

    const fetchProducts = fetchInventoryData;

    const fetchCategories = useCallback(async () => {
        const res = await adminRequest('/categories');
        if (res?.success) setCategories(res.data);
        return res;
    }, [adminRequest]);

    const fetchCoupons = useCallback(async () => {
        const res = await adminRequest('/coupons');
        if (res?.success) setCoupons(res.data);
        return res;
    }, [adminRequest]);

    const fetchBanners = useCallback(async () => {
        const res = await adminRequest('/banners');
        if (res?.success) setBanners(res.data);
        return res;
    }, [adminRequest]);

    // --- Socket.IO Integration ---
    useEffect(() => {
        let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && socketUrl.includes('localhost')) {
            socketUrl = 'https://store-backend-neon.vercel.app';
        }

        // Dynamic import to avoid SSR issues if any, though useEffect runs on client
        import('socket.io-client').then(({ io }) => {
            const socket = io(socketUrl, {
                transports: ['websocket'],
                reconnection: true,
            });

            socket.on('connect', () => {
                console.log('🟢 Connected to WebSocket Stream');
            });

            // --- Product Events ---
            socket.on('product:create', (newProduct) => {
                setProducts(prev => {
                    if (prev.find(p => p._id === newProduct._id)) return prev;
                    return [newProduct, ...prev];
                });
            });

            socket.on('product:update', (updatedProduct) => {
                setProducts(prev => prev.map(p => p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p));
            });

            socket.on('product:delete', ({ id }) => {
                setProducts(prev => prev.filter(p => p._id !== id));
            });

            // --- Order Events ---
            socket.on('order:new', (newOrder) => {
                setOrders(prev => {
                    if (prev.find(o => o._id === newOrder._id)) return prev;
                    return [newOrder, ...prev];
                });
                adminRequest('/stats/dashboard').then(res => res.success && setStats(res.data));
            });

            socket.on('order:update', (updatedOrder) => {
                const state = useOrderStore.getState();
                const isDirty = state.dirtyOrderIds && state.dirtyOrderIds.has(updatedOrder._id);
                
                if (isDirty) {
                    console.log(`🟡 Ignoring socket update for dirty order: ${updatedOrder._id}`);
                    return;
                }

                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            });

            // --- Review Events ---
            socket.on('review:new', (newReview) => {
                setReviews(prev => {
                    if (prev.find(r => r._id === newReview._id)) return prev;
                    return [newReview, ...prev];
                });
            });

            // --- Support Ticket Events ---
            socket.on('support:ticket:new', (newTicket) => {
                setSupportTickets(prev => {
                    if (prev.find(t => t._id === newTicket._id)) return prev;
                    return [newTicket, ...prev];
                });
            });
            socket.on('support:ticket:update', (updatedTicket) => {
                setSupportTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            });
            socket.on('support:message', (updatedTicket) => {
                setSupportTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            });

            // --- Blog Events ---
            socket.on('blog:create', (newBlog) => {
                setBlogs(prev => {
                    if (prev.find(b => b._id === newBlog._id)) return prev;
                    return [newBlog, ...prev];
                });
            });
            socket.on('blog:update', (updatedBlog) => setBlogs(prev => prev.map(b => b._id === updatedBlog._id ? updatedBlog : b)));
            socket.on('blog:delete', ({ id }) => setBlogs(prev => prev.filter(b => b._id !== id)));

            // --- Category Events ---
            socket.on('category:update', (cat) => {
                if (cat.delete) {
                    setCategories(prev => prev.filter(c => c._id !== cat.id));
                } else {
                    setCategories(prev => {
                        const exists = prev.find(c => c._id === cat._id);
                        if (exists) return prev.map(c => c._id === cat._id ? cat : c);
                        return [cat, ...prev];
                    });
                }
            });

            // --- Coupon Events ---
            socket.on('coupon:new', (c) => {
                setCoupons(prev => {
                    if (prev.find(coupon => coupon._id === c._id)) return prev;
                    return [c, ...prev];
                });
            });
            socket.on('coupon:update', (c) => setCoupons(prev => prev.map(prevC => prevC._id === c._id ? c : prevC)));
            socket.on('coupon:delete', ({ id }) => setCoupons(prev => prev.filter(c => c._id !== id)));

            // --- Banner Events ---
            socket.on('banner:new', (b) => {
                setBanners(prev => {
                    if (prev.find(banner => banner._id === b._id)) return prev;
                    return [b, ...prev];
                });
            });
            socket.on('banner:update', (b) => setBanners(prev => prev.map(prevB => prevB._id === b._id ? b : prevB)));
            socket.on('banner:delete', ({ id }) => setBanners(prev => prev.filter(b => b._id !== id)));

            // --- Newsletter & CMS ---
            socket.on('newsletter:new', (sub) => setNewsletter(prev => [sub, ...prev]));
            socket.on('cms:update', (cmsData) => setSettings(prev => ({ ...prev, ...cmsData })));

            return () => {
                socket.disconnect();
            };
        });
    }, [adminRequest]); // Add other dependencies if needed, but [] or [token] is usually enough.

    useEffect(() => {
        if (token) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [token, fetchData]);

    // --- Action Wrappers (Keep existing implementation) ---

    const addProduct = async (product) => {
        const res = await adminRequest('/products', 'POST', product);
        if (res?.success) {
            setProducts(prev => {
                if (prev.find(p => p._id === res.data._id)) return prev;
                return [res.data, ...prev];
            });
        }
        return res;
    };

    const updateProduct = async (id, updatedData) => {
        const prevProducts = [...products];
        setProducts(prev => prev.map(p => p._id === id ? { ...p, ...updatedData } : p));
        const res = await adminRequest(`/products/${id}`, 'PUT', updatedData);
        if (res?.success) setProducts(prev => prev.map(p => p._id === id ? res.data : p));
        else setProducts(prevProducts);
        return res;
    };

    const deleteProduct = async (id) => {
        const prevProducts = [...products];
        setProducts(prev => prev.filter(p => p._id !== id));
        const res = await adminRequest(`/products/${id}`, 'DELETE');
        if (!res?.success) setProducts(prevProducts);
        return res;
    };

    const updateCustomer = async (id, updatedData) => {
        const prevCustomers = [...customers];
        setCustomers(prev => prev.map(c => c._id === id ? { ...c, ...updatedData } : c));
        const res = await adminRequest(`/users/${id}`, 'PUT', updatedData);
        if (res?.success) setCustomers(prev => prev.map(c => c._id === id ? res.data : c));
        else setCustomers(prevCustomers);
        return res;
    };

    const updateStaff = async (id, updatedData) => {
        const prevStaff = [...staff];
        setStaff(prev => prev.map(s => s._id === id ? { ...s, ...updatedData } : s));
        const res = await adminRequest(`/users/${id}`, 'PUT', updatedData);
        if (res?.success) setStaff(prev => prev.map(s => s._id === id ? res.data : s));
        else setStaff(prevStaff);
        return res;
    };

    const deleteUser = async (id) => {
        const prevCustomers = [...customers];
        const prevStaff = [...staff];
        setCustomers(prev => prev.filter(c => c._id !== id));
        setStaff(prev => prev.filter(s => s._id !== id));
        const res = await adminRequest(`/users/${id}`, 'DELETE');
        if (!res?.success) {
            setCustomers(prevCustomers);
            setStaff(prevStaff);
        }
        return res;
    };

    const addBlog = async (blog) => {
        const res = await adminRequest('/blogs', 'POST', blog);
        if (res?.success) {
            setBlogs(prev => {
                if (prev.find(b => b._id === res.data._id)) return prev;
                return [res.data, ...prev];
            });
        }
        return res;
    };

    const updateBlog = async (id, updatedData) => {
        const prevBlogs = [...blogs];
        setBlogs(prev => prev.map(b => b._id === id ? { ...b, ...updatedData } : b));
        const res = await adminRequest(`/blogs/${id}`, 'PUT', updatedData);
        if (res?.success) setBlogs(prev => prev.map(b => b._id === id ? res.data : b));
        else setBlogs(prevBlogs);
        return res;
    };

    const deleteBlog = async (id) => {
        const prevBlogs = [...blogs];
        setBlogs(prev => prev.filter(b => b._id !== id));
        const res = await adminRequest(`/blogs/${id}`, 'DELETE');
        if (!res?.success) setBlogs(prevBlogs);
        return res;
    };

    const updateOrderStatus = async (id, status) => {
        const previousOrders = [...orders];
        setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: status } : o));
        const res = await adminRequest(`/orders/${id}/status`, 'PUT', { status });
        if (res?.success) setOrders(prev => prev.map(o => o._id === id ? res.data : o));
        else setOrders(previousOrders);
        return res;
    };

    const updateOrder = useCallback(async (id, updatedData) => {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, ...updatedData } : o));
    }, []);


    const replyToTicket = async (id, message) => {
        const res = await adminRequest(`/support-tickets/${id}/reply`, 'POST', { message, sender: 'admin' });
        if (res?.success) setSupportTickets(prev => prev.map(t => t._id === id ? res.data : t));
        return res;
    };

    const updateSettings = async (body) => {
        const prevSettings = settings;
        setSettings(prev => ({ ...prev, ...body }));
        const res = await adminRequest('/settings', 'PUT', body);
        if (res?.success) setSettings(res.data);
        else setSettings(prevSettings);
        return res;
    };

    const addCategory = async (cat) => {
        const res = await adminRequest('/categories', 'POST', cat);
        if (res?.success) {
            setCategories(prev => {
                if (prev.find(c => c._id === res.data._id)) return prev;
                return [res.data, ...prev];
            });
        }
        return res;
    };

    const updateCategory = async (id, updatedData) => {
        const prevCategories = [...categories];
        setCategories(prev => prev.map(c => c._id === id ? { ...c, ...updatedData } : c));
        const res = await adminRequest(`/categories/${id}`, 'PUT', updatedData);
        if (res?.success) setCategories(prev => prev.map(c => c._id === id ? res.data : c));
        else setCategories(prevCategories);
        return res;
    };

    const deleteCategory = async (id) => {
        const prevCategories = [...categories];
        setCategories(prev => prev.filter(c => c._id !== id));
        const res = await adminRequest(`/categories/${id}`, 'DELETE');
        if (!res?.success) setCategories(prevCategories);
        return res;
    };

    const addBanner = async (banner) => {
        const res = await adminRequest('/banners', 'POST', banner);
        if (res?.success) {
            setBanners(prev => {
                if (prev.find(b => b._id === res.data._id)) return prev;
                return [res.data, ...prev];
            });
        }
        return res;
    };

    const deleteBanner = async (id) => {
        const prevBanners = [...banners];
        setBanners(prev => prev.filter(b => b._id !== id));
        const res = await adminRequest(`/banners/${id}`, 'DELETE');
        if (!res?.success) setBanners(prevBanners);
        return res;
    };

    const updateTicket = async (id, body) => {
        const prevTickets = [...supportTickets];
        setSupportTickets(prev => prev.map(t => t._id === id ? { ...t, ...body } : t));
        const res = await adminRequest(`/support-tickets/${id}`, 'PUT', body);
        if (res?.success) setSupportTickets(prev => prev.map(t => t._id === id ? res.data : t));
        else setSupportTickets(prevTickets);
        return res;
    };

    const updateTicketStatus = async (id, status) => {
        return await updateTicket(id, { status });
    };

    const updateReview = async (id, body) => {
        const prevReviews = [...reviews];
        setReviews(prev => prev.map(r => r._id === id ? { ...r, ...body } : r));
        const res = await adminRequest(`/reviews/${id}`, 'PUT', body);
        if (res?.success) setReviews(prev => prev.map(r => r._id === id ? res.data : r));
        else setReviews(prevReviews);
        return res;
    };

    const addCoupon = async (c) => {
        const res = await adminRequest('/coupons', 'POST', c);
        if (res?.success) {
            setCoupons(prev => {
                if (prev.find(prevC => prevC._id === res.data._id)) return prev;
                return [res.data, ...prev];
            });
        }
        return res;
    };

    const deleteCoupon = async (id) => {
        const prevCoupons = [...coupons];
        setCoupons(prev => prev.filter(c => c._id !== id));
        const res = await adminRequest(`/coupons/${id}`, 'DELETE');
        if (!res?.success) setCoupons(prevCoupons);
        return res;
    };

    const filterStats = useCallback(async (month, year) => {
        const query = `?month=${month}&year=${year}`;
        const res = await adminRequest(`/stats/dashboard${query}`);
        if (res?.success) {
            setStats(res.data);
        }
        return res;
    }, [adminRequest]);

    const contextValue = React.useMemo(() => ({
        stats, products, categories, orders, reviews, customers, staff, coupons,
        banners, settings, auditLogs, supportTickets, newsletter, blogs,
        addProduct, updateProduct, deleteProduct,
        addBlog, updateBlog, deleteBlog,
        updateCustomer, updateStaff, deleteUser,
        updateOrderStatus, updateSettings, replyToTicket, updateTicketStatus,
        updateOrder,
        addCategory, updateCategory, deleteCategory, addBanner, deleteBanner, updateTicket, updateReview,
        addCoupon, deleteCoupon, adminRequest, filterStats,
        fetchProducts,
        loading, error, refreshData: fetchData,
        fetchSupportTickets, fetchAuditLogs, fetchCustomers, fetchStaff, fetchReviews, fetchBlogs, fetchNewsletter, 
        fetchSettings, fetchInventoryData, fetchCategories, fetchCoupons, fetchBanners
    }), [
        stats, products, categories, orders, reviews, customers, staff, coupons,
        banners, settings, auditLogs, supportTickets, newsletter, blogs,
        loading, error, fetchData, adminRequest, updateOrder, updateOrderStatus, updateProduct, updateCustomer, updateStaff, deleteUser, filterStats,
        fetchProducts,
        fetchSupportTickets, fetchAuditLogs, fetchCustomers, fetchStaff, fetchReviews, fetchBlogs, fetchNewsletter, 
        fetchSettings, fetchInventoryData, fetchCategories, fetchCoupons, fetchBanners
    ]);

    return (
        <AdminContext.Provider value={contextValue}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
