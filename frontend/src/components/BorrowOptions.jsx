import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowOptions, requestLoan, transferNessie } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { getSessionValue, setSessionValue } from '../session';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

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
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-6">
          <p>Loading options…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl bg-card/90">
      <CardHeader>
        <CardTitle>Community combos</CardTitle>
        {error && <p className="text-destructive">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {options.map((combo) => {
            const active = selected?.id === combo.id;
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => setSelected(combo)}
                className={cn(
                  'w-full rounded-3xl border-2 border-dashed p-4 text-left transition',
                  active ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-white/80',
                )}
              >
                <p className="text-xl font-semibold">Total ${combo.total}</p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {combo.parts.map((part) => (
                    <li key={part.lenderId}>
                      {part.lenderId}: ${part.amount} @ {part.rate}%
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        <Button className="w-full" size="lg" disabled={!selected || requesting} onClick={handleRequest}>
          {requesting ? 'Requesting…' : 'Request loan'}
        </Button>
        {match && (
          <div className="space-y-3 rounded-3xl border-2 border-emerald-500 bg-emerald-50/70 p-4 text-sm">
            <p className="text-lg font-semibold">
              Match #{match.match_id} ready · Risk {match.risk_score}
            </p>
            <p>{match.ai_advice}</p>
            <ul className="list-disc pl-5">
              {match.lenders.map((l) => (
                <li key={l.id}>
                  {l.id}: ${l.amount} @ {l.rate}%
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleTransfer}>
                Simulate transfer
              </Button>
              <Button variant="ghost" onClick={() => navigate('/post/preview')}>
                Share to community (optional)
              </Button>
            </div>
            {transferMsg && <p className="text-muted-foreground">{transferMsg}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
