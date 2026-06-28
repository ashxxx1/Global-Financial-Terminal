import { useState, useEffect } from 'react';
import { db } from "../../../services/firebase";
import { doc, updateDoc, increment, setDoc, deleteDoc, addDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export default function useInteractions(currentUser) {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [repostedPosts, setRepostedPosts] = useState(new Set());

  // Load Bookmarks for the current user
  useEffect(() => {
      if (!currentUser) return;
      const q = query(collection(db, "bookmarks"), where("userId", "==", currentUser.uid));
      const unsub = onSnapshot(q, snap => {
          setBookmarkedPosts(new Set(snap.docs.map(d => d.data().postId)));
      });
      return () => unsub();
  }, [currentUser]);

  const toggleLike = async (postId, currentlyLiked) => {
      if (!currentUser) return;
      const postRef = doc(db, "social_posts", postId);
      const newLiked = new Set(likedPosts);
      if (currentlyLiked) {
          newLiked.delete(postId);
          await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
          newLiked.add(postId);
          await updateDoc(postRef, { likeCount: increment(1) });
      }
      setLikedPosts(newLiked);
  };
  
  const toggleBookmark = async (postId) => {
      if (!currentUser) return;
      const bookmarkId = `${currentUser.uid}_${postId}`;
      const bookmarkRef = doc(db, "bookmarks", bookmarkId);
      
      const newBookmarks = new Set(bookmarkedPosts);
      if (newBookmarks.has(postId)) {
          newBookmarks.delete(postId);
          await deleteDoc(bookmarkRef).catch(console.error);
      } else {
          newBookmarks.add(postId);
          await setDoc(bookmarkRef, {
              userId: currentUser.uid,
              postId: postId,
              createdAtMs: Date.now()
          }).catch(console.error);
      }
      setBookmarkedPosts(newBookmarks);
  };

  const handlePlainRepost = async (post) => {
      if (!currentUser) return;
      const newReposts = new Set(repostedPosts);
      if (newReposts.has(post.id)) return; // Already reposted
      
      try {
          await addDoc(collection(db, "social_posts"), {
              authorId: currentUser.uid,
              content: "",
              mediaUrls: [],
              createdAtMs: Date.now(),
              repostOfId: post.id,
              visibility: 'public',
              isDeleted: false,
          });
          await updateDoc(doc(db, "social_posts", post.id), { repostCount: increment(1) });
          newReposts.add(post.id);
          setRepostedPosts(newReposts);
      } catch (err) {
          console.error("Repost failed", err);
      }
  };

  const handleVote = async (postId, poll, optionIndex) => {
    if (!currentUser || !poll) return;
    const hasVotedAny = poll.options.some(o => o.votes.includes(currentUser.uid));
    if (hasVotedAny) return; // Prevent double voting

    const newOptions = [...poll.options];
    newOptions[optionIndex].votes.push(currentUser.uid);
    const newTotal = (poll.totalVotes || 0) + 1;

    try {
        await updateDoc(doc(db, "social_posts", postId), {
            "poll.options": newOptions,
            "poll.totalVotes": newTotal
        });
    } catch (err) {
        console.error("Vote failed", err);
    }
  };

  return {
    likedPosts,
    bookmarkedPosts,
    repostedPosts,
    toggleLike,
    toggleBookmark,
    handlePlainRepost,
    handleVote
  };
}
