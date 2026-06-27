import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { Smile, Paperclip, Send, MoreVertical, Edit2, Trash2, Pin, MessageSquare, X } from "lucide-react";

export default function ChannelChat({ activeChannel }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
      if (!activeChannel) return;
      
      const q = query(
          collection(db, "channel_messages"),
          where("channelId", "==", activeChannel.id),
          orderBy("createdAtMs", "asc")
      );
      
      let isMounted = true;
      const unsub = onSnapshot(q, async (snap) => {
          const msgs = await Promise.all(snap.docs.map(async (d) => {
              const data = d.data();
              let authorData = null;
              if (data.authorId) {
                  const authorDoc = await getDoc(doc(db, "users", data.authorId));
                  if (authorDoc.exists()) authorData = authorDoc.data();
              }
              return { id: d.id, ...data, author: authorData };
          }));
          if (!isMounted) return;
          setMessages(msgs);
          setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      });

      return () => {
          isMounted = false;
          unsub();
      };
  }, [activeChannel]);

  const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!inputText.trim() || !activeChannel || !currentUser) return;
      
      const msgContent = inputText;
      
      try {
          if (editingMsg) {
              await updateDoc(doc(db, "messages", editingMsg.id), {
                  content: msgContent,
                  editedAtMs: Date.now()
              });
              setEditingMsg(null);
          } else {
              await addDoc(collection(db, "channel_messages"), {
                  channelId: activeChannel.id,
                  authorId: currentUser.uid,
                  content: msgContent,
                  mediaUrls: [],
                  createdAtMs: Date.now(),
                  editedAtMs: null,
                  isDeleted: false,
                  replyToMessageId: null,
                  threadId: null,
                  isPinned: false,
                  reactions: {}
              });
          }
          setInputText("");
      } catch (err) {
          console.error(err);
      }
  };
  
  const handleEditClick = (msg) => {
      setEditingMsg(msg);
      setInputText(msg.content);
      // scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const togglePin = async (msgId, currentPin) => {
      try {
          await updateDoc(doc(db, "messages", msgId), { isPinned: !currentPin });
      } catch (err) {
          console.error(err);
      }
  };
  
  const addReaction = async (msgId, currentReactions, emoji) => {
      if (!currentUser) return;
      const newReactions = { ...(currentReactions || {}) };
      if (!newReactions[emoji]) newReactions[emoji] = [];
      
      if (newReactions[emoji].includes(currentUser.uid)) {
          newReactions[emoji] = newReactions[emoji].filter(id => id !== currentUser.uid);
          if (newReactions[emoji].length === 0) delete newReactions[emoji];
      } else {
          newReactions[emoji].push(currentUser.uid);
      }
      
      try {
          await updateDoc(doc(db, "messages", msgId), { reactions: newReactions });
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

  const renderMarkdown = (text) => {
      if (!text) return null;
      // Replaced dangerouslySetInnerHTML with safe rendering
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|__.*?__|`.*?`)/g);
      return (
          <span>
              {parts.map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
                  if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
                  if (part.startsWith('~~') && part.endsWith('~~')) return <del key={i}>{part.slice(2, -2)}</del>;
                  if (part.startsWith('__') && part.endsWith('__')) return <u key={i}>{part.slice(2, -2)}</u>;
                  if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-black/30 px-1 py-0.5 rounded text-indigo-300 font-mono text-[13px]">{part.slice(1, -1)}</code>;
                  return <span key={i}>{part}</span>;
              })}
          </span>
      );
  };

  if (!activeChannel) return null;

  return (
      <div className="flex flex-col h-full bg-[#0b0c10] relative">
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="mb-8 mt-auto flex flex-col justify-end min-h-full">
                  {messages.map((msg, i) => {
                      const isConsecutive = i > 0 && messages[i - 1].authorId === msg.authorId && !messages[i-1].isDeleted && !msg.isDeleted && (msg.createdAtMs - messages[i-1].createdAtMs < 5 * 60 * 1000);
                      
                      if (msg.isDeleted) {
                          return (
                              <div key={msg.id} className="text-slate-500 text-xs italic py-1 px-14">
                                  [message deleted]
                              </div>
                          );
                      }
                      
                      return (
                          <div key={msg.id} className={`group flex gap-4 hover:bg-white/5 px-2 py-1 -mx-2 rounded-md ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                              {isConsecutive ? (
                                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="text-[10px] text-slate-500">
                                          {new Date(msg.createdAtMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                              ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 mt-1 cursor-pointer">
                                      <img src={msg.author?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.authorId}`} alt="" className="w-full h-full object-cover"/>
                                  </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                  {!isConsecutive && (
                                      <div className="flex items-baseline gap-2">
                                          <span className="font-medium text-slate-200 text-sm font-display hover:underline cursor-pointer">{msg.author?.displayName || 'Unknown'}</span>
                                          <span className="text-xs text-slate-500">{new Date(msg.createdAtMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                  )}
                                  <div className="text-slate-300 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {renderMarkdown(msg.content)}
                                      {msg.editedAtMs && <span className="text-[10px] text-slate-500 ml-1">(edited)</span>}
                                  </div>
                                  
                                  {/* Reactions */}
                                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                                              <button 
                                                  key={emoji}
                                                  onClick={() => addReaction(msg.id, msg.reactions, emoji)}
                                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border ${users.includes(currentUser?.uid) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                              >
                                                  <span>{emoji}</span>
                                                  <span className="font-semibold">{users.length}</span>
                                              </button>
                                          ))}
                                      </div>
                                  )}
                              </div>
                              
                              {msg.isPinned && (
                                  <div className="absolute right-4 top-2 text-amber-500" title="Pinned Message">
                                      <Pin size={14} className="fill-amber-500/20" />
                                  </div>
                              )}
                              
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#1e293b] border border-white/10 rounded-md px-1 py-0.5 absolute right-6 -mt-3 shadow-sm z-10">
                                  <div className="relative group/emoji">
                                      <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Smile size={14}/></button>
                                      <div className="absolute bottom-8 right-0 hidden group-hover/emoji:flex bg-[#0f172a] border border-white/10 rounded p-1 gap-1 shadow-xl">
                                          {['👍', '❤️', '🔥', '😂', '🎉'].map(emoji => (
                                              <button key={emoji} onClick={() => addReaction(msg.id, msg.reactions || {}, emoji)} className="p-1 hover:bg-white/10 rounded">{emoji}</button>
                                          ))}
                                      </div>
                                  </div>
                                  <button onClick={() => togglePin(msg.id, msg.isPinned)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title={msg.isPinned ? "Unpin" : "Pin"}><Pin size={14}/></button>
                                  {currentUser?.uid === msg.authorId && (
                                      <button onClick={() => handleEditClick(msg)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Edit2 size={14}/></button>
                                  )}
                                  {currentUser?.uid === msg.authorId && (
                                      <button onClick={() => handleDelete(msg.id)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                                  )}
                              </div>
                          </div>
                      )
                  })}
                  <div ref={messagesEndRef} />
              </div>
          </div>
          
          <div className="px-6 py-4 flex-shrink-0 flex flex-col gap-2">
              {editingMsg && (
                  <div className="text-xs text-indigo-400 flex items-center justify-between bg-indigo-500/10 px-3 py-1.5 rounded-md border border-indigo-500/20">
                      <span>Editing message...</span>
                      <button onClick={() => { setEditingMsg(null); setInputText(""); }} className="hover:text-white"><X size={14}/></button>
                  </div>
              )}
              <form onSubmit={handleSendMessage} className="bg-[#1e293b] rounded-lg p-2 flex items-end gap-2 border border-white/5 shadow-inner">
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0">
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
                      placeholder={`Message #${activeChannel.name}`}
                      className="flex-1 bg-transparent border-none outline-none text-slate-200 resize-none max-h-48 py-2 min-h-[40px] text-sm"
                      rows={1}
                  />
                  <button type="submit" disabled={!inputText.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-md transition-colors flex-shrink-0">
                      <Send size={18} />
                  </button>
              </form>
          </div>
      </div>
  );
}
