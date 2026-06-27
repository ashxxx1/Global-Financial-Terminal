import React, { useState, useEffect } from 'react';
import { db } from "../../services/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { TrendingUp, Hash, MoreHorizontal } from "lucide-react";

export default function TrendingSidebar() {
    const [trendingTags, setTrendingTags] = useState([]);

    useEffect(() => {
        // Fetch recent posts to compute trending tags
        const q = query(collection(db, "social_posts"), orderBy("createdAt", "desc"), limit(100));
        
        const unsub = onSnapshot(q, snap => {
            const tagCounts = {};
            
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });
            
            // Sort by frequency
            const sortedTags = Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5
                
            setTrendingTags(sortedTags);
        });
        
        return () => unsub();
    }, []);

    return (
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 sticky top-24">
            <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Trending Now
            </h2>
            
            <div className="flex flex-col gap-4">
                {trendingTags.length > 0 ? trendingTags.map((t, i) => (
                    <div key={i} className="flex items-start justify-between group cursor-pointer">
                        <div>
                            <span className="text-xs text-slate-500 font-medium">Trending #{i+1}</span>
                            <div className="flex items-center gap-1 text-slate-200 font-bold group-hover:text-indigo-400 transition-colors">
                                <span>{t.tag}</span>
                            </div>
                            <span className="text-xs text-slate-500">{t.count} posts</span>
                        </div>
                        <button className="text-slate-500 hover:text-white"><MoreHorizontal size={14} /></button>
                    </div>
                )) : (
                    <div className="text-sm text-slate-500 italic">No trending topics right now.</div>
                )}
            </div>
            
            <button className="text-indigo-400 text-sm font-medium mt-6 hover:underline w-full text-left">
                Show more
            </button>
        </div>
    );
}
