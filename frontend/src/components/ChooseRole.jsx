import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import { getUser, saveUser } from '../storage';

const DEFAULT_GEO = { lat: 40.35, lng: -74.66 };

export default function ChooseRole() {
  const navigate = useNavigate();
  const existing = getUser();
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function handleBorrowing() {
    setLoading('borrow');
    setError('');
    try {
      // POST /users/create Request: {role:'borrower', geo:{lat,lng}} Response: {user_id, role}
      const resp = await createUser({ role: 'borrower', geo: DEFAULT_GEO });
      saveUser({ userId: resp.user_id, role: resp.role });
      navigate('/borrow/reason');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start borrow flow.');
    } finally {
      setLoading('');
    }
  }

  function handleDashboard() {
    if (existing?.role === 'lender') {
      navigate('/dashboard/lender');
    } else if (existing?.role === 'borrower') {
      navigate('/dashboard/borrower');
    } else {
      navigate('/');
    }
  }

  return (
    <div className="card">
      <h2>Choose your path</h2>
      <div className="inline-actions">
        <button className="bubble-btn primary" onClick={handleBorrowing} disabled={loading === 'borrow'}>
          {loading === 'borrow' ? 'Starting…' : 'Borrowing'}
        </button>
        <button className="bubble-btn" onClick={() => navigate('/lender/setup')}>
          Lending
        </button>
      </div>
      {error && <p>{error}</p>}
      <div className="bottom-link">
        <button className="small-link" onClick={handleDashboard}>
          Dashboard
        </button>
      </div>
    </div>
  );
}
