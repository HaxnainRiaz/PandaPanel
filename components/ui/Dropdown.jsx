"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dropdown = ({
    options = [],
    value,
    onChange,
    placeholder = "Select option",
    className = "",
    label = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => (opt.value || opt) === value);
    const displayValue = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className={cn("relative w-full", className)} ref={dropdownRef}>
            {label && (
                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md",
                    isOpen ? "ring-2 ring-[#d3d3d3]/30 border-[#d3d3d3]" : "hover:border-[#d3d3d3]/50",
                    !selectedOption ? "text-[#B8A68A]" : "text-[#0a4019]"
                )}
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDown className={cn("h-4 w-4 text-[#B8A68A] transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-[#F5F3F0] rounded-2xl shadow-2xl py-2 animate-fadeIn overflow-hidden">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const optValue = option.value || option;
                            const optLabel = option.label || option;
                            const isSelected = optValue === value;

                            return (
                                <button
                                    key={optValue}
                                    type="button"
                                    onClick={() => handleSelect(optValue)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-3 text-sm text-left transition-colors",
                                        isSelected ? "bg-[#d3d3d3]/10 text-[#0a4019] font-bold" : "text-[#6B6B6B] hover:bg-[#FDFCFB] hover:text-[#0a4019]"
                                    )}
                                >
                                    <span>{optLabel}</span>
                                    {isSelected && <Check className="h-4 w-4 text-[#d3d3d3]" />}
                                </button>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-6 py-3 text-sm text-neutral-400 italic">No options available</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
