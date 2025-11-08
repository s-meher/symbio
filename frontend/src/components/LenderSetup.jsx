import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import { saveUser } from '../storage';

const DEFAULT_GEO = { lat: 40.35, lng: -74.66 };

export default function LenderSetup() {
  const navigate = useNavigate();
  const [capital, setCapital] = useState('');
  const [minRate, setMinRate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!capital) {
      setError('Enter capital.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /users/create Request: {role:'lender',geo,min_rate,max_amount} Response: {"user_id":string,"role":"lender"}
      const resp = await createUser({
        role: 'lender',
        geo: DEFAULT_GEO,
        min_rate: Number(minRate) || 2,
        max_amount: Number(capital),
      });
      saveUser({ userId: resp.user_id, role: resp.role });
      navigate('/dashboard/lender');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save lender.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Lender setup</h2>
      <label>
        How much capital do you have?
        <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />
      </label>
      <label>
        Minimum rate?
        <input type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)} />
      </label>
      {error && <p>{error}</p>}
      <button className="bubble-btn primary" type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
