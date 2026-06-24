"use client";

import React from 'react';

const Input = ({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required = false,
    className = "",
    error = "",
    id,
    icon: Icon,
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full ${Icon ? 'pl-10' : 'px-3'} py-2.5 bg-white border border-[#e5e7eb] rounded-[10px] text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] ${error ? 'border-red-500' : ''}`}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default Input;
