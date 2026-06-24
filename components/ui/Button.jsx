"use client";

import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
    icon: Icon,
    size = 'md',
}) => {
    const sizes = {
        sm: 'px-3 py-2 text-xs rounded-[8px]',
        md: 'px-4 py-2.5 text-sm rounded-[10px]',
        lg: 'px-5 py-3 text-sm rounded-[10px]',
    };

    const baseStyles = `inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${sizes[size]}`;

    const variants = {
        primary: 'bg-[#e63946] text-white hover:bg-[#c1121f] shadow-sm',
        secondary: 'bg-[#1a1a2e] text-white hover:bg-[#16213e] shadow-sm',
        outline: 'border border-[#e5e7eb] text-[#1a1a2e] bg-white hover:bg-gray-50',
        ghost: 'text-[#1a1a2e] hover:bg-gray-100',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon className="mr-2 w-4 h-4" />}
            {children}
        </button>
    );
};

export default Button;
