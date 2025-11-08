import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowRisk, postBorrowDecline } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';

export default function BorrowRisk() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [risk, setRisk] = useState(null);
  const [decline, setDecline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    async function loadRisk() {
      setLoading(true);
      try {
        // GET /borrow/risk -> {"score":0-100,"label":"low|med|high","explanation":string,"recommendation":"yes|maybe|no"}
        const resp = await fetchBorrowRisk(user.userId);
        if (mounted) {
          setRisk(resp);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.detail || 'Could not fetch risk.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadRisk();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  async function handleDecline() {
    setDeclineLoading(true);
    try {
      // POST /borrow/decline -> {"feedback":string}
      const resp = await postBorrowDecline(user.userId);
      setDecline(resp.feedback);
    } catch (err) {
      setDecline(err.response?.data?.detail || 'Could not fetch feedback.');
    } finally {
      setDeclineLoading(false);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="card">
        <p>Loading risk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  }

  if (!risk) return null;

  const showOptions = risk.recommendation === 'yes' || risk.recommendation === 'maybe';

  return (
    <div className="card">
      <h2>Readiness check</h2>
      <p>Score: {risk.score}</p>
      <p>{risk.explanation}</p>
      <div className="gauge">
        <div className="gauge-track">
          <div className="gauge-segment red" />
          <div className="gauge-segment amber" />
          <div className="gauge-segment green" />
        </div>
        <div className="gauge-needle" style={{ left: `calc(${risk.score}% - 2px)` }} />
      </div>
      <h3>{risk.recommendation.toUpperCase()}</h3>
      {showOptions ? (
        <button className="bubble-btn primary" onClick={() => navigate('/borrow/options')}>
          See Options
        </button>
      ) : (
        <>
          <button className="bubble-btn" onClick={handleDecline} disabled={declineLoading}>
            {declineLoading ? 'Thinking…' : 'Why?'}
          </button>
          {decline && (
            <div>
              <p>{decline}</p>
              <div className="inline-actions">
                <button className="bubble-btn" onClick={() => navigate('/dashboard/borrower')}>
                  Dashboard
                </button>
                <button className="bubble-btn" onClick={() => navigate('/')}>Try later</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
