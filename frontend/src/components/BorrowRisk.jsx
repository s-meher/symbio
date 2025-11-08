import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowRisk, postBorrowDecline } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

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
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-6">
          <p>Loading risk...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!risk) return null;

  const showOptions = risk.recommendation === 'yes' || risk.recommendation === 'maybe';

  return (
    <Card className="mx-auto max-w-xl bg-card/90">
      <CardHeader>
        <CardTitle>Readiness check</CardTitle>
        <p className="text-sm text-muted-foreground">{risk.explanation}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm uppercase text-muted-foreground">Score</p>
          <p className="text-4xl font-semibold">{risk.score}</p>
        </div>
        <div>
          <div className="gauge-track">
            <div className="h-full flex-1 bg-rose-200" />
            <div className="h-full flex-1 bg-amber-200" />
            <div className="h-full flex-1 bg-emerald-200" />
          </div>
          <div className="gauge-needle" style={{ left: `calc(${risk.score}% - 2px)` }} />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Recommendation: {risk.recommendation.toUpperCase()}</p>
          {showOptions ? (
            <Button size="lg" onClick={() => navigate('/borrow/options')}>
              See options
            </Button>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" onClick={handleDecline} disabled={declineLoading}>
                {declineLoading ? 'Thinking…' : 'Why?'}
              </Button>
              {decline && (
                <div className="space-y-3 rounded-2xl border-2 border-dashed border-border bg-white/70 p-4 text-sm">
                  <p>{decline}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => navigate('/dashboard/borrower')}>
                      Dashboard
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                      Try later
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
