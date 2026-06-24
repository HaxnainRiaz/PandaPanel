"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    TicketPercent,
    LifeBuoy,
    ClipboardList,
    Box,
    Layers,
    FileText,
    Truck,
    PackagePlus,
    MapPin,
    AlertTriangle,
    RotateCcw,
    BarChart2,
    UserCog,
    Bell,
    AlertCircle,
    History,
    ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const sections = [
    {
        title: "MAIN",
        items: [
            { label: "Dashboard", href: "/", icon: LayoutDashboard },
            { label: "Orders", href: "/orders", icon: ShoppingBag },
            { label: "Products", href: "/products", icon: Package },
            { label: "Categories", href: "/categories", icon: Layers },
            { label: "Customers", href: "/customers", icon: Users },
            { label: "Inventory", href: "/inventory", icon: Box },
        ],
    },
    {
        title: "POSTEX",
        colorAccent: true,
        items: [
            { label: "Settings", href: "/postex/settings", icon: Settings },
            { label: "Shipments", href: "/postex/bookings", icon: Truck },
            { label: "Tracking", href: "/postex/tracking", icon: MapPin },
            { label: "Bulk Booking", href: "/postex/bulk", icon: PackagePlus },
            { label: "Failed Logs", href: "/postex/failed", icon: AlertTriangle },
            { label: "Returns", href: "/postex/returns", icon: RotateCcw },
        ],
    },
    {
        title: "MARKETING",
        items: [
            { label: "Meta Ads", href: "/meta", icon: BarChart2 },
            { label: "Discounts", href: "/discounts", icon: TicketPercent },
            { label: "Reviews", href: "/reviews", icon: Star },
            { label: "Blogs", href: "/blogs", icon: FileText },
            { label: "Abandoned Carts", href: "/abandoned-carts", icon: ShoppingCart },
        ],
    },
    {
        title: "OPERATIONS",
        items: [
            { label: "Notifications", href: "/notifications", icon: Bell },
            { label: "Low Stock", href: "/low-stock", icon: AlertCircle },
            { label: "Activity Logs", href: "/activity-logs", icon: History },
            { label: "Analytics", href: "/analytics", icon: BarChart2 },
        ],
    },
    {
        title: "SETTINGS",
        items: [
            { label: "Store Settings", href: "/settings", icon: Settings },
            { label: "CMS", href: "/cms", icon: FileText },
            { label: "Staff", href: "/staff", icon: UserCog },
            { label: "Audit Log", href: "/audit", icon: ClipboardList },
            { label: "Support", href: "/support", icon: LifeBuoy },
        ],
    },
];

const Sidebar = () => {
    const pathname = usePathname() || "";
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();

    const isActive = (path) => {
        if (!pathname) return false;
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 right-4 z-[70] p-2.5 bg-[#1a1a2e] text-white rounded-[10px] shadow-lg"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside
                className={`fixed top-0 left-0 z-[60] h-screen w-64 bg-[#1a1a2e] text-white transition-all duration-300 border-r border-white/10 ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                <div className="flex flex-col h-full p-5">
                    <Link href="/" className="mb-6 block" onClick={() => setIsOpen(false)}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-[10px] bg-[#e63946] flex items-center justify-center">
                                <span className="text-white font-black text-sm">P</span>
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-white">
                                    Panda<span className="text-[#e63946]">E-Mart</span>
                                </h1>
                                <p className="text-[10px] text-white/50 font-medium">Admin Panel</p>
                            </div>
                        </div>
                    </Link>

                    <nav className="flex-1 space-y-5 overflow-y-auto pr-1 -mr-1 pb-6">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-0.5">
                                <h3 className={`px-3 text-[10px] font-semibold tracking-wider mb-2 uppercase ${
                                    section.colorAccent ? "text-[#f4a261]" : "text-white/35"
                                }`}>
                                    {section.title}
                                </h3>
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] transition-all ${
                                            isActive(item.href)
                                                ? "bg-[#e63946] text-white font-semibold"
                                                : "text-white/65 hover:bg-white/8 hover:text-white"
                                        }`}
                                    >
                                        <item.icon size={16} className="shrink-0" />
                                        <span className="text-[13px]">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-white/55 hover:text-red-400 hover:bg-red-500/10 rounded-[10px] transition-all"
                        >
                            <LogOut size={16} />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
