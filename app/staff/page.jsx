"use client";
import { useAdmin } from '@/context/AdminContext';
import AdminTable from '@/components/admin/AdminTable';
import { useState, useMemo, useEffect } from 'react';
import { UserCog, Shield, Mail, Phone, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { Button, Input, Dropdown } from '@/components/ui';

export default function StaffAccountsPage() {
    const { staff: staffData, loading, fetchStaff, updateStaff, deleteUser } = useAdmin();
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleManage = (member) => {
        setSelectedStaff({ ...member });
        setIsModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedStaff) return;
        setIsSaving(true);
        const res = await updateStaff(selectedStaff._id, {
            role: selectedStaff.role,
            status: selectedStaff.status
        });
        setIsSaving(false);
        if (res?.success) {
            setIsModalOpen(false);
            setSelectedStaff(null);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to remove this staff member? This will revoke all administrative access.')) {
            await deleteUser(id);
        }
    };

    // Showing only staff accounts
    const staff = useMemo(() => staffData || [], [staffData]);

    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'User',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#0a4019] font-bold text-xs border border-neutral-200">
                        {row.original.name?.[0]}
                    </div>
                    <div>
                        <p className="font-bold text-[#0a4019] text-sm">{row.original.name}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{row.original.role}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'email',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Mail size={12}/> {row.original.email}
                    </div>
                    {row.original.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <Phone size={12}/> {row.original.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                    row.original.status === 'active' 
                    ? "bg-green-50 text-green-700 border-green-100" 
                    : "bg-red-50 text-red-700 border-red-100"
                }`}>
                    {row.original.status}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => handleManage(row.original)}
                    >
                        <UserCog size={12}/> Manage
                    </Button>
                    <button 
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove Access"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], [staffData]);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Staff Accounts</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Manage administrative access and roles</p>
                </div>
                <Button className="bg-[#0a4019] text-white gap-2">
                    <Shield size={18} /> Add Staff Member
                </Button>
            </div>
            
            <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm overflow-hidden">
                <AdminTable 
                    columns={columns} 
                    data={staff} 
                    loading={loading}
                />
            </div>

            {/* Manage Staff Modal */}
            {isModalOpen && selectedStaff && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-scaleUp">
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-neutral-100">
                            <div>
                                <h3 className="text-xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Manage Access</h3>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Updating permissions for {selectedStaff.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <X size={20} className="text-neutral-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-neutral-50 p-4 rounded-2xl flex items-center gap-4 border border-neutral-100">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0a4019] font-bold border border-neutral-200">
                                    {selectedStaff.name?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-[#0a4019]">{selectedStaff.name}</p>
                                    <p className="text-xs text-neutral-500">{selectedStaff.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Dropdown
                                    label="Administrative Role"
                                    value={selectedStaff.role}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                                    options={[
                                        { value: 'admin', label: 'Administrator (Full Access)' },
                                        { value: 'user', label: 'Staff Member (Limited)' },
                                        { value: 'customer', label: 'Demote to Customer' }
                                    ]}
                                />

                                <Dropdown
                                    label="Account Status"
                                    value={selectedStaff.status}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, status: e.target.value })}
                                    options={[
                                        { value: 'active', label: 'Active (Permitted)' },
                                        { value: 'banned', label: 'Suspended (Revoked)' }
                                    ]}
                                />
                            </div>

                            {selectedStaff.role === 'customer' && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                        Warning: Changing role to "Customer" will immediately remove this user from the staff list and revoke all dashboard access.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-2xl"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 rounded-2xl bg-[#0a4019] text-white"
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

