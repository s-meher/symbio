import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFeed, postFeed } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';

export default function CommunityFeed() {
  const user = useRequiredUser();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [shareOpt, setShareOpt] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    async function loadFeed() {
      try {
        // GET /feed -> {"posts":[...]}
        const resp = await fetchFeed();
        const ordered = [...(resp.posts || [])].sort(
          (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
        );
        setPosts(ordered);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load feed.');
      }
    }
    loadFeed();
  }, []);

  async function handlePost() {
    if (!text.trim()) return;
    try {
      // POST /feed/post -> {"post_id":string,"preview":string}
      const resp = await postFeed({ user_id: user.userId, text, share_opt_in: shareOpt });
      setPosts((prev) => [{ id: resp.post_id, text, ts: new Date().toISOString(), userRole: user.role }, ...prev]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post.');
    }
  }

  if (!user) return null;

  return (
    <div className="card">
      <h2>Community Feed</h2>
      {location.state?.flash && <p>{location.state.flash}</p>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share encouragement…" />
      <div className="checkbox-row">
        <input id="share-opt" type="checkbox" checked={shareOpt} onChange={(e) => setShareOpt(e.target.checked)} />
        <label htmlFor="share-opt">Share my name</label>
      </div>
      <button className="bubble-btn" onClick={handlePost}>
        Post
      </button>
      {error && <p>{error}</p>}
      <div className="feed-list">
        {posts.map((post) => (
          <div key={post.id} className="feed-item">
            <strong>{post.userRole}</strong>
            <p>{post.text}</p>
            <small>{new Date(post.ts).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
