import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyId } from '../api';
import { getUser } from '../storage';

export default function ScanID() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const user = getUser();

  async function handleScan() {
    setLoading(true);
    try {
      // POST /verify-id -> {"verified":true,"message":"ID verified"}
      const resp = await verifyId({ user_id: user?.userId });
      if (resp.verified) {
        setStatus('verified');
        setMessage(resp.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Could not verify.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Scan ID</h2>
      <p>We do this to verify users; locations we do not sell data.</p>
      <div className="inline-actions">
        <button className="bubble-btn" onClick={handleScan} disabled={loading}>
          {loading ? 'Scanning…' : 'Scan now'}
        </button>
        <button
          className="bubble-btn primary"
          disabled={status !== 'verified'}
          onClick={() => navigate('/choose-role')}
        >
          Continue
        </button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
