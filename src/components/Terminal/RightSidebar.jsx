import { useState, useEffect } from 'react';
import { IntelligenceFeed } from './IntelligenceFeed';
import { Globe2, Hash, MessageSquare, Heart } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

function SocialFeedPreview({ onSetView }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "social_posts"),
      orderBy("createdAtMs", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          authorName: doc.data().authorName,
          authorUsername: doc.data().authorUsername || "",
          text: doc.data().text,
          likes: doc.data().likes || 0,
          commentCount: doc.data().commentCount || 0,
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
        }));
        setPosts(list);
      } else {
        setPosts([]);
      }
    }, () => {
      setPosts([]);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4" style={{ color: "#f5b13d" }} />
          <h2
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#a89c84",
            }}
          >
            COMMUNITY FLOW
          </h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => onSetView('social')}
            className="p-3 cursor-pointer transition-all duration-200 rounded-sm"
            style={{
              background: "rgba(245, 177, 61,0.04)",
              border: "1px solid rgba(245, 177, 61,0.1)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(245, 177, 61,0.08)";
              e.currentTarget.style.borderColor = "rgba(245, 177, 61,0.22)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(245, 177, 61,0.04)";
              e.currentTarget.style.borderColor = "rgba(245, 177, 61,0.1)";
            }}
          >
            <div className="flex items-center justify-between mb-1.5 text-[11px]">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#c9bea3",
                }}
              >
                @{post.authorUsername || post.authorName}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "#6b6354",
                }}
              >
                {post.time}
              </span>
            </div>
            <p className="text-[13px] text-slate-200 line-clamp-2 leading-relaxed mb-2.5">
              {post.text}
            </p>
            <div className="flex gap-4 text-slate-500 text-[11px]">
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentCount}</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes}</span>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="p-8 text-center text-slate-600 font-mono text-[12px] tracking-wider">
            NO POSTS YET. CLICK TO WRITE THE FIRST!
          </div>
        )}
      </div>
    </div>
  );
}

export function RightSidebar({ onSetView }) {
  const [view, setView] = useState('INTEL');

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: "transparent" }}>
      {/* Tab switch header */}
      <div
        className="flex p-1.5 shrink-0"
        style={{
          background: "rgba(5,7,13,0.7)",
          borderBottom: "1px solid rgba(245, 177, 61,0.14)",
        }}
      >
        <button
          onClick={() => setView('INTEL')}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer rounded-sm"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            ...(view === 'INTEL'
              ? { background: "rgba(245, 177, 61,0.12)", color: "#f5b13d", border: "1px solid rgba(245, 177, 61,0.35)" }
              : { color: "rgba(240,230,210,0.35)", border: "1px solid transparent" }),
          }}
        >
          <Globe2 className="w-3.5 h-3.5" />
          Intel
        </button>
        <button
          onClick={() => setView('SOCIAL')}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer rounded-sm"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            ...(view === 'SOCIAL'
              ? { background: "rgba(245, 177, 61,0.12)", color: "#f5b13d", border: "1px solid rgba(245, 177, 61,0.35)" }
              : { color: "rgba(240,230,210,0.35)", border: "1px solid transparent" }),
          }}
        >
          <Hash className="w-3.5 h-3.5" />
          Pulse
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        {view === 'INTEL' ? <IntelligenceFeed /> : <SocialFeedPreview onSetView={onSetView} />}
      </div>
    </div>
  );
}
