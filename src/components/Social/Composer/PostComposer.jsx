import React, { useState } from 'react';
import { db } from "../../../services/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ImageIcon, BarChart2, Smile, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PostComposer({ 
    currentUser, 
    replyingTo, setReplyingTo, 
    quoting, setQuoting, 
    editingPost, setEditingPost, 
    initialText = "" 
}) {
    const [inputText, setInputText] = useState(initialText);
    const [mediaUrls, setMediaUrls] = useState([]);
    const [mediaInput, setMediaInput] = useState("");
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [showPollInput, setShowPollInput] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addMediaUrl = () => {
        if (mediaInput.trim() && mediaUrls.length < 4) {
            setMediaUrls([...mediaUrls, mediaInput.trim()]);
            setMediaInput("");
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim() && mediaUrls.length === 0 && !quoting) return;
        if (!currentUser || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (editingPost) {
                if (Date.now() - editingPost.createdAtMs > 5 * 60 * 1000) {
                    alert("Edit window has passed (5 minutes).");
                    setEditingPost(null);
                    setInputText("");
                    return;
                }
                await updateDoc(doc(db, "social_posts", editingPost.id), {
                    content: inputText.slice(0, 280), text: inputText.slice(0, 280),
                    editedAtMs: Date.now()
                });
                setEditingPost(null);
                setInputText("");
                return;
            }

            const tags = inputText.match(/#[\w]+/g)?.map(t => t.toLowerCase()) || [];
            
            let pollData = null;
            if (showPollInput && pollOptions.filter(o => o.trim()).length >= 2) {
                pollData = {
                    options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: [] })),
                    totalVotes: 0
                };
            }

            const postData = {
                authorId: currentUser.uid,
                content: inputText.slice(0, 280), text: inputText.slice(0, 280),
                mediaUrls: mediaUrls.slice(0, 4),
                poll: pollData,
                createdAtMs: Date.now(),
                editedAtMs: null,
                parentPostId: replyingTo ? (replyingTo.id || replyingTo) : null,
                quotedPostId: quoting ? (quoting.id || quoting) : null,
                repostOfId: null,
                visibility: 'public',
                isDeleted: false,
                likeCount: 0,
                repostCount: 0,
                replyCount: 0,
                quoteCount: 0,
                viewCount: 0,
                tags
            };

            await addDoc(collection(db, "social_posts"), postData);

            setInputText("");
            setMediaUrls([]);
            setShowMediaInput(false);
            setMediaInput("");
            setShowPollInput(false);
            setPollOptions(["", ""]);
            if(setReplyingTo) setReplyingTo(null);
            if(setQuoting) setQuoting(null);
        } catch (err) {
            console.error("Failed to post:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-panel p-4 flex gap-4 relative z-10 border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border-2 border-indigo-500/30">
                <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                {(replyingTo || quoting || editingPost) && (
                    <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg backdrop-blur-md">
                        <span className="text-xs font-medium text-indigo-300 flex items-center gap-2">
                            {editingPost ? 'Editing post...' : replyingTo ? `Replying to @${replyingTo.author?.username || 'user'}` : quoting ? `Quoting @${quoting.author?.username || 'user'}` : ''}
                        </span>
                        <button 
                            onClick={() => {
                                if (setReplyingTo) setReplyingTo(null); 
                                if (setQuoting) setQuoting(null); 
                                if (setEditingPost) setEditingPost(null); 
                                setInputText("");
                            }} 
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={replyingTo ? "Post your reply..." : quoting ? "Add a comment..." : "What's happening in the markets?"}
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none min-h-[60px] text-lg font-light leading-relaxed"
                    maxLength={280}
                />
                
                {/* Media Preview */}
                {mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {mediaUrls.map((url, i) => (
                            <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 w-24 h-24">
                                <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                                <button onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <AnimatePresence>
                    {showMediaInput && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 mb-3 overflow-hidden">
                            <input 
                                type="text" 
                                value={mediaInput}
                                onChange={(e) => setMediaInput(e.target.value)}
                                placeholder="Paste image/gif URL..." 
                                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-500 text-white transition-colors" 
                            />
                            <button onClick={addMediaUrl} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm transition-colors">Add</button>
                        </motion.div>
                    )}
                    {showPollInput && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-2 mb-3 overflow-hidden p-3 bg-black/20 rounded-xl border border-white/5">
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions];
                                            newOpts[i] = e.target.value;
                                            setPollOptions(newOpts);
                                        }} 
                                        placeholder={`Choice ${i+1}`} 
                                        className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-500 text-white transition-colors" 
                                    />
                                    {i >= 2 && (
                                        <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 p-1"><X size={14} /></button>
                                    )}
                                </div>
                            ))}
                            {pollOptions.length < 4 && (
                                <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-indigo-400 text-xs text-left w-fit hover:underline mt-1 font-medium">+ Add choice</button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                    <div className="flex gap-1 text-indigo-400">
                        <button onClick={() => setShowMediaInput(!showMediaInput)} className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Media">
                            <ImageIcon size={18} />
                        </button>
                        <button onClick={() => setShowPollInput(!showPollInput)} className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Poll">
                            <BarChart2 size={18} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Emoji">
                            <Smile size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${inputText.length > 250 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {inputText.length}/280
                        </span>
                        <button 
                            onClick={handlePostSubmit}
                            disabled={(!inputText.trim() && mediaUrls.length === 0 && !quoting) || isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-1.5 rounded-full font-medium transition-colors text-sm flex items-center justify-center min-w-[70px] shadow-lg shadow-indigo-500/20"
                        >
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
