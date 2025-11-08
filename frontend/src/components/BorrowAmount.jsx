import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBorrowAmount } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { setSessionValue } from '../session';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ENABLE_KNOT_LINK = false;

export default function BorrowAmount() {
  const navigate = useNavigate();
  const user = useRequiredUser();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext(e) {
    e.preventDefault();
    const numeric = Number(amount);
    if (!numeric) {
      setError('Enter an amount.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /borrow/amount Request: {"user_id":string,"amount":number} Response: {"ok":true}
      await postBorrowAmount({ user_id: user.userId, amount: numeric });
      setSessionValue('borrow_amount', numeric);
      navigate('/borrow/risk');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save amount.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleNext}>
      <Card className="mx-auto max-w-xl bg-card/90">
        <CardHeader>
          <CardTitle>How much do you need?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" min="0" />
          {ENABLE_KNOT_LINK && <p className="text-sm underline">Link Knot account (coming soon)</p>}
          {error && <p className="text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
