import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { Smile, Paperclip, Send, Trash2, MessageSquare, Phone, Video } from "lucide-react";

export default function DirectMessageChat({ activeDmUser }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Generate a consistent ID for the DM channel between these two users
  const chatId = currentUser && activeDmUser 
      ? [currentUser.uid, activeDmUser.id].sort().join('_') 
      : null;

  useEffect(() => {
      if (!chatId) return;
      
      const q = query(
          collection(db, "dm_messages"),
          where("chatId", "==", chatId),
          orderBy("createdAt", "asc")
      );
      
      const unsub = onSnapshot(q, async (snap) => {
          const msgs = await Promise.all(snap.docs.map(async (d) => {
              const data = d.data();
              // In DMs we don't necessarily need to fetch the author doc every time if we just check id
              // but for consistency with ChannelChat:
              let authorData = null;
              if (data.authorId === currentUser.uid) authorData = { ...currentUser, id: currentUser.uid };
              else if (data.authorId === activeDmUser.id) authorData = activeDmUser;
              else {
                  const authorDoc = await getDoc(doc(db, "users", data.authorId));
                  if (authorDoc.exists()) authorData = { id: authorDoc.id, ...authorDoc.data() };
              }
              
              return { id: d.id, ...data, author: authorData };
          }));
          setMessages(msgs);
          setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      });

      return () => unsub();
  }, [chatId, activeDmUser, currentUser]);

  const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!inputText.trim() || !chatId || !currentUser) return;
      
      const msgContent = inputText;
      setInputText("");
      
      try {
          await addDoc(collection(db, "dm_messages"), {
              chatId,
              authorId: currentUser.uid,
              content: msgContent,
              mediaUrls: [],
              createdAt: Date.now(),
              editedAt: null,
              isDeleted: false,
          });
      } catch (err) {
          console.error(err);
      }
  };
  
  const handleDelete = async (msgId) => {
      try {
          await updateDoc(doc(db, "dm_messages", msgId), { isDeleted: true });
      } catch (err) {
          console.error(err);
      }
  };

  if (!activeDmUser) return null;

  return (
      <div className="flex flex-col h-full bg-[#0b0c10] relative">
          
          {/* Header specific to DM */}
          <div className="absolute top-0 left-0 w-full h-14 border-b border-white/5 flex items-center justify-between px-6 z-20 pointer-events-none">
              <div /> {/* Left side is covered by main layout header */}
              <div className="flex items-center gap-4 text-slate-400 pointer-events-auto">
                  <button className="hover:text-white transition-colors"><Phone size={18} /></button>
                  <button className="hover:text-white transition-colors"><Video size={18} /></button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 pt-16 custom-scrollbar z-10">
              <div className="mb-8 mt-auto flex flex-col justify-end min-h-full">
                  
                  {/* DM Start Info */}
                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center my-10 text-center">
                          <div className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden mb-4">
                              <img src={activeDmUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeDmUser.id}`} alt="" className="w-full h-full object-cover"/>
                          </div>
                          <h2 className="text-2xl font-bold text-white font-display mb-2">{activeDmUser.displayName}</h2>
                          <p className="text-slate-400 text-sm max-w-md">
                              This is the beginning of your direct message history with <strong>@{activeDmUser.username}</strong>.
                          </p>
                      </div>
                  )}

                  {messages.map((msg, i) => {
                      const isConsecutive = i > 0 && messages[i - 1].authorId === msg.authorId && !messages[i-1].isDeleted && !msg.isDeleted && (msg.createdAt - messages[i-1].createdAt < 5 * 60 * 1000);
                      
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
                                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                                          <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                  )}
                                  <div className="text-slate-300 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.content}
                                      {msg.editedAt && <span className="text-[10px] text-slate-500 ml-1">(edited)</span>}
                                  </div>
                              </div>
                              
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#1e293b] border border-white/10 rounded-md px-1 py-0.5 absolute right-6 -mt-3 shadow-sm z-10">
                                  <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Smile size={14}/></button>
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
          
          <div className="px-6 py-4 flex-shrink-0 z-10">
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
                      placeholder={`Message @${activeDmUser.username}`}
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
