import { useState, useEffect } from 'react';
import { db } from "../../services/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { TrendingUp, MoreHorizontal } from "lucide-react";

export default function TrendingSidebar() {
    const [trendingTags, setTrendingTags] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "social_posts"), orderBy("createdAtMs", "desc"), limit(100));

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

            const sortedTags = Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setTrendingTags(sortedTags);
        });

        return () => unsub();
    }, []);

    return (
        <div>
            <h2 className="gft-card-title flex items-center gap-2 mb-0">
                <TrendingUp size={18} style={{ color: "var(--gft-accent)" }} />
                Trending now
            </h2>

            <div className="mt-3">
                {trendingTags.length > 0 ? trendingTags.map((t, i) => (
                    <div key={i} className="gft-trend-item flex items-start justify-between group">
                        <div>
                            <span className="gft-trend-rank">Trending · #{i + 1}</span>
                            <div className="gft-trend-tag">{t.tag}</div>
                            <span className="gft-trend-count">{t.count} posts</span>
                        </div>
                        <button type="button" className="gft-icon-btn" style={{ color: "var(--gft-text-soft)" }}>
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                )) : (
                    <p className="text-sm" style={{ color: "var(--gft-text-soft)" }}>No trending topics right now.</p>
                )}
            </div>

            <button type="button" className="gft-btn-ghost mt-4 w-full text-sm">
                Show more
            </button>
        </div>
    );
}
