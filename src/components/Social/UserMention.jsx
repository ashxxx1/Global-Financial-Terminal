import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMention({ username, onClick }) {
    const [isHovered, setIsHovered] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isHovered && !userData && !loading) {
            setLoading(true);
            // In a real app we'd query by username, here we mock the fetch
            setTimeout(() => {
                setUserData({
                    displayName: username,
                    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
                    bio: "Terminal power user & algo trader. Always looking for the next breakout.",
                    followers: Math.floor(Math.random() * 10000)
                });
                setLoading(false);
            }, 300);
        }
    }, [isHovered]);

    return (
        <span 
            className="relative inline-block mx-0.5 z-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span 
                onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
                className="text-indigo-400 font-medium hover:bg-indigo-500/20 px-1 py-0.5 rounded cursor-pointer transition-colors"
            >
                @{username}
            </span>
            
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 glass-card rounded-xl p-4 pointer-events-auto cursor-default z-[100]"
                        onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {loading || !userData ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full skeleton flex-shrink-0"></div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="w-24 h-4 skeleton"></div>
                                        <div className="w-16 h-3 skeleton"></div>
                                    </div>
                                </div>
                                <div className="w-full h-10 skeleton mt-2"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <img src={userData.photoURL} alt={userData.displayName} className="w-12 h-12 rounded-full border-2 border-indigo-500/30" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-base">{userData.displayName}</span>
                                            <span className="text-slate-400 text-xs">@{username}</span>
                                        </div>
                                    </div>
                                    <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">
                                        Follow
                                    </button>
                                </div>
                                <p className="text-sm text-slate-300 mb-4 leading-snug">
                                    {userData.bio}
                                </p>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-white font-bold">{userData.followers.toLocaleString()} <span className="text-slate-500 font-normal">Followers</span></span>
                                    <span className="text-white font-bold">124 <span className="text-slate-500 font-normal">Following</span></span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
