import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ title, value, trend, icon }) {
    const isPositive = trend && trend > 0;

    return (
        <div className="admin-card p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</span>
                    {icon && (
                        <div className="p-2 bg-[#e63946]/10 rounded-[10px] text-[#e63946]">
                            {icon}
                        </div>
                    )}
                </div>
                <div className="flex items-end justify-between">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">
                        {value || 0}
                    </h3>
                    {trend && (
                        <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
