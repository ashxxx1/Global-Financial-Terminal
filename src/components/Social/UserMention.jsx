import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "../../services/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";

export default function UserMention({ username, onClick }) {
    const [isHovered, setIsHovered] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isHovered || userData || loading || !username) return;
        setLoading(true);
        const q = query(collection(db, "users"), where("username", "==", username), limit(1));
        getDocs(q).then(snap => {
            if (!snap.empty) {
                const doc = snap.docs[0];
                setUserData({ id: doc.id, ...doc.data() });
            } else {
                setUserData({ displayName: username, username, bio: "User not found", followerList: [] });
            }
        }).finally(() => setLoading(false));
    }, [isHovered, username, userData, loading]);

    return (
        <span
            className="relative inline-block mx-0.5 z-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span
                onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
                className="gft-tag font-medium px-1 py-0.5 rounded cursor-pointer"
            >
                @{username}
            </span>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 gft-card p-4 pointer-events-auto z-[100]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading || !userData ? (
                            <div className="text-sm" style={{ color: "var(--gft-text-soft)" }}>Loading...</div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={userData.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} alt="" className="w-12 h-12 rounded-full" />
                                    <div>
                                        <div className="font-bold">{userData.displayName || username}</div>
                                        <div className="text-xs" style={{ color: "var(--gft-text-soft)" }}>@{username}</div>
                                    </div>
                                </div>
                                <p className="text-sm mb-3" style={{ color: "var(--gft-text-muted)" }}>{userData.bio || "No bio yet."}</p>
                                <div className="text-sm">
                                    <strong>{(userData.followerList || []).length}</strong> followers
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
