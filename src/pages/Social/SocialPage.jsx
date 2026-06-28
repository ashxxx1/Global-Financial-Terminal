import { useState, useEffect } from "react";
import {
  Globe, Hash, MessageSquare, LayoutDashboard, Settings, Users,
  Home, Bell, Bookmark, Search, PenLine, Radio, MessagesSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import useTerminalStore from "../../store/terminalStore";
import { db } from "../../services/firebase";
import "../../styles/gft-social.css";

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

const FEED_TABS = [
  { id: "foryou", label: "For you" },
  { id: "following", label: "Following" },
  { id: "mentions", label: "Mentions" },
  { id: "bookmarks", label: "Bookmarks" },
];

const X_NAV = [
  { id: "foryou", icon: Home, label: "Home" },
  { id: "following", icon: Users, label: "Following" },
  { id: "mentions", icon: Bell, label: "Notifications" },
  { id: "bookmarks", icon: Bookmark, label: "Bookmarks" },
  { id: "communities", icon: Hash, label: "Communities" },
  { id: "lists", icon: Radio, label: "Lists" },
];

export default function SocialPage() {
  const { currentUser } = useAuth();
  const { setActiveView } = useTerminalStore();
  const [activeMode, setActiveMode] = useState("feed");
  const [activeServer, setActiveServer] = useState(null);
  const [activeServerData, setActiveServerData] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDmUser, setActiveDmUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [feedType, setFeedType] = useState("foryou");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePanel, setMobilePanel] = useState(null);

  const headerTitle = () => {
    if (activeMode === "feed") {
      const tab = FEED_TABS.find((t) => t.id === feedType);
      return tab?.label || "For you";
    }
    if (activeMode === "dm") return activeDmUser ? `@${activeDmUser.username}` : "Messages";
    if (activeChannel) return `# ${activeChannel.name}`;
    return "Select a channel";
  };

  const switchFeed = (id) => {
    setFeedType(id);
    setActiveMode("feed");
    setActiveServer(null);
    setActiveServerData(null);
    setMobilePanel(null);
  };

  useEffect(() => {
    if (!activeServer) {
      setActiveServerData(null);
      return;
    }
    getDoc(doc(db, "social_servers", activeServer)).then((snap) => {
      if (snap.exists()) setActiveServerData({ id: snap.id, ...snap.data() });
    });
  }, [activeServer]);

  return (
    <div className="gft-social-root gft-social-layout">
      {/* ── Discord server rail ── */}
      <nav className="gft-discord-rail" aria-label="Servers and modes">
        <button
          type="button"
          className="gft-rail-btn"
          onClick={() => setActiveView("globe")}
          title="Back to Global Financial Terminal"
        >
          <LayoutDashboard size={22} />
        </button>
        <span className="gft-rail-label">Terminal</span>

        <div className="gft-rail-divider" />

        <button
          type="button"
          className={`gft-rail-btn ${activeMode === "feed" ? "active" : ""}`}
          onClick={() => { setActiveMode("feed"); setActiveServer(null); }}
          title="Home feed (X)"
        >
          <Home size={22} />
        </button>

        <button
          type="button"
          className={`gft-rail-btn ${activeMode === "dm" ? "active" : ""}`}
          onClick={() => { setActiveMode("dm"); setActiveServer(null); }}
          title="Direct messages"
        >
          <MessagesSquare size={22} />
        </button>

        <div className="gft-rail-divider" />

        <ServerSidebar
          activeServer={activeServer}
          setActiveServer={setActiveServer}
          setActiveMode={setActiveMode}
        />
      </nav>

      {/* ── Secondary panel: X nav / channels / DMs ── */}
      <aside className="gft-side-panel">
        {activeMode === "feed" && (
          <>
            <div className="gft-panel-head">
              <div className="gft-panel-title">Global Financial Terminal</div>
              <div className="gft-panel-sub">Social · Markets & community</div>
            </div>
            <nav className="py-2">
              {X_NAV.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`gft-nav-item ${feedType === id && activeMode === "feed" ? "active" : ""}`}
                  onClick={() => switchFeed(id)}
                >
                  <Icon size={20} strokeWidth={feedType === id ? 2.5 : 2} />
                  {label}
                </button>
              ))}
            </nav>
            <div className="gft-nav-section">Discover</div>
            <button type="button" className="gft-nav-item" onClick={() => switchFeed("communities")}>
              <Globe size={20} /> Explore markets
            </button>
          </>
        )}

        {activeMode === "dm" && (
          <DirectMessageList activeDmUser={activeDmUser} setActiveDmUser={setActiveDmUser} />
        )}

        {activeMode === "servers" && (
          <>
            <div
              className="gft-panel-head flex items-center justify-between cursor-pointer hover:bg-[var(--gft-hover)] transition-colors"
              onClick={() => activeServer && setShowSettings(true)}
              onKeyDown={(e) => e.key === "Enter" && activeServer && setShowSettings(true)}
              role="button"
              tabIndex={0}
            >
              <div>
                <div className="gft-panel-title">Server channels</div>
                <div className="gft-panel-sub">Text · voice · threads</div>
              </div>
              <Settings size={18} className="text-[var(--gft-text-soft)]" />
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {activeServer ? (
                <ChannelList serverId={activeServer} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />
              ) : (
                <p className="gft-empty text-sm py-8">Select a server from the rail to view channels.</p>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="gft-main">
        <header className="gft-main-header">
          <div className="gft-brand-bar">
            <div className="gft-brand">
              <span className="gft-brand-name">Global Financial Terminal</span>
              <span className="gft-brand-tag">Social</span>
            </div>
            <div className="gft-search hidden md:block">
              <Search size={16} className="gft-search-icon" />
              <input
                type="search"
                placeholder="Search posts, $tickers, @users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className="gft-btn-ghost hidden sm:flex items-center gap-2" onClick={() => setActiveView("globe")}>
              <LayoutDashboard size={16} /> Terminal
            </button>
          </div>

          {activeMode === "feed" && (
            <div className="gft-feed-tabs">
              {FEED_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`gft-feed-tab ${feedType === tab.id ? "active" : ""}`}
                  onClick={() => setFeedType(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {activeMode !== "feed" && (
            <div className="px-5 py-3 border-b border-[var(--gft-border)]">
              <h1 className="gft-panel-title text-base">{headerTitle()}</h1>
            </div>
          )}
        </header>

        <div className="gft-main-scroll">
          <div className={activeMode === "feed" ? "gft-main-inner" : "gft-main-inner gft-main-inner--full"}>
            <AnimatePresence mode="wait">
              {activeMode === "feed" && (
                <motion.div
                  key={`feed-${feedType}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <PostsFeed
                    feedType={feedType}
                    onProfileClick={setActiveProfileId}
                    searchQuery={searchQuery}
                  />
                </motion.div>
              )}
              {activeMode === "dm" && (
                <motion.div key="dm" className="h-full min-h-[60vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {activeDmUser ? (
                    <DirectMessageChat activeDmUser={activeDmUser} />
                  ) : (
                    <p className="gft-empty">Select a conversation or search for a trader to message.</p>
                  )}
                </motion.div>
              )}
              {activeMode === "servers" && (
                <motion.div key="chat" className="h-full min-h-[60vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {activeChannel?.type === "voice" ? (
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

      {/* ── Right: X explore + profile ── */}
      <aside className="gft-right-panel">
        <div className="gft-search md:hidden">
          <Search size={16} className="gft-search-icon" />
          <input
            type="search"
            placeholder="Search GFT Social..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="gft-card">
          <UserProfile
            activeProfileId={activeProfileId || currentUser?.uid}
            onReset={() => setActiveProfileId(null)}
            activeServer={activeServerData}
          />
        </div>

        {activeMode === "feed" && (
          <div className="gft-card">
            <TrendingSidebar />
          </div>
        )}

        <div className="gft-card">
          <h3 className="gft-card-title">Platform</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--gft-text-muted)" }}>
            X-style posts, threads, polls & bookmarks — plus Discord servers, channels, voice, and DMs. All inside Global Financial Terminal.
          </p>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="gft-mobile-nav" aria-label="Mobile">
        <button type="button" className={activeMode === "feed" ? "active" : ""} onClick={() => setActiveMode("feed")}>
          <Home size={20} />
          Home
        </button>
        <button type="button" onClick={() => setActiveMode("dm")} className={activeMode === "dm" ? "active" : ""}>
          <MessageSquare size={20} />
          DMs
        </button>
        <button type="button" onClick={() => setActiveView("globe")}>
          <LayoutDashboard size={20} />
          Terminal
        </button>
        <button type="button" onClick={() => setActiveProfileId(currentUser?.uid)}>
          <Users size={20} />
          Profile
        </button>
      </nav>

      <button type="button" className="gft-compose-fab" aria-label="Compose" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <PenLine size={22} />
      </button>

      {showSettings && activeServer && (
        <ServerSettingsModal serverId={activeServer} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
