import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Globe, Hash, MessageSquare, LayoutDashboard, Compass, Settings, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useTerminalStore from "../../store/terminalStore";

// Components
import PostsFeed from "../../components/Social/PostsFeed";
import UserProfile from "../../components/Social/UserProfile";
import TrendingSidebar from "../../components/Social/TrendingSidebar";
import ServerSidebar from "../../components/Social/Servers/ServerSidebar";
import ChannelList from "../../components/Social/Servers/ChannelList";
import ChannelChat from "../../components/Social/Servers/ChannelChat";
import VoiceChannel from "../../components/Social/Servers/VoiceChannel";
import ServerSettingsModal from "../../components/Social/Servers/ServerSettingsModal";
import DirectMessageList from "../../components/Social/DMs/DirectMessageList";
import DirectMessageChat from "../../components/Social/DMs/DirectMessageChat";

export default function SocialPage() {
  const { currentUser } = useAuth();
  const { setActiveView } = useTerminalStore();
  const [activeMode, setActiveMode] = useState("feed"); // 'feed' | 'servers' | 'dm'
  const [activeServer, setActiveServer] = useState(null); // null means no server selected
  const [activeChannel, setActiveChannel] = useState(null); // currently active server channel
  const [activeDmUser, setActiveDmUser] = useState(null); // currently active DM conversation
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null); // UserProfile target
  const [feedType, setFeedType] = useState('foryou'); // 'foryou' | 'following' | 'mentions'

  return (
    <div className="nexus-social flex h-screen w-full overflow-hidden nexus-social-shell">
      
      {/* 1. Leftmost Server / Mode Navigation Sidebar */}
      <nav className="nexus-social-rail hidden md:flex w-[72px] h-full flex-col items-center py-4 gap-3 border-r z-20">
        <button onClick={() => setActiveView("globe")} className="nexus-social-server-btn relative flex items-center justify-center text-[var(--nx-cyan)] cursor-pointer mb-2" style={{ background: "rgba(0,229,255,0.08)" }} title="Back to Terminal">
           <LayoutDashboard className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-px" style={{ background: "var(--nx-border)" }} />

        <button 
          onClick={() => { setActiveMode("feed"); setActiveServer(null); }}
          className={`nexus-social-server-btn relative flex items-center justify-center cursor-pointer ${activeMode === "feed" ? "active" : ""}`}
          style={{ background: activeMode === "feed" ? "rgba(0,229,255,0.12)" : "rgba(0,0,0,0.3)", color: activeMode === "feed" ? "var(--nx-cyan)" : "rgba(255,255,255,0.4)" }}
          title="Global Feed"
        >
          <Globe className="w-5 h-5" />
        </button>

        <div className="w-8 h-px" style={{ background: "var(--nx-border)" }} />

        <ServerSidebar activeServer={activeServer} setActiveServer={setActiveServer} setActiveMode={setActiveMode} />
      </nav>

      {/* 2. Secondary Sidebar */}
      <aside className="nexus-social-panel hidden lg:flex w-64 h-full flex-col border-r z-10 flex-shrink-0 transition-all duration-300">
         {activeMode === "feed" ? (
           <div className="flex flex-col h-full">
             <div className="h-14 px-4 flex items-center border-b" style={{ borderColor: "var(--nx-border)" }}>
                <h2 className="nx-section-head" style={{ fontSize: "13px" }}>Pulse Feed</h2>
             </div>
             <div className="p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setFeedType('foryou')}
                  className={`nexus-social-nav-btn flex items-center gap-3 px-3 py-2 ${feedType === 'foryou' ? 'active' : 'text-[rgba(255,255,255,0.4)] hover:text-white'}`}
                >
                  <Hash className="w-4 h-4" />
                  For You
                </button>
                <button 
                  onClick={() => setFeedType('following')}
                  className={`nexus-social-nav-btn flex items-center gap-3 px-3 py-2 ${feedType === 'following' ? 'active' : 'text-[rgba(255,255,255,0.4)] hover:text-white'}`}
                >
                  <Users className="w-4 h-4" />
                  Following
                </button>
                <button 
                  onClick={() => setFeedType('mentions')}
                  className={`nexus-social-nav-btn flex items-center gap-3 px-3 py-2 ${feedType === 'mentions' ? 'active' : 'text-[rgba(255,255,255,0.4)] hover:text-white'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Mentions
                </button>
             </div>
             <div className="mt-4 px-6 nx-section-sub mb-2">Explore</div>
             <div className="p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setFeedType('communities')}
                  className={`nexus-social-nav-btn flex items-center gap-3 px-3 py-2 ${feedType === 'communities' ? 'active' : 'text-[rgba(255,255,255,0.4)] hover:text-white'}`}
                >
                  <Users className="w-4 h-4" />
                  Communities
                </button>
                <button 
                  onClick={() => setFeedType('lists')}
                  className={`nexus-social-nav-btn flex items-center gap-3 px-3 py-2 ${feedType === 'lists' ? 'active' : 'text-[rgba(255,255,255,0.4)] hover:text-white'}`}
                >
                  <Hash className="w-4 h-4" />
                  Custom Lists
                </button>
             </div>
           </div>
         ) : activeMode === "dm" ? (
             <DirectMessageList activeDmUser={activeDmUser} setActiveDmUser={setActiveDmUser} />
         ) : (
           <div className="flex flex-col h-full">
             <div 
                 onClick={() => activeServer && setShowSettings(true)}
                 className="h-14 px-4 flex items-center justify-between shadow-sm border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                 title="Server Settings"
             >
                <h2 className="font-display font-semibold text-lg text-white truncate">Server Navigation</h2>
                <Settings className="w-4 h-4 text-slate-400" />
             </div>
             <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {activeServer ? (
                    <ChannelList serverId={activeServer} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />
                ) : (
                    <div className="text-white/50 text-xs px-4 py-6 text-center">Select a server to view channels</div>
                )}
             </div>
           </div>
         )}
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 h-full flex flex-col relative z-0 min-w-0" style={{ background: "var(--nx-void)" }}>
        <div className="nexus-social-header h-14 px-4 md:px-6 flex items-center border-b sticky top-0 z-10 flex-shrink-0 justify-between">
           <div className="flex items-center gap-2 font-medium" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--nx-font-mono)", fontSize: "11px", letterSpacing: "0.08em" }}>
             <button onClick={() => setActiveView("globe")} className="md:hidden mr-1 p-1.5 cursor-pointer" style={{ color: "var(--nx-cyan)" }}>
                 <LayoutDashboard size={18} />
             </button>
             {activeMode === "feed" ? (
                 feedType === 'foryou' ? "For You" : 
                 feedType === 'following' ? "Following" : 
                 feedType === 'mentions' ? "Mentions" :
                 feedType === 'communities' ? "Communities" : "Custom Lists"
             ) : 
              activeMode === "dm" ? (activeDmUser ? `@${activeDmUser.username}` : "Direct Messages") : (
                 activeChannel ? <><Hash className="w-5 h-5 text-slate-400"/> {activeChannel.name}</> : "No Channel Selected"
             )}
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          {/* Background gradient hint */}
          {activeMode === "feed" && <div className="nexus-social-glow absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 blur-[120px] rounded-full pointer-events-none" />}
          
          <div className={activeMode === "feed" ? "w-full max-w-3xl mx-auto py-6" : "w-full h-full"}>
            <AnimatePresence mode="wait">
              {activeMode === "feed" ? (
                <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <PostsFeed feedType={feedType} onProfileClick={setActiveProfileId} />
                </motion.div>
              ) : activeMode === "dm" ? (
                <motion.div key="dm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                  {activeDmUser ? <DirectMessageChat activeDmUser={activeDmUser} /> : <div className="text-white/50 text-xs px-4 py-6 flex items-center justify-center h-full">Select a friend to start chatting.</div>}
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                  {activeChannel?.type === 'voice' ? (
                      <VoiceChannel activeChannel={activeChannel} />
                  ) : (
                      <ChannelChat activeChannel={activeChannel} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 4. Right Sidebar (Profile / Server Members / Trending) */}
      <aside className="nexus-social-panel hidden xl:flex w-80 h-full flex-shrink-0 z-10 flex-col border-l overflow-y-auto custom-scrollbar">
        <UserProfile 
            activeProfileId={activeProfileId || currentUser?.uid} 
            onReset={() => setActiveProfileId(null)} 
            activeServer={activeServer}
        />
        {activeMode === "feed" && (
            <div className="p-4 pt-0">
                <TrendingSidebar />
            </div>
        )}
      </aside>
      
      {showSettings && activeServer && (
          <ServerSettingsModal serverId={activeServer} onClose={() => setShowSettings(false)} />
      )}

    </div>
  );
}
