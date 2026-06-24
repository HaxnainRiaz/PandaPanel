"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import toast from 'react-hot-toast';
import { Truck, Link2, Unlink, CheckCircle, XCircle, AlertCircle, Loader2, Save, RefreshCw, MapPin } from 'lucide-react';

export default function PostExSettingsPage() {
    const { adminRequest } = useAdmin();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [defaultPickup, setDefaultPickup] = useState('');
    const [defaultStore, setDefaultStore] = useState('');
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ address: '', cityName: '', contactName: '', contactPhone: '' });

    const fetchStatus = async () => {
        setLoading(true);
        const res = await adminRequest('/postex/status');
        if (res?.success) setStatus(res.data);
        setLoading(false);
    };

    const fetchAddresses = async () => {
        setAddressesLoading(true);
        const res = await adminRequest('/postex/pickup-addresses');
        if (res?.success) setPickupAddresses(res.data || []);
        else toast.error(res?.message || 'Could not load pickup addresses');
        setAddressesLoading(false);
    };

    useEffect(() => { fetchStatus(); }, []);
    useEffect(() => {
        if (status?.isConnected) {
            setDefaultPickup(status.defaultPickupAddressCode || '');
            setDefaultStore(status.defaultStoreAddressCode || '');
            fetchAddresses();
        }
    }, [status?.isConnected]);

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!apiToken.trim()) return toast.error('Please enter your PostEx API token');
        setSaving(true);
        const res = await adminRequest('/postex/connect', 'POST', { apiToken: apiToken.trim() });
        if (res?.success) {
            toast.success('PostEx connected successfully!');
            setApiToken('');
            await fetchStatus();
        } else {
            toast.error(res?.message || 'Connection failed');
        }
        setSaving(false);
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect PostEx? Existing shipments will not be affected.')) return;
        setDisconnecting(true);
        const res = await adminRequest('/postex/disconnect', 'DELETE');
        if (res?.success) {
            toast.success('PostEx disconnected');
            setStatus(prev => ({ ...prev, isConnected: false, connectionStatus: 'disconnected', apiTokenMasked: null }));
        } else toast.error(res?.message);
        setDisconnecting(false);
    };

    const handleSaveDefaults = async () => {
        const res = await adminRequest('/postex/defaults', 'PUT', { defaultPickupAddressCode: defaultPickup, defaultStoreAddressCode: defaultStore });
        if (res?.success) toast.success('Default addresses saved');
        else toast.error(res?.message);
    };

    const handleCreateAddress = async (e) => {
        e.preventDefault();
        const res = await adminRequest('/postex/pickup-addresses', 'POST', newAddress);
        if (res?.success) {
            toast.success('Pickup address created');
            setShowNewAddressForm(false);
            setNewAddress({ address: '', cityName: '', contactName: '', contactPhone: '' });
            fetchAddresses();
        } else toast.error(res?.message || 'Failed to create address');
    };

    const statusConfig = {
        connected:    { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Connected' },
        disconnected: { color: 'text-neutral-500', bg: 'bg-neutral-50 border-neutral-200', icon: XCircle,     label: 'Not Connected' },
        invalid_token:{ color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: AlertCircle,  label: 'Invalid Token' },
        error:        { color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',   icon: AlertCircle,  label: 'Error' },
    };
    const cfg = statusConfig[status?.connectionStatus] || statusConfig.disconnected;
    const StatusIcon = cfg.icon;

    if (loading) return (
        <div className="flex items-center justify-center h-60">
            <Loader2 className="animate-spin text-[#0a4019]" size={32} />
        </div>
    );

    return (
        <div className="space-y-8 pb-20 animate-fadeIn max-w-3xl">
            <div>
                <h1 className="text-3xl font-heading font-bold text-[#0a4019] uppercase tracking-widest flex items-center gap-3">
                    <Truck size={28} /> PostEx Settings
                </h1>
                <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-[0.2em]">Connect your PostEx merchant account</p>
            </div>

            {/* Status card */}
            <div className={`rounded-2xl border p-6 flex items-center gap-4 ${cfg.bg}`}>
                <StatusIcon className={cfg.color} size={28} />
                <div className="flex-1">
                    <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
                    {status?.apiTokenMasked && <p className="text-xs text-neutral-500 font-mono mt-0.5">Token: {status.apiTokenMasked}</p>}
                    {status?.lastVerifiedAt && <p className="text-xs text-neutral-400 mt-0.5">Last verified: {new Date(status.lastVerifiedAt).toLocaleString()}</p>}
                    {status?.lastErrorMessage && <p className="text-xs text-red-500 mt-0.5">{status.lastErrorMessage}</p>}
                </div>
                {status?.isConnected && (
                    <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex items-center gap-2 text-xs font-bold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-all"
                    >
                        {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                        Disconnect
                    </button>
                )}
            </div>

            {/* Connect form */}
            {!status?.isConnected && (
                <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2"><Link2 size={14}/> Connect PostEx Account</h2>
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-2">PostEx API Token</label>
                            <input
                                type="password"
                                value={apiToken}
                                onChange={e => setApiToken(e.target.value)}
                                placeholder="Paste your PostEx merchant API token…"
                                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20 focus:border-[#0a4019]"
                                required
                            />
                            <p className="text-xs text-neutral-400 mt-1">Your token will be encrypted before storage and never returned to the browser.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-[#0a4019] text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-[#0a4019]/90 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                            {saving ? 'Verifying & Connecting…' : 'Connect PostEx'}
                        </button>
                    </form>
                </div>
            )}

            {/* Default addresses */}
            {status?.isConnected && (
                <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600 flex items-center gap-2"><MapPin size={14}/> Default Addresses</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-2">Default Pickup Address Code</label>
                            <select value={defaultPickup} onChange={e => setDefaultPickup(e.target.value)} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20 focus:border-[#0a4019]">
                                <option value="">— None —</option>
                                {pickupAddresses.map(a => (
                                    <option key={a.addressCode || a._id} value={a.addressCode}>{a.address} ({a.cityName})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-2">Default Store Address Code</label>
                            <select value={defaultStore} onChange={e => setDefaultStore(e.target.value)} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4019]/20 focus:border-[#0a4019]">
                                <option value="">— None —</option>
                                {pickupAddresses.map(a => (
                                    <option key={a.addressCode || a._id} value={a.addressCode}>{a.address} ({a.cityName})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSaveDefaults} className="flex items-center gap-2 bg-[#0a4019] text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-[#0a4019]/90 transition-all">
                        <Save size={14}/> Save Defaults
                    </button>
                </div>
            )}

            {/* Pickup addresses list */}
            {status?.isConnected && (
                <div className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600 flex items-center gap-2"><MapPin size={14}/> Pickup Addresses</h2>
                        <div className="flex gap-2">
                            <button onClick={fetchAddresses} className="text-xs font-bold text-neutral-500 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 flex items-center gap-1">
                                <RefreshCw size={12}/> Refresh
                            </button>
                            <button onClick={() => setShowNewAddressForm(v => !v)} className="text-xs font-bold text-[#0a4019] border border-[#0a4019]/20 rounded-lg px-3 py-1.5 hover:bg-[#0a4019]/5 flex items-center gap-1">
                                + Add New
                            </button>
                        </div>
                    </div>

                    {showNewAddressForm && (
                        <form onSubmit={handleCreateAddress} className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">New Pickup Address</p>
                            {[
                                { key: 'address', label: 'Address', placeholder: 'Full street address' },
                                { key: 'cityName', label: 'City', placeholder: 'e.g. Karachi' },
                                { key: 'contactName', label: 'Contact Name', placeholder: 'Merchant contact name' },
                                { key: 'contactPhone', label: 'Contact Phone', placeholder: '03XXXXXXXXX' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs text-neutral-500 block mb-1">{f.label}</label>
                                    <input
                                        value={newAddress[f.key]} onChange={e => setNewAddress(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder} required
                                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0a4019]"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <button type="submit" className="bg-[#0a4019] text-white rounded-lg px-4 py-2 text-xs font-bold">Create Address</button>
                                <button type="button" onClick={() => setShowNewAddressForm(false)} className="border border-neutral-200 rounded-lg px-4 py-2 text-xs font-bold text-neutral-600">Cancel</button>
                            </div>
                        </form>
                    )}

                    {addressesLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#0a4019]" size={24}/></div>
                    ) : pickupAddresses.length === 0 ? (
                        <div className="text-center py-10 text-neutral-400">
                            <MapPin size={32} className="mx-auto mb-2 opacity-30"/>
                            <p className="text-sm font-bold">No pickup addresses found</p>
                            <p className="text-xs mt-1">Add one using the button above</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pickupAddresses.map((addr, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <MapPin size={14} className="text-[#0a4019] flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-neutral-800 truncate">{addr.address}</p>
                                        <p className="text-xs text-neutral-500">{addr.cityName} · {addr.contactName} · {addr.contactPhone}</p>
                                    </div>
                                    {addr.addressCode && (
                                        <span className="text-xs font-mono bg-white border border-neutral-200 rounded px-2 py-0.5 text-neutral-600">{addr.addressCode}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
