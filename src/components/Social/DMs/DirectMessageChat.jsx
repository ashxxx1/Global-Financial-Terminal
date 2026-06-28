import { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { Paperclip, Send, Trash2 } from "lucide-react";

export default function DirectMessageChat({ activeDmUser }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const chatId = currentUser && activeDmUser
      ? [currentUser.uid, activeDmUser.id].sort().join('_')
      : null;

  useEffect(() => {
      if (!chatId) return;

      const q = query(
          collection(db, "messages"),
          where("chatId", "==", chatId),
          orderBy("createdAtMs", "asc")
      );

      const unsub = onSnapshot(q, (snap) => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMessages(msgs);
          setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      });

      return () => unsub();
  }, [chatId]);

  const upsertThread = async (content) => {
      if (!chatId || !currentUser || !activeDmUser) return;
      const participantIds = [currentUser.uid, activeDmUser.id].sort();
      await setDoc(doc(db, "dm_threads", chatId), {
          chatId,
          participantIds,
          participantProfiles: {
              [currentUser.uid]: {
                  displayName: currentUser.displayName || "You",
                  username: currentUser.email?.split("@")[0] || "you",
                  photoURL: currentUser.photoURL || null,
              },
              [activeDmUser.id]: {
                  displayName: activeDmUser.displayName || "User",
                  username: activeDmUser.username || activeDmUser.id.slice(0, 8),
                  photoURL: activeDmUser.photoURL || null,
              },
          },
          lastMessage: content,
          lastMessageAt: Date.now(),
          updatedAtMs: Date.now(),
      }, { merge: true });
  };

  const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!inputText.trim() || !chatId || !currentUser) return;

      const msgContent = inputText.trim();
      setInputText("");

      try {
          await addDoc(collection(db, "messages"), {
              chatId,
              authorId: currentUser.uid,
              content: msgContent,
              mediaUrls: [],
              createdAtMs: Date.now(),
              editedAtMs: null,
              isDeleted: false,
          });
          await upsertThread(msgContent);
      } catch (err) {
          console.error(err);
      }
  };

  const handleDelete = async (msgId) => {
      try {
          await updateDoc(doc(db, "messages", msgId), { isDeleted: true });
      } catch (err) {
          console.error(err);
      }
  };

  if (!activeDmUser) return null;

  return (
      <div className="gft-chat">
          <div className="gft-chat-messages custom-scrollbar">
              <div className="mb-8 mt-auto flex flex-col justify-end min-h-full">
                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center my-10 text-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-4" style={{ background: "var(--gft-elevated)" }}>
                              <img src={activeDmUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeDmUser.id}`} alt="" className="w-full h-full object-cover"/>
                          </div>
                          <h2 className="gft-panel-title text-xl mb-2">{activeDmUser.displayName}</h2>
                          <p className="text-sm max-w-md" style={{ color: "var(--gft-text-muted)" }}>
                              This is the beginning of your direct message history with <strong>@{activeDmUser.username || activeDmUser.id.slice(0, 8)}</strong>.
                          </p>
                      </div>
                  )}

                  {messages.map((msg, i) => {
                      const isMine = msg.authorId === currentUser?.uid;
                      const isConsecutive = i > 0 && messages[i - 1].authorId === msg.authorId && !messages[i-1].isDeleted && !msg.isDeleted && (msg.createdAtMs - messages[i-1].createdAtMs < 5 * 60 * 1000);

                      if (msg.isDeleted) {
                          return (
                              <div key={msg.id} className="text-xs italic py-1 px-14" style={{ color: "var(--gft-text-soft)" }}>
                                  [message deleted]
                              </div>
                          );
                      }

                      return (
                          <div key={msg.id} className={`gft-chat-msg group ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                              {!isConsecutive && (
                                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                                      <img
                                          src={(isMine ? currentUser?.photoURL : activeDmUser.photoURL) || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.authorId}`}
                                          alt=""
                                          className="w-full h-full object-cover"
                                      />
                                  </div>
                              )}
                              {isConsecutive && <div className="w-9 flex-shrink-0" />}

                              <div className="flex-1 min-w-0">
                                  {!isConsecutive && (
                                      <div className="flex items-baseline gap-2 mb-0.5">
                                          <span className="font-semibold text-sm">{isMine ? "You" : activeDmUser.displayName}</span>
                                          <span className="text-xs" style={{ color: "var(--gft-text-soft)" }}>
                                              {new Date(msg.createdAtMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                      </div>
                                  )}
                                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.content}
                                  </div>
                              </div>

                              {isMine && (
                                  <button type="button" onClick={() => handleDelete(msg.id)} className="gft-icon-btn opacity-0 group-hover:opacity-100" title="Delete">
                                      <Trash2 size={14} />
                                  </button>
                              )}
                          </div>
                      );
                  })}
                  <div ref={messagesEndRef} />
              </div>
          </div>

          <div className="gft-chat-input-wrap">
              <form onSubmit={handleSendMessage} className="gft-chat-input">
                  <button type="button" className="gft-icon-btn flex-shrink-0">
                      <Paperclip size={20} />
                  </button>
                  <textarea
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                          }
                      }}
                      placeholder={`Message @${activeDmUser.username || activeDmUser.displayName}`}
                      rows={1}
                  />
                  <button type="submit" disabled={!inputText.trim()} className="gft-chat-send flex-shrink-0">
                      <Send size={18} />
                  </button>
              </form>
          </div>
      </div>
  );
}
