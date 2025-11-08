import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBorrowAmount } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { setSessionValue } from '../session';

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
    <form className="card" onSubmit={handleNext}>
      <h2>How much do you need?</h2>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" min="0" />
      {ENABLE_KNOT_LINK && <p className="small-link">Link Knot account (coming soon)</p>}
      {error && <p>{error}</p>}
      <button className="bubble-btn primary" type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
