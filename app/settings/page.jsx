"use client";
import { useAdmin } from '@/context/AdminContext';
import { useState } from 'react';
import { Settings, Truck, User, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { settings, adminRequest, refreshData } = useAdmin();
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState(settings || {});

    const handleSave = async () => {
        try {
            const res = await adminRequest('/settings', 'PATCH', formData);
            if (res?.success) {
                toast.success('Settings updated successfully');
                refreshData();
            }
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'shipping', label: 'Logistics (PostEx)', icon: Truck },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-8 pb-20 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest">Settings</h1>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Configure your store and logistics ecosystem</p>
                </div>
                <Button onClick={handleSave} className="bg-[#0a4019] text-white gap-2">
                    <Save size={18} /> Save Changes
                </Button>
            </div>

            <div className="flex gap-8">
                <div className="w-64 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? "bg-[#0a4019] text-white shadow-lg" 
                                : "text-neutral-500 hover:bg-neutral-100"
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-[#0a4019] uppercase tracking-widest text-xs border-b pb-4">Store Information</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Store Name</label>
                                    <input 
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#0a4019] outline-none"
                                        value={formData.storeName || ''}
                                        onChange={e => setFormData({...formData, storeName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Support Email</label>
                                    <input 
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#0a4019] outline-none"
                                        value={formData.supportEmail || ''}
                                        onChange={e => setFormData({...formData, supportEmail: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-[#0a4019] uppercase tracking-widest text-xs border-b pb-4">PostEx Integration</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">API Token</label>
                                    <input 
                                        type="password"
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#0a4019] outline-none"
                                        value={formData.postexToken || ''}
                                        onChange={e => setFormData({...formData, postexToken: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Default Pickup Address Code</label>
                                        <input 
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#0a4019] outline-none"
                                            value={formData.defaultPickupCode || 'DEFAULT'}
                                            onChange={e => setFormData({...formData, defaultPickupCode: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Default Order Type</label>
                                        <select 
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#0a4019] outline-none"
                                            value={formData.defaultOrderType || 'Normal'}
                                            onChange={e => setFormData({...formData, defaultOrderType: e.target.value})}
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="Reverse">Reverse</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
