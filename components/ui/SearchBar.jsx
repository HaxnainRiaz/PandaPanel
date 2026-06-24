"use client";

import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({
    placeholder = "Search...",
    value,
    onChange,
    className = ""
}) => {
    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#B8A68A] transition-colors duration-300" />
            </div>
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full pl-12 pr-4 py-3 bg-white border border-[#F5F3F0] rounded-2xl text-sm placeholder-[#B8A68A] shadow-sm hover:shadow-md"
            />
        </div>
    );
};

export default SearchBar;
