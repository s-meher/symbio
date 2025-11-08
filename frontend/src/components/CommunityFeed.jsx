import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFeed, postFeed } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Send, Users, MessageCircle } from 'lucide-react';

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
      const resp = await postFeed({ user_id: user.userId, text, share_opt_in: shareOpt });
      setPosts((prev) => [{ id: resp.post_id, text, ts: new Date().toISOString(), userRole: user.role }, ...prev]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post.');
    }
  }

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-4xl"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Waves className="h-8 w-8 text-primary" />
              </motion.div>
              Community Flow
            </CardTitle>
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 border border-cyan-200">
              <Users className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-bold text-cyan-700">{posts.length} ripples</span>
            </div>
          </div>
          <AnimatePresence>
            {location.state?.flash && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3 border border-emerald-200"
              >
                <p className="text-sm font-semibold text-emerald-700">{location.state.flash}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Post Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-cyan-200/60 bg-white/90 p-6 backdrop-blur-sm"
          >
            <Textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Share your story, encourage others..." 
              className="mb-4"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="share-opt" 
                  checked={shareOpt} 
                  onCheckedChange={(val) => setShareOpt(Boolean(val))} 
                />
                <Label htmlFor="share-opt" className="text-sm font-semibold cursor-pointer">
                  Share my name with the community
                </Label>
              </div>
              <Button onClick={handlePost} disabled={!text.trim()} className="group">
                <span>Send</span>
                <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-3 text-sm text-destructive font-semibold"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Feed */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    delay: idx * 0.05 
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="group relative overflow-hidden rounded-2xl border-2 border-cyan-200/60 bg-white/90 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-lg"
                >
                  {/* Gradient border on hover */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-100/0 via-blue-100/50 to-cyan-100/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          post.userRole === 'lender' 
                            ? 'bg-gradient-to-br from-purple-400 to-pink-500' 
                            : 'bg-gradient-to-br from-cyan-400 to-blue-500'
                        } text-white shadow-lg`}
                      >
                        {post.userRole === 'lender' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          <MessageCircle className="h-5 w-5" />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-bold text-primary capitalize">{post.userRole}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.ts).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{post.text}</p>
                  
                  {/* Wave decoration */}
                  <motion.div 
                    className="absolute bottom-0 right-0 h-16 w-16 opacity-10"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Waves className="h-full w-full text-primary" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {posts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="py-16 text-center"
              >
                <Waves className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">
                  No ripples yet. Be the first to share!
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}