import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Globe, Hash, MessageSquare, LayoutDashboard, Compass, Settings, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeMode, setActiveMode] = useState("feed"); // 'feed' | 'servers' | 'dm'
  const [activeServer, setActiveServer] = useState(null); // null means no server selected
  const [activeDmUser, setActiveDmUser] = useState(null); // currently active DM conversation
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null); // UserProfile target
  const [feedType, setFeedType] = useState('foryou'); // 'foryou' | 'following' | 'mentions'

  return (
    <div className="flex h-screen w-full bg-[#0b0c10] overflow-hidden font-sans">
      
      {/* 1. Leftmost Server / Mode Navigation Sidebar */}
      <nav className="w-[72px] h-full flex flex-col items-center py-4 gap-3 bg-[#0a0a0f] border-r border-white/5 z-20">
        <Link to="/" className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-600/40 transition-colors mb-2" title="Back to Terminal">
           <LayoutDashboard className="w-6 h-6" />
        </Link>
        
        <div className="w-8 h-[2px] bg-white/10 rounded-full mb-2"></div>

        {/* Global Feed Toggle */}
        <button 
          onClick={() => { setActiveMode("feed"); setActiveServer(null); }}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center ${activeMode === "feed" ? "bg-indigo-600 text-white rounded-[16px]" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}
          title="Global Feed"
        >
          <Globe className="w-6 h-6" />
        </button>

        <div className="w-8 h-[2px] bg-white/10 rounded-full my-1"></div>

        {/* Server Icons List (Phase 3) */}
        <ServerSidebar activeServer={activeServer} setActiveServer={setActiveServer} setActiveMode={setActiveMode} />
      </nav>

      {/* 2. Secondary Sidebar (Navigation for current mode) */}
      <aside className="w-64 h-full bg-[#11131a] flex flex-col border-r border-white/5 z-10 flex-shrink-0 transition-all duration-300">
         {activeMode === "feed" ? (
           <div className="flex flex-col h-full">
             <div className="h-14 px-4 flex items-center shadow-sm border-b border-white/5">
                <h2 className="font-display font-semibold text-lg text-white tracking-wide">Confluence Feed</h2>
             </div>
             <div className="p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setFeedType('foryou')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${feedType === 'foryou' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Hash className={`w-5 h-5 ${feedType === 'foryou' ? 'text-indigo-400' : ''}`} />
                  For You
                </button>
                <button 
                  onClick={() => setFeedType('following')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${feedType === 'following' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Users className={`w-5 h-5 ${feedType === 'following' ? 'text-indigo-400' : ''}`} />
                  Following
                </button>
                <button 
                  onClick={() => setFeedType('mentions')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${feedType === 'mentions' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <MessageSquare className={`w-5 h-5 ${feedType === 'mentions' ? 'text-indigo-400' : ''}`} />
                  Mentions
                </button>
             </div>
             <div className="mt-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                 Explore
             </div>
             <div className="p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setFeedType('communities')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${feedType === 'communities' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Users className={`w-5 h-5 ${feedType === 'communities' ? 'text-indigo-400' : ''}`} />
                  Communities
                </button>
                <button 
                  onClick={() => setFeedType('lists')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${feedType === 'lists' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Hash className={`w-5 h-5 ${feedType === 'lists' ? 'text-indigo-400' : ''}`} />
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
      <main className="flex-1 h-full flex flex-col bg-[#0b0c10] relative z-0 min-w-0">
        <div className="h-14 px-6 flex items-center border-b border-white/5 shadow-sm bg-[#0b0c10]/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0 justify-between">
           <div className="flex items-center gap-2 text-white font-medium">
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
          {activeMode === "feed" && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>}
          
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
      <aside className="w-80 h-full flex-shrink-0 z-10 bg-[#11131a] flex flex-col border-l border-white/5 overflow-y-auto custom-scrollbar">
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
