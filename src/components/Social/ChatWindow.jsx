import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// Seed simulated chat logs
const MOCK_CHAT_LOGS = {
  "AlexTrade": [
    { id: "m1", senderId: "other", text: "Hey! What's your take on ASML's 2nm yield rates?", time: "10:14 AM" },
    { id: "m2", senderId: "me", text: "Moat is deep, backlog is €40B. I am long here.", time: "10:15 AM" },
    { id: "m3", senderId: "other", text: "Fair enough. Watch out for EUR/USD exchange rate volatility though.", time: "10:18 AM" }
  ],
  "MarketWatcher": [
    { id: "m4", senderId: "other", text: "Check out this SPX technical correction chart:", time: "Yesterday" },
    { id: "m5", senderId: "other", text: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60", isImage: true, time: "Yesterday" },
    { id: "m6", senderId: "me", text: "coiling for a breakout. Nice chart.", time: "Yesterday" }
  ]
};

export default function ChatWindow({ activeFriend }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState(() => {
    if (!currentUser && activeFriend) {
      return MOCK_CHAT_LOGS[activeFriend.name] || [];
    }
    return [];
  });
  const [prevFriendId, setPrevFriendId] = useState(activeFriend ? (activeFriend.uid || activeFriend.name) : null);
  const [prevUserUid, setPrevUserUid] = useState(currentUser?.uid || null);
  const [inputText, setInputText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [showImgInput, setShowImgInput] = useState(false);
  const bottomRef = useRef(null);

  const currentFriendId = activeFriend ? (activeFriend.uid || activeFriend.name) : null;
  const currentUserUid = currentUser?.uid || null;
  if (currentFriendId !== prevFriendId || currentUserUid !== prevUserUid) {
    setPrevFriendId(currentFriendId);
    setPrevUserUid(currentUserUid);
    if (!currentUser && activeFriend) {
      setMessages(MOCK_CHAT_LOGS[activeFriend.name] || []);
    } else {
      setMessages([]);
    }
  }

  // Load chat messages
  useEffect(() => {
    if (!activeFriend) return;
    if (!currentUser) return;

    // Firestore query for mutual chat messages
    const q = query(
      collection(db, "channel_messages"),
      where("chatId", "in", [
        `${currentUser.uid}_${activeFriend.uid}`,
        `${activeFriend.uid}_${currentUser.uid}`
      ]),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId === currentUser.uid ? "me" : "other",
          text: doc.data().text,
          imageURL: doc.data().imageURL,
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."
        }));
        setMessages(list);
      } else {
        // Fallback to mock logs if Firestore collection is empty
        setMessages(MOCK_CHAT_LOGS[activeFriend.name] || []);
      }
    }, () => {
      // Error callback - fallback silently
      setMessages(MOCK_CHAT_LOGS[activeFriend.name] || []);
    });

    return () => unsub();
  }, [activeFriend, currentUser]);

  // Scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageURL.trim()) return;

    const newMsgText = inputText;
    const newImg = imageURL;
    setInputText("");
    setImageURL("");
    setShowImgInput(false);

    if (currentUser) {
      const chatId = `${currentUser.uid}_${activeFriend.uid}`;
      try {
        await addDoc(collection(db, "channel_messages"), {
          chatId,
          senderId: currentUser.uid,
          text: newMsgText,
          imageURL: newImg || null,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Firebase send failed:", err);
      }
    } else {
      // Local simulator append
      setMessages((prev) => [
        ...prev,
        {
          id: "m_sim_" + Date.now(),
          senderId: "me",
          text: newMsgText,
          imageURL: newImg || null,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  if (!activeFriend) {
    return (
      <div className="chat-window__empty">
        <span>💬</span>
        <p>Select a friend from the roster to open a secure direct terminal line.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        <div className="chat-window__avatar">
          {activeFriend.avatar && (activeFriend.avatar.startsWith("http") || activeFriend.avatar.includes("/") || activeFriend.avatar.startsWith("data:")) ? (
            <img src={activeFriend.avatar} alt={activeFriend.name} className="chat-window__avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            activeFriend.avatar || "T"
          )}
        </div>
        <div>
          <div className="chat-window__friend-name">{activeFriend.name}</div>
          <div className="chat-window__friend-role">{activeFriend.role}</div>
        </div>
        <div className="chat-window__badge">{activeFriend.reputation}</div>
      </div>

      <div className="chat-window__messages">
        {messages.map((msg) => {
          const isImage = msg.isImage || msg.imageURL;
          return (
            <div key={msg.id} className={`chat-window__msg-bubble ${msg.senderId}`}>
              <div className="chat-window__bubble-inner">
                {isImage ? (
                  <img
                    src={msg.imageURL || msg.text}
                    alt="Analysis screenshot"
                    className="chat-window__shared-img"
                  />
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className="chat-window__msg-time">{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-window__composer" onSubmit={handleSendMessage}>
        {showImgInput && (
          <div className="chat-window__img-input-row">
            <input
              type="text"
              placeholder="Paste analysis image URL..."
              value={imageURL}
              onChange={(e) => setImageURL(e.target.value)}
              className="chat-window__input"
            />
          </div>
        )}
        <div className="chat-window__composer-row">
          <button
            type="button"
            className={`chat-window__img-btn ${showImgInput ? "active" : ""}`}
            onClick={() => setShowImgInput(!showImgInput)}
            title="Share Chart Image Link"
          >
            🖼️
          </button>
          <input
            type="text"
            placeholder={`Message ${activeFriend.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-window__input"
          />
          <button type="submit" className="chat-window__send-btn" disabled={!inputText.trim() && !imageURL.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
