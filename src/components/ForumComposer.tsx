import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  type ForumMedia, createPost, uploadForumMedia, humanForumError,
  initialsFor, MAX_POST_CHARS, MAX_MEDIA_ITEMS,
} from "../lib/forum";
import { IconImage, IconClose } from "./ForumIcons";

export default function ForumComposer() {
  const user = useAuth((s) => s.user);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Local object-URL previews for whatever's currently attached; revoked
  // whenever the selection changes so we don't leak blob URLs.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [files]);

  if (!user) return null;

  const hasVideo = files.some((f) => f.type.startsWith("video/"));
  const remaining = MAX_POST_CHARS - text.length;
  const canPost = !posting && (text.trim().length > 0 || files.length > 0) && remaining >= 0;

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    setError(null);

    if (picked.some((f) => !f.type.startsWith("image/") && !f.type.startsWith("video/"))) {
      setError("Only images and videos are supported.");
      return;
    }

    const pickingVideo = picked.some((f) => f.type.startsWith("video/"));
    if (hasVideo || pickingVideo) {
      if (files.length + picked.length > 1) {
        setError("Attach one video, or up to 4 images — not both.");
        return;
      }
      setFiles(picked.slice(0, 1));
      return;
    }

    const combined = [...files, ...picked];
    if (combined.length > MAX_MEDIA_ITEMS) setError(`Up to ${MAX_MEDIA_ITEMS} images per post.`);
    setFiles(combined.slice(0, MAX_MEDIA_ITEMS));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  async function handleSubmit() {
    if (!user || !canPost) return;
    setPosting(true); setError(null);
    try {
      const media: ForumMedia[] = [];
      for (const file of files) media.push(await uploadForumMedia(user, file));
      await createPost(user, text, media);
      setText("");
      setFiles([]);
    } catch (err) {
      setError(humanForumError(err));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="composer">
      <div className="composer-row">
        {user.photoURL
          ? <img className="post-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          : <span className="post-avatar">{initialsFor(user.displayName, user.email)}</span>}

        <div className="composer-body">
          <textarea
            placeholder="Share a take on the markets…"
            value={text}
            maxLength={MAX_POST_CHARS + 200}
            onChange={(e) => setText(e.target.value)}
            rows={2}
          />

          {files.length > 0 && (
            <div
              className="media-preview"
              style={{ gridTemplateColumns: files.length === 1 ? "1fr" : "1fr 1fr" }}
            >
              {files.map((f, i) => (
                <div key={i} className="media-thumb" style={{ aspectRatio: files.length === 1 ? "16/9" : "1" }}>
                  {f.type.startsWith("video/")
                    ? <video src={previews[i]} muted />
                    : <img src={previews[i]} alt="" />}
                  <button className="media-remove" onClick={() => removeFile(i)} aria-label="Remove" title="Remove">
                    <IconClose size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="auth-banner err" style={{ marginTop: 8, fontSize: 11.5, padding: "6px 10px" }}>{error}</div>}

          <div className="composer-foot">
            <div className="composer-tools">
              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={onPickFiles}
              />
              <button
                className="tool-btn"
                onClick={() => fileInput.current?.click()}
                disabled={posting || (hasVideo && files.length >= 1) || (!hasVideo && files.length >= MAX_MEDIA_ITEMS)}
                title="Add photo or video"
                aria-label="Add photo or video"
              >
                <IconImage />
              </button>
            </div>
            <span className={`composer-count${remaining < 0 ? " over" : ""}`}>
              {remaining < 100 ? remaining : ""}
            </span>
            <button className="composer-post-btn" onClick={handleSubmit} disabled={!canPost}>
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
