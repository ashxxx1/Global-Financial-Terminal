import React, { useState } from 'react';
import { Mic, MicOff, Headphones, Video, Share, Settings, PhoneOff, User, MessageSquare } from 'lucide-react';

export default function VoiceChannel({ activeChannel }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);

    // Dummy connected users
    const connectedUsers = [
        { id: '1', name: 'Aarush', isSpeaking: true, isMuted: false },
        { id: '2', name: 'Anchita', isSpeaking: false, isMuted: true },
        { id: '3', name: 'TraderX', isSpeaking: false, isMuted: false },
    ];

    if (!activeChannel) return null;

    return (
        <div className="flex flex-col h-full bg-[#0b0c10] relative text-white">
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-display font-bold">{activeChannel.name}</h2>
                        <p className="text-slate-400 text-sm">Voice Connected - us-east-1</p>
                    </div>
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-sm transition-colors">
                        <MessageSquare size={16} /> Open Chat
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {connectedUsers.map(user => (
                        <div key={user.id} className={`relative aspect-video bg-[#1e293b] rounded-xl border-2 transition-all ${user.isSpeaking ? 'border-emerald-500' : 'border-transparent'} flex items-center justify-center overflow-hidden`}>
                            {user.isSpeaking && (
                                <div className="absolute inset-0 ring-4 ring-emerald-500/20 rounded-xl pointer-events-none"></div>
                            )}
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border-4 border-[#1e293b] relative z-10">
                                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} alt="User" className="w-full h-full rounded-full" />
                            </div>
                            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm flex items-center gap-2 z-20">
                                {user.name}
                                {user.isMuted && <MicOff size={12} className="text-red-400" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="h-20 bg-[#11131a] border-t border-white/5 flex items-center justify-between px-8 flex-shrink-0">
                <div className="flex items-center gap-4 text-slate-300 text-sm">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        Voice Connected
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-3 rounded-full transition-colors ${isVideoOn ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                        <Video size={20} />
                    </button>
                    <button className="p-3 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                        <Share size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={() => setIsDeafened(!isDeafened)} className={`p-3 rounded-full transition-colors ${isDeafened ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                        <Headphones size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <button className="p-3 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors">
                        <PhoneOff size={20} />
                    </button>
                </div>
                
                <div className="w-32"></div> {/* Spacer to balance flex-between */}
            </div>
        </div>
    );
}
