'use client';

import { useEffect, useState } from 'react';
import SidebarWrapper from '@/components/admin/SidebarWrapper';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/context/AuthContext';

const OrderSlider = dynamic(() => import('@/components/admin/OrderSlider').then((mod) => mod.default), {
    ssr: false,
    loading: () => null,
});

/**
 * ClientLayoutShell - Main layout wrapper
 * - Handles sidebar visibility based on route
 * - Does NOT handle authentication (that's done at page level)
 */
export default function ClientLayoutShell({ children }) {
    const pathname = usePathname();
    const [isLoginPage, setIsLoginPage] = useState(false);

    useEffect(() => {
        setIsLoginPage(pathname === '/login');
    }, [pathname]);

    const layoutContent = (
        <SidebarWrapper isLoginPage={isLoginPage}>
            {children}
            {!isLoginPage && <OrderSlider />}
        </SidebarWrapper>
    );

    return (
        <ProtectedRoute isLoginPage={isLoginPage}>
            {layoutContent}
        </ProtectedRoute>
    );
}
