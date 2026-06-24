"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';

export default function QuoteModal({ isOpen, onClose, onInsert, initialText = "" }) {
    const [bgColor, setBgColor] = useState('#f5f3f0');
    const [borderColor, setBorderColor] = useState('#0a4019');
    const [textColor, setTextColor] = useState('#0a4019');
    const [borderRadius, setBorderRadius] = useState(12);
    const [borderWidth, setBorderWidth] = useState(4);
    const [borders, setBorders] = useState({ top: false, right: false, bottom: false, left: true });
    const [quoteText, setQuoteText] = useState(initialText || "Write your quote here...");

    useEffect(() => {
        if (isOpen) {
            setQuoteText(initialText || "Write your quote here...");
        }
    }, [isOpen, initialText]);

    if (!isOpen) return null;

    const toggleBorder = (side) => {
        setBorders(prev => ({ ...prev, [side]: !prev[side] }));
    };

    const handleInsert = () => {
        // Return a configuration object for the Custom Blot
        const quoteConfig = {
            style: {
                backgroundColor: bgColor,
                color: textColor,
                borderTop: `${borders.top ? borderWidth : 0}px solid ${borderColor}`,
                borderRight: `${borders.right ? borderWidth : 0}px solid ${borderColor}`,
                borderBottom: `${borders.bottom ? borderWidth : 0}px solid ${borderColor}`,
                borderLeft: `${borders.left ? borderWidth : 0}px solid ${borderColor}`,
                borderRadius: `${borderRadius}px`,
                padding: '24px',
                margin: '24px 0',
                fontStyle: 'italic',
                fontFamily: 'inherit',
                fontSize: '1.2em',
                lineHeight: '1.6',
                display: 'block',
                width: '100%',
                boxSizing: 'border-box'
            },
            text: quoteText
        };

        onInsert(quoteConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-[#F5F3F0] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-heading font-bold text-[#0a4019]">Insert Quote Box</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider mb-3">Colors</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-600">Background</span>
                                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-14 rounded cursor-pointer border-0 p-0" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-600">Border</span>
                                    <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="h-8 w-14 rounded cursor-pointer border-0 p-0" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-600">Text</span>
                                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-8 w-14 rounded cursor-pointer border-0 p-0" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider mb-3">Dimensions</label>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">Corner Radius: {borderRadius}px</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={borderRadius}
                                        onChange={e => setBorderRadius(Number(e.target.value))}
                                        className="w-full accent-[#0a4019]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">Border Width: {borderWidth}px</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={borderWidth}
                                        onChange={e => setBorderWidth(Number(e.target.value))}
                                        className="w-full accent-[#0a4019]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider mb-3">Border Sides</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Top', 'Right', 'Bottom', 'Left'].map(side => (
                                    <label key={side} className={`flex items-center justify-center gap-2 p-2 border rounded-xl cursor-pointer transition-all ${borders[side.toLowerCase()] ? 'bg-[#0a4019] text-white border-[#0a4019]' : 'bg-white border-[#F5F3F0] text-neutral-500 hover:bg-[#F5F3F0]'}`}>
                                        <input
                                            type="checkbox"
                                            checked={borders[side.toLowerCase()]}
                                            onChange={() => toggleBorder(side.toLowerCase())}
                                            className="hidden"
                                        />
                                        <span className="text-xs font-bold uppercase">{side}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider mb-3">Quote Content</label>
                            <textarea
                                value={quoteText}
                                onChange={(e) => setQuoteText(e.target.value)}
                                className="w-full h-32 p-4 rounded-2xl border border-[#F5F3F0] text-sm resize-none font-serif"
                                placeholder="Enter your quote text..."
                            />
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-wider mb-3">Live Preview</label>
                            <div className="bg-[#fafaf9] rounded-2xl p-6 border border-[#F5F3F0] flex items-center justify-center min-h-[200px]">
                                <div
                                    style={{
                                        backgroundColor: bgColor,
                                        borderColor: borderColor,
                                        color: textColor,
                                        borderStyle: 'solid',
                                        borderWidth: `${borders.top ? borderWidth : 0}px ${borders.right ? borderWidth : 0}px ${borders.bottom ? borderWidth : 0}px ${borders.left ? borderWidth : 0}px`,
                                        borderRadius: `${borderRadius}px`,
                                        padding: '24px',
                                        width: '100%',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <p className="text-lg font-serif" style={{ margin: 0 }}>{quoteText}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-[#F5F3F0]">
                    <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
                    <Button onClick={handleInsert} className="flex-1">Insert Quote</Button>
                </div>
            </div>
        </div>
    );
}
