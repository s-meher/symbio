import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBorrowReason } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { setSessionValue } from '../session';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

export default function BorrowReason() {
  const navigate = useNavigate();
  const user = useRequiredUser();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please share a reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /borrow/reason Request: {"user_id":string,"reason":string} Response: {"ok":true}
      await postBorrowReason({ user_id: user.userId, reason });
      setSessionValue('borrow_reason', reason);
      navigate('/borrow/amount');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save reason.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleNext}>
      <Card className="mx-auto max-w-xl space-y-4 bg-card/90">
        <CardHeader>
          <CardTitle>What do you need the money for?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pay down bills, cover tuition, etc."
          />
          {error && <p className="text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
