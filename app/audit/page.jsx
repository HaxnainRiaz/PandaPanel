"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useMemo, useEffect } from 'react';
import { format } from 'date-fns';

export default function AuditLogPage() {
    const { auditLogs, loading, fetchAuditLogs } = useAdmin();

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    const columns = useMemo(() => [
        {
            accessorKey: 'createdAt',
            header: 'Timestamp',
            cell: ({ row }) => <span className="text-xs text-neutral-500 font-medium">{format(new Date(row.original.createdAt), 'MMM d, HH:mm:ss')}</span>
        },
        {
            accessorKey: 'admin.name',
            header: 'Actor',
            cell: ({ row }) => <span className="font-bold text-[#0a4019]">{row.original.admin?.name || 'System'}</span>
        },
        {
            accessorKey: 'action',
            header: 'Action',
            cell: ({ row }) => <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-600">{row.original.action}</span>
        },
        {
            accessorKey: 'details',
            header: 'Details',
            cell: ({ row }) => <span className="text-sm text-neutral-600 line-clamp-1">{row.original.details}</span>
        }
    ], []);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Audit Log</h1>
            </div>
            
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden">
                <AdminTable 
                    columns={columns} 
                    data={auditLogs || []} 
                    loading={loading}
                />
            </div>
        </div>
    );
}

