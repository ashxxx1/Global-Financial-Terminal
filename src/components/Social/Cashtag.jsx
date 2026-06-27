import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cashtag({ symbol }) {
    const [isHovered, setIsHovered] = useState(false);
    
    // Simulate some mock data for the hover card
    const isPositive = Math.random() > 0.4;
    const change = (Math.random() * 5).toFixed(2);
    const colorClass = isPositive ? "text-green-400" : "text-red-400";
    const strokeColor = isPositive ? "stroke-green-400" : "stroke-red-400";
    
    // Generate a random SVG sparkline
    const points = Array.from({ length: 10 }, (_, i) => {
        const x = i * 11;
        const y = 35 - (Math.random() * 30);
        return `${x} ${y}`;
    }).join(" L ");
    const pathD = `M0 35 L ${points}`;

    return (
        <span 
            className="relative inline-block mx-0.5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="text-indigo-400 font-bold hover:bg-indigo-500/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
                ${symbol.toUpperCase()}
            </span>
            
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 glass-card rounded-xl p-3 z-50 pointer-events-none"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-col">
                                <span className="font-bold text-white text-lg">${symbol.toUpperCase()}</span>
                                <span className="text-slate-400 text-xs">Equities</span>
                            </div>
                            <div className={`flex flex-col items-end ${colorClass}`}>
                                <span className="font-medium">1,234.56</span>
                                <span className="text-xs">{isPositive ? '+' : '-'}{change}%</span>
                            </div>
                        </div>
                        <div className="h-16 w-full rounded-lg flex items-end">
                            <svg viewBox="0 0 100 40" className={`w-full h-full ${strokeColor} fill-none stroke-[2.5px] drop-shadow-md`} preserveAspectRatio="none">
                                <path d={pathD} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
