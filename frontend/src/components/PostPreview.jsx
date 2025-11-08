import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postFeed } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { getSessionValue } from '../session';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

export default function PostPreview() {
  const navigate = useNavigate();
  const user = useRequiredUser();
  const amount = getSessionValue('borrow_amount', 0) || 0;
  const reason = getSessionValue('borrow_reason', 'a community project');
  const [shareName, setShareName] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const composed = `Someone (Borrower) borrowed $${amount} for ${reason}.`;

  async function handleShare() {
    setLoading(true);
    setError('');
    try {
      // POST /feed/post -> {"post_id":string,"preview":string}
      await postFeed({ user_id: user.userId, text: composed, share_opt_in: shareName });
      navigate('/feed', { state: { flash: 'Shared!' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Card className="mx-auto max-w-xl bg-card/90">
      <CardHeader>
        <CardTitle>Post preview</CardTitle>
        <p className="text-sm text-muted-foreground">Shows up at the top of the community feed.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-2xl border-2 border-dashed border-border bg-white/80 p-4 text-lg font-semibold">
          {composed}
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id="share" checked={shareName} onCheckedChange={(val) => setShareName(Boolean(val))} />
          <Label htmlFor="share">Share my name in community feed</Label>
        </div>
        {error && <p className="text-destructive">{error}</p>}
        <Button onClick={handleShare} disabled={loading}>
          {loading ? 'Posting…' : 'Post to feed'}
        </Button>
      </CardContent>
    </Card>
  );
}
