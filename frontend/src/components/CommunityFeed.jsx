import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFeed, postFeed } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

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
    <Card className="mx-auto max-w-3xl bg-card/95">
      <CardHeader>
        <CardTitle>Community Feed</CardTitle>
        {location.state?.flash && <p className="text-sm text-emerald-700">{location.state.flash}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share encouragement…" />
        <div className="flex items-center gap-2">
          <Checkbox id="share-opt" checked={shareOpt} onCheckedChange={(val) => setShareOpt(Boolean(val))} />
          <Label htmlFor="share-opt">Share my name</Label>
        </div>
        <Button onClick={handlePost}>Post</Button>
        {error && <p className="text-destructive">{error}</p>}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-3xl border-2 border-border bg-white/80 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <strong className="text-foreground">{post.userRole}</strong>
                <span>{new Date(post.ts).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-lg">{post.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
