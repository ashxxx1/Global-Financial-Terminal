import { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { Mic, MicOff, Headphones, Video, PhoneOff } from "lucide-react";

export default function VoiceChannel({ activeChannel }) {
    const { currentUser } = useAuth();
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!activeChannel?.id || !currentUser) return;

        const presenceRef = collection(db, "voice_presence", activeChannel.id, "participants");
        const unsub = onSnapshot(presenceRef, (snap) => {
            setConnectedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsub();
    }, [activeChannel?.id, currentUser]);

    useEffect(() => {
        return () => {
            if (joined && activeChannel?.id && currentUser) {
                deleteDoc(doc(db, "voice_presence", activeChannel.id, "participants", currentUser.uid)).catch(() => {});
            }
        };
    }, [joined, activeChannel?.id, currentUser]);

    const joinVoice = async () => {
        if (!activeChannel?.id || !currentUser) return;
        await setDoc(doc(db, "voice_presence", activeChannel.id, "participants", currentUser.uid), {
            displayName: currentUser.displayName || "User",
            photoURL: currentUser.photoURL || null,
            isMuted,
            isDeafened,
            isVideoOn,
            joinedAtMs: Date.now(),
        });
        setJoined(true);
    };

    const leaveVoice = async () => {
        if (!activeChannel?.id || !currentUser) return;
        await deleteDoc(doc(db, "voice_presence", activeChannel.id, "participants", currentUser.uid));
        setJoined(false);
    };

    const updatePresence = async (patch) => {
        if (!joined || !activeChannel?.id || !currentUser) return;
        await setDoc(doc(db, "voice_presence", activeChannel.id, "participants", currentUser.uid), patch, { merge: true });
    };

    if (!activeChannel) return null;

    return (
        <div className="gft-chat">
            <div className="gft-chat-messages">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="gft-panel-title text-2xl">{activeChannel.name}</h2>
                        <p className="text-sm" style={{ color: "var(--gft-text-muted)" }}>
                            {joined ? "Connected to voice channel" : "Join to connect with other traders"}
                        </p>
                    </div>
                </div>

                {!joined ? (
                    <div className="gft-card text-center py-12">
                        <p className="mb-4" style={{ color: "var(--gft-text-muted)" }}>Voice channels let your server talk in real time.</p>
                        <button type="button" onClick={joinVoice} className="gft-btn-primary">Join Voice</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {connectedUsers.map(user => (
                            <div key={user.id} className="gft-card aspect-video flex items-center justify-center relative">
                                <div className="w-16 h-16 rounded-full overflow-hidden">
                                    <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} alt={user.displayName} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute bottom-3 left-3 text-xs font-medium px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.5)" }}>
                                    {user.displayName}{user.isMuted ? " · muted" : ""}
                                </div>
                            </div>
                        ))}
                        {connectedUsers.length === 0 && (
                            <p className="gft-empty col-span-full">You're the first one here.</p>
                        )}
                    </div>
                )}
            </div>

            {joined && (
                <div className="gft-chat-input-wrap flex items-center justify-center gap-3">
                    <button type="button" onClick={() => { setIsVideoOn(v => !v); updatePresence({ isVideoOn: !isVideoOn }); }} className={`gft-icon-btn ${isVideoOn ? "active" : ""}`}><Video size={20} /></button>
                    <button type="button" onClick={() => { setIsMuted(v => !v); updatePresence({ isMuted: !isMuted }); }} className={`gft-icon-btn ${isMuted ? "active" : ""}`}>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
                    <button type="button" onClick={() => { setIsDeafened(v => !v); updatePresence({ isDeafened: !isDeafened }); }} className={`gft-icon-btn ${isDeafened ? "active" : ""}`}><Headphones size={20} /></button>
                    <button type="button" onClick={leaveVoice} className="gft-btn-primary" style={{ background: "var(--gft-red)" }}><PhoneOff size={18} /></button>
                </div>
            )}
        </div>
    );
}
