"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";

export default function MultiSelect({
    label,
    value = [],
    options = [],
    onChange,
    placeholder = "Select options...",
    className = "",
    error,
    required
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        let newValue;
        if (value.includes(optionValue)) {
            newValue = value.filter((v) => v !== optionValue);
        } else {
            newValue = [...value, optionValue];
        }
        onChange(newValue);
    };

    const removeValue = (e, valToRemove) => {
        e.stopPropagation();
        const newValue = value.filter((v) => v !== valToRemove);
        onChange(newValue);
    };

    const getLabel = (val) => {
        const opt = options.find((o) => o.value === val);
        return opt ? opt.label : val;
    };

    return (
        <div className={`space-y-2 ${className}`} ref={dropdownRef}>
            {label && (
                <label className="text-[10px] font-bold text-[#0a4019] uppercase tracking-wider">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full min-h-[46px] px-4 py-2 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${error
                        ? "border-red-500"
                        : isOpen
                            ? "border-[#d3d3d3] ring-4 ring-[#d3d3d3]/20"
                            : "border-[#F5F3F0] hover:border-[#d3d3d3]"
                        }`}
                >
                    <div className="flex flex-wrap gap-2 flex-1">
                        {value.length > 0 ? (
                            value.map((val) => (
                                <span
                                    key={val}
                                    className="bg-[#0a4019]/10 text-[#0a4019] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                                >
                                    {getLabel(val)}
                                    <X
                                        size={12}
                                        className="cursor-pointer hover:text-red-500"
                                        onClick={(e) => removeValue(e, val)}
                                    />
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-neutral-400">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-neutral-400 transition-transform duration-200 ml-2 ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-[#F5F3F0] rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-1 space-y-0.5">
                            {options.length > 0 ? (
                                options.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={`px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between ${isSelected
                                                ? "bg-[#0a4019]/5 text-[#0a4019] font-medium"
                                                : "text-neutral-600 hover:bg-neutral-50"
                                                }`}
                                        >
                                            {option.label}
                                            {isSelected && <Check size={14} className="text-[#0a4019]" />}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-3 text-sm text-neutral-400 text-center italic">
                                    No options available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}
        </div>
    );
}
