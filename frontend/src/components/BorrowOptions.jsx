import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowOptions, requestLoan, transferNessie } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { getSessionValue, setSessionValue } from '../session';

export default function BorrowOptions() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [match, setMatch] = useState(null);
  const [transferMsg, setTransferMsg] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    async function loadOptions() {
      setLoading(true);
      try {
        // POST /borrow/options Request: {"user_id":string} Response: {"combos":[{"id":string,"total":number,"parts":[...]}]}
        const resp = await fetchBorrowOptions(user.userId);
        if (mounted) {
          setOptions(resp.combos);
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.detail || 'Could not load options.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOptions();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  async function handleRequest() {
    if (!selected) return;
    setError('');
    setRequesting(true);
    try {
      // POST /loans/request Request: {"user_id":string} Response: {"match_id":string,"total_amount":number,"lenders":[...],"risk_score":number,"ai_advice":string}
      const resp = await requestLoan(user.userId);
      setMatch(resp);
      setSessionValue('match_id', resp.match_id);
      setSessionValue('match_lenders', resp.lenders);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not request loan.');
    } finally {
      setRequesting(false);
    }
  }

  async function handleTransfer() {
    const matchId = match?.match_id || getSessionValue('match_id');
    if (!matchId) {
      setTransferMsg('Request a match first.');
      return;
    }
    setTransferMsg('');
    try {
      // POST /nessie/transfer -> {txn_id,message}
      const resp = await transferNessie(matchId);
      setTransferMsg(`${resp.message} (${resp.txn_id})`);
    } catch (err) {
      setTransferMsg(err.response?.data?.detail || 'Transfer failed');
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="card">
        <p>Loading options…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Community combos</h2>
      {error && <p>{error}</p>}
      {options.map((combo) => (
        <div
          key={combo.id}
          className={`combo-card ${selected?.id === combo.id ? 'selected' : ''}`}
          onClick={() => setSelected(combo)}
        >
          <h3>Total ${combo.total}</h3>
          {combo.parts.map((part) => (
            <p key={part.lenderId}>
              {part.lenderId}: ${part.amount} @ {part.rate}%
            </p>
          ))}
        </div>
      ))}
      <button className="bubble-btn primary" disabled={!selected || requesting} onClick={handleRequest}>
        {requesting ? 'Requesting…' : 'Request Loan'}
      </button>
      {match && (
        <div className="success-box">
          <p>Match #{match.match_id} ready. Risk score {match.risk_score}.</p>
          <p>{match.ai_advice}</p>
          <ul>
            {match.lenders.map((l) => (
              <li key={l.id}>
                {l.id}: ${l.amount} @ {l.rate}%
              </li>
            ))}
          </ul>
          <div className="inline-actions">
            <button className="bubble-btn" onClick={handleTransfer}>
              Simulate Transfer
            </button>
            <button className="bubble-btn" onClick={() => navigate('/post/preview')}>
              Share to Community (optional)
            </button>
          </div>
          {transferMsg && <p>{transferMsg}</p>}
        </div>
      )}
    </div>
  );
}
